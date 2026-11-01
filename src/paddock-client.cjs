const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {validatePayload}=require('./paddock-validation.cjs');
const schema=require('./paddock-schema.cjs');
const MAX_BYTES=9*1024*1024,MAX_CACHE=200*1024*1024,MAX_SESSIONS=10000;
const id=x=>typeof x==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(x);
const int=x=>Number.isSafeInteger(x)&&x>=0;
const digest=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
function changed(message='Paddock results changed during transfer. Refresh again.'){const e=Error(message);e.apiCode='SNAPSHOT_CHANGED';return e;}
function canonical(v){return Array.isArray(v)?'['+v.map(canonical).join(',')+']':v&&typeof v==='object'?'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}':JSON.stringify(v);}
const hash=v=>crypto.createHash('sha256').update(canonical(v)).digest('hex');
function address(value){
 if(typeof value!=='string'||value.length>256)throw Error('Enter a local IPv4 address and port.');
 let u;try{u=new URL(value.includes('://')?value:'http://'+value);}catch{throw Error('Enter a local address such as 192.168.1.42:48210.');}
 const ip=u.hostname==='localhost'?'127.0.0.1':u.hostname,a=ip.split('.').map(Number);
 if(u.protocol!=='http:'||u.username||u.password||u.pathname!=='/'||u.search||u.hash||a.length!==4||a.some(n=>!Number.isInteger(n)||n<0||n>255)||!(a[0]===10||a[0]===127||a[0]===192&&a[1]===168||a[0]===172&&a[1]>=16&&a[1]<=31))throw Error('Use a local HTTP IPv4 address and port, without a path.');
 u.hostname=ip;return u.origin;
}
function verify(result,manifest,databaseId,revision,snapshot=null){
 if(result?.version!==1||result.databaseId!==databaseId||!int(result.databaseRevision)||(snapshot?result.snapshot!==snapshot:result.databaseRevision!==revision))throw changed();
 const p=result.payload,r=result.receipt;
 validatePayload(p,{stored:true});schema.validate(r,schema.schema.$defs.receipt);
 if(p.state==='active')for(const entry of p.participants)if(entry.configuration&&(entry.configuration.databaseId!==databaseId||entry.configuration.carId!==entry.carId))throw Error('The raced configuration belongs to another car or collection.');
 if(p.databaseId!==databaseId||p.source.id!==manifest.sourceId||p.sessionId!==manifest.sessionId||p.revision!==manifest.revision||p.state!==manifest.state||hash(p)!==manifest.contentHash||r.databaseId!==databaseId||r.sourceId!==p.source.id||r.sessionId!==p.sessionId||r.contentHash!==manifest.contentHash||r.revision!==p.revision||r.state!==p.state)throw Error('The downloaded result does not match its Paddock identity or revision.');
 if(manifest.receivedAt!==undefined&&manifest.receivedAt!==r.receivedAt)throw changed('Paddock receipt changed during transfer.');
 return {payload:p,receipt:r,...(manifest.resultHash?{resultHash:manifest.resultHash}:{})};
}
function checkCache(data){
 if(data?.version!==1||!Array.isArray(data.hosts)||data.hosts.length>50)throw Error('Invalid race-result cache.');
 const hostIds=new Set();let total=0;
 for(const h of data.hosts){
  if(!id(h.id)||hostIds.has(h.id)||typeof h.name!=='string'||h.name.length>200||!int(h.revision)||!Number.isFinite(Date.parse(h.syncedAt))||!Array.isArray(h.results))throw Error('Invalid saved Paddock collection.');hostIds.add(h.id);
  if(h.snapshot!==undefined&&!digest(h.snapshot))throw Error('Invalid saved snapshot.');
  const keys=new Set();for(const r of h.results){if(++total>MAX_SESSIONS)throw Error('Result library exceeds 10,000 sessions.');const p=r.payload,receipt=r.receipt;const key=JSON.stringify([p?.source?.id,p?.sessionId]);if(keys.has(key))throw Error('Duplicate saved result.');if(r.resultHash!==undefined&&!digest(r.resultHash))throw Error('Invalid saved result hash.');keys.add(key);verify({version:1,databaseId:h.id,databaseRevision:h.revision,payload:p,receipt},{sourceId:p?.source?.id,sessionId:p?.sessionId,revision:p?.revision,state:p?.state,contentHash:receipt?.contentHash},h.id,h.revision);}
 }
 return data;
}
class PaddockClient{
 constructor(file,{requestTimeout=15000,transferTimeout=180000}={}){this.file=file;this.timeout=requestTimeout;this.transferTimeout=transferTimeout;this.connection=null;this.busy=false;this.cooldowns=new Map();this.data={version:1,hosts:[]};this.loadError='';this.generation=0;this.abort=new AbortController();
  try{if(fs.existsSync(file)){if(fs.statSync(file).size>MAX_CACHE)throw Error('Cache exceeds 200 MiB.');this.data=checkCache(JSON.parse(fs.readFileSync(file,'utf8')));}}catch{this.loadError='The saved race-result cache is unreadable. It has been preserved. Use Settings → Paddock → Rebuild cache to archive it before downloading again.';}
 }
 view(){return {data:this.data,error:this.loadError,connection:this.connection?{id:this.connection.id,name:this.connection.name,address:this.connection.address,notifications:!!this.connection.changes,readyToWatch:!!this.connection.token}:null};}
 async request(base,password,route,expected,signal,timeout=this.timeout){
  const host=new URL(base).hostname,remaining=(this.cooldowns.get(host)||0)-Date.now();if(remaining>0)throw Error('Too many attempts. Retry in '+Math.ceil(remaining/1000)+' seconds.');
  const response=await fetch(base+route,{method:'GET',headers:{Authorization:'Bearer '+password,...(expected?{'X-SlotForge-Database':expected}:{})},redirect:'error',signal:AbortSignal.any([signal,AbortSignal.timeout(timeout)])});
  if(response.status===429){const seconds=Number(response.headers.get('retry-after'));this.cooldowns.set(host,Date.now()+Math.max(60,Number.isFinite(seconds)?Math.min(seconds,3600):60)*1000);}
  if(Number(response.headers.get('content-length'))>MAX_BYTES){await response.body?.cancel();throw Error('Paddock response exceeds the size limit.');}
  if(!response.body)throw Error('Paddock returned an empty response.');
  const reader=response.body.getReader(),chunks=[];let size=0;
  try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>MAX_BYTES){await reader.cancel();throw Error('Paddock response exceeds the size limit.');}chunks.push(Buffer.from(value));}}finally{reader.releaseLock();}
  let result;try{result=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Buffer.concat(chunks)));}catch{throw Error('Paddock returned invalid JSON.');}
  if(!response.ok){const e=Error(typeof result?.error==='string'?result.error.slice(0,500):'Paddock request failed ('+response.status+').');e.httpStatus=response.status;e.apiCode=result?.code;if(expected&&(response.status===401||response.status===403||e.apiCode==='DATABASE_MISMATCH'))this.disconnect();throw e;}return result;
 }
 async exclusive(task){if(this.busy)throw Error('Wait for the current Paddock operation to finish.');this.busy=true;try{return await task();}finally{this.busy=false;}}
 async connect(input){return this.exclusive(async()=>{
  const base=address(input?.address),password=input?.password;
  if(typeof password!=='string'||password.length<4||password.length>128||!/^[\x20-\x7e]+$/.test(password)||password!==password.trim())throw Error('Enter the Paddock password exactly, without spaces at either end.');
  this.disconnect();const generation=this.generation;
  const status=await this.request(base,password,'/v1/status',null,this.abort.signal);
  if(generation!==this.generation)throw Error('Connection cancelled.');
  if(status?.protocol!==2||!id(status.id)||!int(status.revision)||typeof status.name!=='string'||!status.name.trim()||status.name.length>200)throw Error('This is not a supported Paddock host.');
  if(status.capabilities?.telemetry?.version!==1)throw Error('This Paddock version does not support lap-result downloads. Update Paddock to a build with Telemetry results support, then restart hosting.');
  if(status.permissions?.timingResults!==true)throw Error('Use the Dealership password or the Timing credential; catalogue browsing access cannot read race results.');
  if(input.expectedId&&input.expectedId!==status.id)throw Error('A different Paddock database is at this address. Choose its host explicitly.');
  this.connection={id:status.id,name:status.name,address:base,password,changes:status.capabilities.telemetry.changes==='/v1/telemetry/changes',snapshots:status.capabilities.telemetry.snapshot===true,status:status.capabilities.telemetry.status==='/v1/telemetry/status',token:null};return this.view();
 });}
 disconnect(){this.abort.abort();this.abort=new AbortController();this.generation++;this.connection=null;return this.view();}
 async sync(){return this.exclusive(async()=>{
  const connection=this.connection;
  for(let attempt=0;;attempt++)try{return await this.syncOnce();}catch(e){
   if(e.apiCode!=='SNAPSHOT_CHANGED'||attempt>=2||!connection||this.connection!==connection)throw e;
   await new Promise(resolve=>setTimeout(resolve,100*(attempt+1)));
  }
 });}
 async syncOnce(){
  if(this.loadError)throw Error(this.loadError);if(!this.connection)throw Error('Connect to Paddock first.');
  const c=this.connection,generation=this.generation,signal=AbortSignal.any([this.abort.signal,AbortSignal.timeout(this.transferTimeout)]);
  const get=route=>this.request(c.address,c.password,route,c.id,signal);
  const manifests=[],seen=new Set();let offset=0,revision=null,name=c.name,token=null,snapshot=null;
  const pin=()=>snapshot?'snapshot='+snapshot:'revision='+revision;
  do{const page=await get('/v1/telemetry/results?offset='+offset+(revision===null?'':'&'+pin()));
   if(page?.version!==1||page.databaseId!==c.id||!int(page.databaseRevision)||typeof page.name!=='string'||page.name.length>200||!Array.isArray(page.entries)||page.entries.length>100)throw Error('Invalid Paddock result index.');
   if(c.snapshots){if(!digest(page.snapshot))throw Error('Invalid Paddock snapshot.');if(snapshot!==null&&snapshot!==page.snapshot)throw changed();snapshot=page.snapshot;}
   else if(revision!==null&&revision!==page.databaseRevision)throw changed();
   if(c.changes&&(typeof page.changeToken!=='string'||!page.changeToken||page.changeToken.length>256||token!==null&&token!==page.changeToken))throw Error('Invalid or changed Paddock notification token.');
   if(revision!==null&&name!==page.name)throw changed();
   revision=page.databaseRevision;name=page.name;token=page.changeToken??null;
   for(const m of page.entries){const key=JSON.stringify([m.sourceId,m.sessionId]);if(!id(m.sourceId)||!id(m.sessionId)||!Number.isSafeInteger(m.revision)||m.revision<1||m.revision>1000000||!['active','withdrawn'].includes(m.state)||!digest(m.contentHash)||(c.snapshots||m.resultHash!==undefined)&&!digest(m.resultHash)||seen.has(key)||manifests.length>=MAX_SESSIONS)throw Error('Invalid or duplicate Paddock session.');seen.add(key);manifests.push(m);}
   if(page.nextOffset===null)break;if(!int(page.nextOffset)||page.nextOffset<=offset||page.nextOffset!==manifests.length)throw Error('Invalid result pagination.');offset=page.nextOffset;
  }while(true);
  const old=this.data.hosts.find(h=>h.id===c.id),cached=new Map((old?.results||[]).map(r=>[JSON.stringify([r.payload.source.id,r.payload.sessionId]),r]));
  const results=[];let bytes=0,downloaded=0;
  for(const m of manifests){let r=cached.get(JSON.stringify([m.sourceId,m.sessionId]));if(!r||r.receipt.contentHash!==m.contentHash||r.payload.revision!==m.revision||m.resultHash!==undefined&&r.resultHash!==m.resultHash){const response=await get('/v1/telemetry/results/'+m.sourceId+'/'+m.sessionId+'?'+pin());r=verify(response,m,c.id,revision,snapshot);downloaded++;}results.push(r);bytes+=Buffer.byteLength(JSON.stringify(r));if(bytes>MAX_CACHE)throw Error('Result library exceeds 200 MiB.');}
  // Even an unchanged manifest must still belong to the same final snapshot.
  const finalPage=await get(snapshot&&c.status?'/v1/telemetry/status':'/v1/telemetry/results?offset=0&'+pin());
  if(finalPage?.version!==1||finalPage.databaseId!==c.id||!int(finalPage.databaseRevision)||(snapshot?finalPage.snapshot!==snapshot:finalPage.databaseRevision!==revision||c.changes&&finalPage.changeToken!==token))throw changed('Paddock changed before the import completed. Refresh again.');
  if(generation!==this.generation||this.connection!==c)throw Error('Import cancelled.');
  const next={version:1,hosts:[...this.data.hosts.filter(h=>h.id!==c.id),{id:c.id,name,revision:finalPage.databaseRevision,...(snapshot?{snapshot}:{}),syncedAt:new Date().toISOString(),results}]};
  if(next.hosts.length>50||next.hosts.reduce((n,h)=>n+h.results.length,0)>MAX_SESSIONS)throw Error('Result library capacity reached.');
  this.persist(next);this.data=next;this.connection.name=name;this.connection.token=token;return {...this.view(),downloaded};
 }
 async watch(){
  const c=this.connection;if(!c?.changes||!c.token)return {supported:false};if(this.watching)throw Error('A Paddock change check is already active.');this.watching=true;const token=c.token;
  try{const result=await this.request(c.address,c.password,'/v1/telemetry/changes?since='+encodeURIComponent(token)+'&wait=25',c.id,AbortSignal.any([this.abort.signal,AbortSignal.timeout(35000)]),35000);
   if(this.connection!==c)throw Error('Connection cancelled.');
   if(result?.version!==1||result.databaseId!==c.id||typeof result.changeToken!=='string'||!result.changeToken||result.changeToken.length>256||typeof result.changed!=='boolean'||result.changed!==(result.changeToken!==token))throw Error('Invalid Paddock change notification.');
   return {supported:true,changed:result.changed};
  }finally{this.watching=false;}
 }
 persist(data){const text=JSON.stringify(data);if(Buffer.byteLength(text)>MAX_CACHE)throw Error('Result library exceeds 200 MiB.');fs.mkdirSync(path.dirname(this.file),{recursive:true});const temp=this.file+'.'+crypto.randomUUID()+'.tmp';let fd;try{fd=fs.openSync(temp,'wx');fs.writeFileSync(fd,text);fs.fsyncSync(fd);fs.closeSync(fd);fd=undefined;fs.renameSync(temp,this.file);}catch(e){if(fd!==undefined)fs.closeSync(fd);try{fs.unlinkSync(temp);}catch{}throw Error('Could not save imported results. Existing results are unchanged. '+e.message);}}
 rebuild(){if(this.busy)throw Error('Wait for the import to finish.');if(!this.loadError)throw Error('The cache is readable; rebuilding is unnecessary.');const backup=this.file+'.unreadable-'+Date.now();if(fs.existsSync(this.file))fs.renameSync(this.file,backup);this.data={version:1,hosts:[]};this.loadError='';return {...this.view(),backup};}
}
module.exports={PaddockClient,address,verify,hash,checkCache};
