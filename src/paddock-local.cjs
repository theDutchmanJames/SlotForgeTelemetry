'use strict';
// "Paddock on this computer": a read-only reader for Paddock's trusted-local shared-history API.
// It sees every accepted race in the collection, both timing-v1 and history-v1 (Timing's Shared library).
// The descriptor holds a credential: it never leaves the main process, and is never logged or saved.
// Discovery follows Paddock's local-library-v1 handoff; the checks are adapted from SlotForge Timing's
// paddock-local-discovery.js so both clients apply the same rules.
const fs=require('node:fs'),fsp=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),{execFile}=require('node:child_process');
const {validatePayload}=require('./paddock-validation.cjs');
const projection=require('./shared-history-projection.cjs');

const ID=/^[A-Za-z0-9_-]{1,100}$/,KEY=/^[a-f0-9]{64}\.json$/,HEX=/^[a-f0-9]{64}$/;
const MAX_BYTES=9*1024*1024,MAX_CACHE=200*1024*1024,MAX_SESSIONS=10000,MAX_LAPS=50000,MAX_PAGES=400;

// ---------- Discovery ----------
function directory(platform=process.platform,env=process.env,home=os.homedir()){
 const base=platform==='win32'?env.LOCALAPPDATA:platform==='darwin'?path.join(home,'Library','Application Support'):env.XDG_RUNTIME_DIR||env.XDG_STATE_HOME||path.join(home,'.local','state');
 if(!base||!path.isAbsolute(base))throw Error('A private user folder is needed to find Paddock on this computer.');
 return path.join(base,platform==='linux'?'slotforge':'SlotForge','local-libraries','v1');
}
function descriptor(v){
 const keys=['format','version','instanceId','pid','address','token','databaseId','name'];
 if(!v||Object.keys(v).length!==keys.length||keys.some(k=>!Object.hasOwn(v,k))||v.format!=='slotforge-local-library'||v.version!==1||typeof v.instanceId!=='string'||!ID.test(v.instanceId)||typeof v.databaseId!=='string'||!ID.test(v.databaseId)||!Number.isSafeInteger(v.pid)||v.pid<1||typeof v.name!=='string'||v.name.length>200||typeof v.token!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(v.token)||typeof v.address!=='string'||!/^http:\/\/127\.0\.0\.1:[0-9]{1,5}$/.test(v.address))throw Error('Invalid local Paddock discovery information.');
 const u=new URL(v.address);if(!u.port||Number(u.port)>65535||u.origin!==v.address)throw Error('Invalid local Paddock endpoint.');return v;
}
async function windowsPermissions(folder,names){
 const script=`$ErrorActionPreference='Stop'
$ProgressPreference='SilentlyContinue'
$folder=$env:SLOTFORGE_CHECK_DIRECTORY
$sid=[Security.Principal.WindowsIdentity]::GetCurrent().User
function Assert-Private($p){
 $item=Get-Item -LiteralPath $p -Force
 if(($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0){throw 'Redirected discovery'}
 $acl=if($item -is [IO.DirectoryInfo]){[IO.Directory]::GetAccessControl($p)}else{[IO.File]::GetAccessControl($p)}
 if($acl.GetOwner([Security.Principal.SecurityIdentifier]).Value -ne $sid.Value){throw 'Wrong discovery owner'}
 foreach($r in $acl.GetAccessRules($true,$true,[Security.Principal.SecurityIdentifier])){
  if($r.AccessControlType -eq 'Allow' -and $r.IdentityReference.Value -ne $sid.Value){throw 'Discovery is not private'}
 }
}
Assert-Private $folder
$valid=@(foreach($name in (ConvertFrom-Json $env:SLOTFORGE_CHECK_FILES)){
 try{Assert-Private (Join-Path $folder $name);$name}catch{}
})
ConvertTo-Json -InputObject $valid -Compress`;
 return new Promise((resolve,reject)=>execFile('powershell.exe',['-NoProfile','-NonInteractive','-EncodedCommand',Buffer.from(script,'utf16le').toString('base64')],{windowsHide:true,timeout:15000,maxBuffer:16384,env:{...process.env,SLOTFORGE_CHECK_DIRECTORY:folder,SLOTFORGE_CHECK_FILES:JSON.stringify(names)}},(e,out)=>{
  const failure=()=>reject(Error('Telemetry could not confirm that Paddock\'s local connection details are private to you. Turn "Paddock on this computer" off and on again in Paddock.'));
  if(e)return failure();try{const valid=JSON.parse(out||'[]');const list=Array.isArray(valid)?valid:[valid];if(list.some(n=>!names.includes(n)))return failure();resolve(list);}catch{failure();}
 }));
}
async function scan({folder=directory(),platform=process.platform,uid=process.getuid?.(),checkWindows=windowsPermissions}={}){
 try{for(let p=folder;;p=path.dirname(p)){const s=await fsp.lstat(p);if(s.isSymbolicLink())throw Error('Paddock\'s local connection folder is redirected; Telemetry will not use it.');if(p===path.dirname(p))break;}}
 catch(e){if(e.code==='ENOENT')return [];throw e;}
 const stat=await fsp.lstat(folder),privateStat=s=>s.uid===uid&&(s.mode&0o077)===0;
 if(!stat.isDirectory()||platform!=='win32'&&!privateStat(stat))throw Error('Paddock\'s local connection folder is not private to this user.');
 const names=(await fsp.readdir(folder)).filter(n=>KEY.test(n)).sort();if(names.length>64)throw Error('Too many local Paddock descriptors.');
 if(!names.length)return [];
 const permitted=platform==='win32'?await checkWindows(folder,names):names,found=[];
 for(const name of names){
  if(!permitted.includes(name))continue;
  let handle;try{
   const file=path.join(folder,name),before=await fsp.lstat(file);
   if(!before.isFile()||before.isSymbolicLink()||before.size>8192||platform!=='win32'&&!privateStat(before))throw Error('Unprotected descriptor.');
   handle=await fsp.open(file,'r');const opened=await handle.stat();
   if(!opened.isFile()||opened.ino!==before.ino||opened.dev!==before.dev||opened.size>8192)throw Error('Descriptor changed while reading.');
   const buffer=Buffer.alloc(8193),{bytesRead}=await handle.read(buffer,0,buffer.length,0);if(bytesRead>8192)throw Error('Descriptor too large.');
   found.push({...descriptor(JSON.parse(buffer.subarray(0,bytesRead).toString('utf8'))),key:name});
  }catch{/* Stale or unsafe entries are skipped, not fatal for the others. */}finally{await handle?.close();}
 }
 return found;
}

// ---------- Cache ----------
function canonical(v){return Array.isArray(v)?'['+v.map(canonical).join(',')+']':v&&typeof v==='object'?'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}':JSON.stringify(v);}
const hash=v=>crypto.createHash('sha256').update(canonical(v)).digest('hex');
const accepted=a=>a&&Number.isSafeInteger(a.revision)&&a.revision>=1&&a.revision<=1000000&&HEX.test(a.contentHash)&&['active','withdrawn'].includes(a.state);
const sameAccepted=(a,b)=>a&&b&&a.revision===b.revision&&a.contentHash===b.contentHash&&a.state===b.state;
// Every stored session is re-verified against the hash Paddock accepted, so a damaged cache is never analysed.
function checkEntry(e,databaseId){
 if(!e||!ID.test(e.sourceId)||!ID.test(e.sessionId)||!['timing-v1','history-v1'].includes(e.format)||!accepted(e.accepted))throw Error('Invalid saved session identity.');
 if(e.accepted.state==='withdrawn'){if(e.body!==null)throw Error('Withdrawn sessions keep no body.');return e;}
 if(hash(e.body)!==e.accepted.contentHash)throw Error('Saved session does not match its Paddock content hash.');
 if(e.format==='timing-v1'){validatePayload(e.body,{stored:true});if(e.body.databaseId!==databaseId||e.body.source.id!==e.sourceId||e.body.sessionId!==e.sessionId||e.body.revision!==e.accepted.revision)throw Error('Saved session identity mismatch.');}
 else projection.checkBundle(e.body);
 return e;
}
function checkCache(data){
 if(data?.version!==1||!Array.isArray(data.hosts)||data.hosts.length>20)throw Error('Invalid shared-history cache.');
 let total=0;const ids=new Set();
 for(const h of data.hosts){
  if(!ID.test(h.id)||ids.has(h.id)||typeof h.name!=='string'||h.name.length>200||typeof h.recoveryId!=='string'||!Number.isFinite(Date.parse(h.syncedAt))||!Array.isArray(h.sessions))throw Error('Invalid saved Paddock collection.');ids.add(h.id);
  const keys=new Set();for(const e of h.sessions){if(++total>MAX_SESSIONS)throw Error('Too many saved sessions.');const k=JSON.stringify([e?.sourceId,e?.sessionId]);if(keys.has(k))throw Error('Duplicate saved session.');keys.add(k);checkEntry(e,h.id);}
 }
 return data;
}

// ---------- Paddock car catalogue (scalable-v1, read-only) ----------
const MAX_PHOTO=8*1024*1024,PHOTO=/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/;
const short=(v,max=200)=>typeof v==='string'&&v.length<=max;
function checkTechnical(t){if(t===null)return null;if(!t||typeof t!=='object'||Array.isArray(t)||Object.keys(t).length>100||Object.entries(t).some(([k,v])=>!short(k,100)||!short(v,20000)))throw Error('Invalid car configuration.');return Object.fromEntries(Object.entries(t));}
function checkCarMeta(m){
 if(!m||!ID.test(m.id)||!Number.isSafeInteger(m.revision)||m.revision<0||!['name','maker','marque','model','scale','raceClass','availability'].every(k=>short(m[k]??''))||typeof m.archived!=='boolean')throw Error('Invalid Paddock car.');
 if(m.media!==null&&(!m.media||!HEX.test(m.media.hash)||!['image/png','image/jpeg','image/webp'].includes(m.media.mime)||!Number.isSafeInteger(m.media.size)||m.media.size<1||m.media.size>MAX_PHOTO||m.media.url!==`/v1/scalable/cars/${m.id}/media/${m.media.hash}`))throw Error('Invalid Paddock car photo reference.');
 return m;
}
const carEntry=(m,technical)=>({id:m.id,revision:m.revision,name:m.name,maker:m.maker||'',marque:m.marque||'',model:m.model||'',scale:m.scale||'',raceClass:m.raceClass||'',availability:m.availability||'',archived:m.archived,technical,photo:m.media?{hash:m.media.hash,mime:m.media.mime}:null});
function checkCars(data){
 if(data?.version!==1||!Array.isArray(data.hosts)||data.hosts.length>20)throw Error('Invalid Paddock car cache.');
 for(const h of data.hosts){if(!ID.test(h.id)||!short(h.name)||!Number.isFinite(Date.parse(h.syncedAt))||typeof h.cursor!=='string'||!Array.isArray(h.cars)||h.cars.length>10000)throw Error('Invalid Paddock car cache.');
  for(const c of h.cars){checkCarMeta({...c,media:null});checkTechnical(c.technical);if(c.photo!==null&&(!HEX.test(c.photo?.hash)||!['image/png','image/jpeg','image/webp'].includes(c.photo.mime)))throw Error('Invalid cached photo.');}}
 return data;
}

// ---------- Client ----------
function changed(message='Paddock changed during the import. Trying again…'){const e=Error(message);e.apiCode='SNAPSHOT_CHANGED';return e;}
function networkError(e){
 if(e?.name==='AbortError'||e?.name==='TimeoutError')return e;
 const code=e?.cause?.code||e?.code;
 const err=Error(code==='ECONNREFUSED'?'Paddock is not answering on this computer. Start Paddock (or reopen it from the tray) and try again.':'Could not reach Paddock on this computer'+(code?' ('+code+')':'')+'.');err.rediscover=true;return err;
}
class LocalHistoryClient{
 constructor(file,{folder,scanner=scan,requestTimeout=15000,transferTimeout=600000}={}){
  this.file=file;this.settingsFile=path.join(path.dirname(file),'paddock-local-v1.json');this.folder=folder;this.scanner=scanner;
  this.timeout=requestTimeout;this.transferTimeout=transferTimeout;this.connection=null;this.busy=false;this.abort=new AbortController();this.generation=0;
  this.data={version:1,hosts:[]};this.loadError='';this.lastImport=null;
  try{if(fs.existsSync(file)){if(fs.statSync(file).size>MAX_CACHE)throw Error('Cache exceeds 200 MiB.');this.data=checkCache(JSON.parse(fs.readFileSync(file,'utf8')));}}
  catch{this.loadError='The saved races from Paddock on this computer could not be read. They are kept untouched; choose Rebuild to archive them and import again.';}
  this.carsFile=path.join(path.dirname(file),'paddock-cars-v1.json');this.photoDir=path.join(path.dirname(file),'paddock-car-photos');this.cars={version:1,hosts:[]};this.carsError='';
  try{if(fs.existsSync(this.carsFile))this.cars=checkCars(JSON.parse(fs.readFileSync(this.carsFile,'utf8')));}catch{this.carsError='Saved Paddock cars could not be read; they will be downloaded again.';}
  this.selected=null;try{const s=JSON.parse(fs.readFileSync(this.settingsFile,'utf8'));if(s?.version===1&&ID.test(s.databaseId)&&typeof s.name==='string'&&s.name.length<=200)this.selected={databaseId:s.databaseId,name:s.name};}catch{/* Nothing selected yet. */}
 }
 // The renderer only ever sees names and IDs, never addresses or tokens.
 status(){return {connection:this.connection?{id:this.connection.databaseId,name:this.connection.name}:null,selected:this.selected,error:this.loadError,lastImport:this.lastImport};}
 hosts(){return this.data.hosts.map(h=>({id:h.id,name:h.name,kind:'local',syncedAt:h.syncedAt,revision:0,results:h.sessions.flatMap(e=>{try{return [projection.result(e,h.id)];}catch{return [];}})}));}
 async libraries(){return (await this.scanner({folder:this.folder||directory()})).map(d=>({databaseId:d.databaseId,name:d.name}));}
 async exclusive(task){if(this.busy)throw Error('Wait for the current Paddock import to finish.');this.busy=true;try{return await task();}finally{this.busy=false;}}
 async connect(input={}){return this.exclusive(async()=>{
  const all=await this.scanner({folder:this.folder||directory()}),wanted=input.databaseId??this.selected?.databaseId;
  const matches=wanted?all.filter(d=>d.databaseId===wanted):all;
  if(!all.length)throw Error('Paddock was not found on this computer. Start Paddock and check that Connections → Paddock on this computer is turned on.');
  if(!matches.length)throw Error('That Paddock collection is not open on this computer right now.');
  if(matches.length>1&&!wanted){const e=Error('Several Paddock collections are open. Choose one.');e.choices=all.map(d=>({databaseId:d.databaseId,name:d.name}));throw e;}
  // A stale descriptor after a crash is normal: try each candidate for this collection.
  let last;for(const d of matches){try{return await this.open(d);}catch(e){last=e;}}
  throw last;
 });}
 async open(d){
  this.disconnect();const generation=this.generation;
  const c={descriptor:d,databaseId:d.databaseId,name:d.name};
  const status=await this.request(c,'/v1/status',{status:true});
  if(generation!==this.generation)throw Error('Connection cancelled.');
  if(status?.protocol!==2||status.id!==d.databaseId||status.localInstanceId!==d.instanceId||typeof status.name!=='string')throw Error('This is not the Paddock collection Telemetry expected. Try again.');
  if(status.permissions?.timingResults!==true)throw Error('Paddock on this computer does not allow reading race results.');
  const cap=status.capabilities?.sharedHistory;
  if(cap?.version!==1||cap.features?.historyReads!==true||cap.sessions!=='/v1/shared-history/sessions')throw Error('This Paddock version cannot share its race history yet. Update Paddock.');
  c.name=status.name;this.connection=c;this.selected={databaseId:c.databaseId,name:c.name};
  try{fs.mkdirSync(path.dirname(this.settingsFile),{recursive:true});fs.writeFileSync(this.settingsFile,JSON.stringify({version:1,...this.selected}));}catch{/* Convenience only. */}
  return this.status();
 }
 disconnect(){this.abort.abort();this.abort=new AbortController();this.generation++;this.connection=null;return this.status();}
 forget(){this.disconnect();this.selected=null;try{fs.rmSync(this.settingsFile,{force:true});}catch{}return this.status();}
 async request(c,route,{status=false,signal=this.abort.signal}={}){
  const d=c.descriptor;let response;
  try{response=await fetch(d.address+route,{method:'GET',redirect:'error',signal:AbortSignal.any([signal,AbortSignal.timeout(this.timeout)]),
   headers:{Authorization:'Bearer '+d.token,'X-SlotForge-Instance':d.instanceId,...(status?{'X-SlotForge-Extensions':'shared-history-v1'}:{'X-SlotForge-Database':c.databaseId})}});}
  catch(e){throw networkError(e);}
  if(Number(response.headers.get('content-length'))>MAX_BYTES){await response.body?.cancel();throw Error('Paddock response exceeds the size limit.');}
  if(!response.body)throw Error('Paddock returned an empty response.');
  const reader=response.body.getReader(),chunks=[];let size=0;
  try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>MAX_BYTES){await reader.cancel();throw Error('Paddock response exceeds the size limit.');}chunks.push(Buffer.from(value));}}finally{reader.releaseLock();}
  let result;try{result=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Buffer.concat(chunks)));}catch{throw Error('Paddock returned invalid JSON.');}
  if(!response.ok){
   const e=Error(typeof result?.error==='string'?result.error.slice(0,500):'Paddock request failed ('+response.status+').');e.httpStatus=response.status;e.apiCode=result?.code;
   // Paddock rotates the credential on every restart: rediscover instead of failing.
   if(response.status===401||e.apiCode==='INSTANCE_CHANGED')e.rediscover=true;
   if(['SNAPSHOT_CHANGED','RESULT_CHANGED','SESSION_WITHDRAWN'].includes(e.apiCode))e.retry=true;
   if(e.apiCode==='LOCAL_UNAVAILABLE'||e.apiCode==='HOST_CLOSING')e.message='Paddock is busy (replacing its collection or closing). Try again in a moment.';
   throw e;
  }
  return result;
 }
 async sync(){return this.exclusive(async()=>{
  if(this.loadError)throw Error(this.loadError);if(!this.connection)throw Error('Connect to Paddock on this computer first.');
  for(let attempt=0;;attempt++){
   try{return await this.syncOnce();}
   catch(e){
    if(attempt>=3||!this.connection)throw e;
    if(e.rediscover){const d=(await this.scanner({folder:this.folder||directory()})).find(x=>x.databaseId===this.connection.databaseId);if(!d)throw Error('Paddock on this computer has closed. Start Paddock and try again.');this.connection={...this.connection,descriptor:d};continue;}
    if(e.apiCode==='SNAPSHOT_CHANGED'||e.retry){await new Promise(r=>setTimeout(r,150*(attempt+1)));continue;}
    throw e;
   }
  }
 });}
 async syncOnce(){
  const c=this.connection,generation=this.generation,signal=AbortSignal.any([this.abort.signal,AbortSignal.timeout(this.transferTimeout)]);
  const get=route=>this.request(c,route,{signal});
  const first=await get('/v1/shared-history/status');
  if(first?.version!==1||first.databaseId!==c.databaseId||typeof first.recoveryId!=='string'||typeof first.cursor!=='string')throw Error('Invalid Paddock history status.');
  // 1. The complete listing, pinned to one snapshot by Paddock's signed page tokens.
  const entries=[],seen=new Set();let page=null,snapshot=null,pages=0,unsupported=0;
  do{
   const list=await get('/v1/shared-history/sessions?state=all&limit=50'+(page?'&page='+encodeURIComponent(page):''));
   if(list?.version!==1||list.databaseId!==c.databaseId||list.recoveryId!==first.recoveryId||typeof list.snapshot!=='string'||!Array.isArray(list.entries)||list.entries.length>50||(list.nextPage!==null&&typeof list.nextPage!=='string'))throw Error('Invalid Paddock history listing.');
   if(snapshot!==null&&list.snapshot!==snapshot)throw changed();snapshot=list.snapshot;
   for(const e of list.entries){
    const k=JSON.stringify([e?.sourceId,e?.sessionId]);
    if(!ID.test(e?.sourceId)||!ID.test(e.sessionId)||!accepted(e.accepted)||!HEX.test(e.resultToken)||seen.has(k))throw Error('Invalid or duplicate Paddock history entry.');seen.add(k);
    if(!['timing-v1','history-v1'].includes(e.format)){unsupported++;continue;}
    entries.push(e);if(entries.length>MAX_SESSIONS)throw Error('This collection has more than 10,000 sessions.');
   }
   page=list.nextPage;if(++pages>MAX_PAGES)throw Error('Paddock history listing is too long.');
  }while(page);
  // 2. Download only new or changed sessions; verify each against its accepted content hash.
  const old=this.data.hosts.find(h=>h.id===c.databaseId),cached=new Map((old?.sessions||[]).map(e=>[JSON.stringify([e.sourceId,e.sessionId]),e]));
  const sessions=[];let downloaded=0,skipped=0,bytes=0;
  for(const e of entries){
   if(generation!==this.generation)throw Error('Import cancelled.');
   const prior=cached.get(JSON.stringify([e.sourceId,e.sessionId]));
   let entry;
   if(prior&&prior.format===e.format&&sameAccepted(prior.accepted,e.accepted))entry=prior;
   else if(e.accepted.state==='withdrawn')entry={format:e.format,sourceId:e.sourceId,sessionId:e.sessionId,accepted:e.accepted,body:null};
   else{try{entry=await this.download(c,e,get);downloaded++;}catch(err){if(err.retry||err.rediscover||err.apiCode==='SNAPSHOT_CHANGED'||err.name==='AbortError'||err.name==='TimeoutError'||err.httpStatus>=500)throw err;skipped++;continue;}}
   bytes+=Buffer.byteLength(JSON.stringify(entry));if(bytes>MAX_CACHE)throw Error('Imported races exceed 200 MiB.');
   sessions.push(entry);
  }
  // 3. Nothing may have changed while downloading; otherwise retry from a fresh listing.
  const last=await get('/v1/shared-history/status');
  if(last?.databaseId!==c.databaseId||last.recoveryId!==first.recoveryId||last.cursor!==snapshot)throw changed();
  if(generation!==this.generation||this.connection!==c)throw Error('Import cancelled.');
  const next={version:1,hosts:[...this.data.hosts.filter(h=>h.id!==c.databaseId),{id:c.databaseId,name:c.name,recoveryId:first.recoveryId,syncedAt:new Date().toISOString(),sessions}]};
  this.persist(next);this.data=next;
  this.lastImport={at:next.hosts.at(-1).syncedAt,sessions:sessions.length,downloaded,skipped,unsupported};
  // The car catalogue follows the races; a problem there never undoes a completed race import.
  try{await this.syncCars(c,get);this.carsError='';}catch(e){if(e.name==='AbortError'||this.connection!==c)throw e;this.carsError='Paddock cars could not be refreshed: '+e.message;}
  return {...this.status(),downloaded,skipped,unsupported};
 }
 // Paddock owns its cars. Telemetry keeps a read-only copy: metadata, current technical configuration and photo.
 carsView(){return {hosts:this.cars.hosts.map(h=>({id:h.id,name:h.name,syncedAt:h.syncedAt,cars:h.cars})),error:this.carsError};}
 async syncCars(c,get){
  const old=this.cars.hosts.find(h=>h.id===c.databaseId),cached=new Map((old?.cars||[]).map(x=>[x.id,x])),invalid=new Set();let reset=!old;
  // Changes since the last listing: Paddock can change a car's configuration without changing its revision.
  if(old){try{let cursor=old.cursor;for(let i=0;i<100;i++){const ch=await get('/v1/scalable/changes?kind=cars&cursor='+encodeURIComponent(cursor));if(ch?.version!==1||ch.kind!=='cars'||typeof ch.cursor!=='string'||!Array.isArray(ch.entries))throw Error('Invalid car change feed.');if(ch.resetRequired){reset=true;break;}for(const e of ch.entries)if(ID.test(e?.carId))invalid.add(e.carId);cursor=ch.cursor;if(!ch.more)break;}}
   catch(e){if(e.name==='AbortError')throw e;reset=true;}}
  const list=[];let offset=0,snapshot=null,cursor=null,pages=0;
  do{
   const page=await get('/v1/scalable/cars'+(snapshot?'?offset='+offset+'&snapshot='+encodeURIComponent(snapshot):''));
   if(page?.version!==1||page.databaseId!==c.databaseId||typeof page.snapshot!=='string'||typeof page.cursor!=='string'||!Array.isArray(page.cars)||page.cars.length>50||(snapshot!==null&&page.snapshot!==snapshot))throw Error('Invalid Paddock car listing.');
   if(snapshot===null){snapshot=page.snapshot;cursor=page.cursor;}
   list.push(...page.cars.map(checkCarMeta));offset=page.nextOffset;
   if(offset!==null&&(!Number.isSafeInteger(offset)||offset!==list.length))throw Error('Invalid Paddock car pagination.');
   if(++pages>200)throw Error('Too many Paddock cars.');
  }while(offset!==null);
  const cars=[];
  for(const m of list){
   const prior=cached.get(m.id);let technical=prior?.technical??null;
   if(!prior||reset||invalid.has(m.id)||prior.revision!==m.revision){
    const p=await get('/v1/scalable/cars/'+m.id+'/profile');
    if(p?.version!==1||p.profile?.car?.id!==m.id||p.profile.databaseId!==c.databaseId)throw Error('Invalid Paddock car profile.');
    technical=checkTechnical(p.profile.configuration?.technical??null);
   }
   if(m.media&&!fs.existsSync(path.join(this.photoDir,m.media.hash+'.txt')))await this.downloadPhoto(m,get);
   cars.push(carEntry(m,technical));
  }
  const next={version:1,hosts:[...this.cars.hosts.filter(h=>h.id!==c.databaseId),{id:c.databaseId,name:c.name,syncedAt:new Date().toISOString(),cursor,cars}]};
  checkCars(next);this.writeJson(this.carsFile,next);this.cars=next;
  // Remove photos no collection uses any more.
  const used=new Set(next.hosts.flatMap(h=>h.cars.map(x=>x.photo?.hash).filter(Boolean)));
  try{for(const f of fs.readdirSync(this.photoDir))if(/^[a-f0-9]{64}\.txt$/.test(f)&&!used.has(f.slice(0,64)))fs.rmSync(path.join(this.photoDir,f),{force:true});}catch{/* No photos yet. */}
 }
 async downloadPhoto(m,get){
  const chunks=[];let offset=0;
  for(let i=0;i<64&&offset!==null;i++){
   const r=await get(m.media.url+'?offset='+offset);
   if(r?.version!==1||r.hash!==m.media.hash||r.offset!==offset||r.size!==m.media.size||typeof r.data!=='string')throw Error('Invalid Paddock photo chunk.');
   const bytes=Buffer.from(r.data,'base64');chunks.push(bytes);offset=r.nextOffset;
   if(offset!==null&&offset!==r.offset+bytes.length)throw Error('Invalid Paddock photo chunk order.');
  }
  const all=Buffer.concat(chunks);
  if(all.length!==m.media.size||crypto.createHash('sha256').update(all).digest('hex')!==m.media.hash)throw Error('A Paddock photo did not match its fingerprint.');
  const uri=all.toString('utf8');if(!PHOTO.test(uri)||!uri.startsWith('data:'+m.media.mime))throw Error('Unsupported Paddock photo.');
  fs.mkdirSync(this.photoDir,{recursive:true});this.writeJson(path.join(this.photoDir,m.media.hash+'.txt'),uri,false);
 }
 // A verified photo as a data URI, only for a hash the current catalogue uses.
 photo(hash){
  if(!HEX.test(hash||'')||!this.cars.hosts.some(h=>h.cars.some(c=>c.photo?.hash===hash)))return null;
  try{const uri=fs.readFileSync(path.join(this.photoDir,hash+'.txt'),'utf8');return PHOTO.test(uri)&&crypto.createHash('sha256').update(uri).digest('hex')===hash?uri:null;}catch{return null;}
 }
 writeJson(file,value,json=true){const text=json?JSON.stringify(value):value;const temp=file+'.'+crypto.randomUUID()+'.tmp';let fd;try{fd=fs.openSync(temp,'wx');fs.writeFileSync(fd,text);fs.fsyncSync(fd);fs.closeSync(fd);fd=undefined;fs.renameSync(temp,file);}catch(e){if(fd!==undefined)fs.closeSync(fd);try{fs.unlinkSync(temp);}catch{}throw e;}}
 async download(c,e,get){
  const base='/v1/shared-history/sessions/'+e.sourceId+'/'+e.sessionId;
  const head=await get(base);
  if(head?.version!==1||head.databaseId!==c.databaseId||head.sourceId!==e.sourceId||head.sessionId!==e.sessionId||!sameAccepted(head.accepted,e.accepted)||head.resultToken!==e.resultToken||!head.body||head.body.format!==e.format||!Array.isArray(head.lapCounts))throw Object.assign(changed(),{retry:true});
  const body=structuredClone(head.body),counts=new Map(head.lapCounts.map(x=>[x.participantId,x.count]));
  const participants=e.format==='timing-v1'?body.payload?.participants:body.race?.participants;
  if(!Array.isArray(participants)||participants.length>1000)throw Error('Invalid participants.');
  let total=0;
  for(const p of participants){
   if(!ID.test(p?.id))throw Error('Invalid participant.');
   const expected=counts.get(p.id)||0,laps=[];total+=expected;if(total>MAX_LAPS)throw Error('Session exceeds 50,000 laps.');
   for(let offset=0;expected&&offset!==null;){
    const pageData=await get(base+'/laps/'+p.id+'?token='+e.resultToken+'&offset='+offset);
    if(pageData?.resultToken!==e.resultToken||pageData.participantId!==p.id||pageData.format!==e.format||pageData.offset!==offset||pageData.total!==expected||!Array.isArray(pageData.laps)||pageData.laps.length>250||(pageData.nextOffset!==null&&pageData.nextOffset!==offset+pageData.laps.length))throw Object.assign(changed(),{retry:true});
    laps.push(...pageData.laps);offset=pageData.nextOffset;
   }
   if(laps.length!==expected)throw Object.assign(changed(),{retry:true});
   p.laps=laps;
  }
  const value=e.format==='timing-v1'?body.payload:body;
  if(hash(value)!==e.accepted.contentHash)throw Error('Downloaded session does not match its Paddock content hash.');
  return checkEntry({format:e.format,sourceId:e.sourceId,sessionId:e.sessionId,accepted:e.accepted,body:value},c.databaseId);
 }
 persist(data){const text=JSON.stringify(data);if(Buffer.byteLength(text)>MAX_CACHE)throw Error('Imported races exceed 200 MiB.');fs.mkdirSync(path.dirname(this.file),{recursive:true});const temp=this.file+'.'+crypto.randomUUID()+'.tmp';let fd;try{fd=fs.openSync(temp,'wx');fs.writeFileSync(fd,text);fs.fsyncSync(fd);fs.closeSync(fd);fd=undefined;fs.renameSync(temp,this.file);}catch(e){if(fd!==undefined)fs.closeSync(fd);try{fs.unlinkSync(temp);}catch{}throw Error('Could not save imported races. Existing races are unchanged. '+e.message);}}
 rebuild(){if(this.busy)throw Error('Wait for the import to finish.');if(!this.loadError)throw Error('The saved races are readable; rebuilding is unnecessary.');const backup=this.file+'.unreadable-'+Date.now();if(fs.existsSync(this.file))fs.renameSync(this.file,backup);this.data={version:1,hosts:[]};this.loadError='';return {...this.status(),backup};}
}
module.exports={LocalHistoryClient,scan,directory,descriptor,checkCache,checkCars,hash};
