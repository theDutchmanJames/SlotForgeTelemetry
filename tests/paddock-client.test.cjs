const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),http=require('node:http');
const {PaddockClient,address,verify,hash}=require('../src/paddock-client.cjs'),model=require('../renderer/race-model.js');
const fixtures=path.join(__dirname,'../integration/paddock-telemetry-v1/fixtures');
const read=name=>JSON.parse(fs.readFileSync(path.join(fixtures,name+'.json')));
async function setup(t){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'slotforge-client-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const state={stage:'original',requests:[],fail:null,mutate:null,notifications:false};
 const server=http.createServer((req,res)=>{state.requests.push({method:req.method,url:req.url});res.setHeader('Content-Type','application/json');const url=new URL(req.url,'http://localhost');
  if(req.headers.authorization!=='Bearer test-password'){res.writeHead(401);res.end(JSON.stringify({error:'Incorrect password.'}));return;}
  let value;if(url.pathname==='/v1/status'){value=read('status');if(!state.notifications)delete value.capabilities.telemetry.changes;}
  else if(req.headers['x-slotforge-database']!=='paddock-demo'){res.writeHead(409);value={error:'Wrong database.'};}
  else if(state.fail){if(state.fail===429)res.setHeader('Retry-After','60');res.writeHead(state.fail);value={error:'Test host failure.'};}
  else if(url.pathname==='/v1/telemetry/changes'){const index=read(state.stage+'-index');value={version:1,databaseId:'paddock-demo',changeToken:index.changeToken,changed:index.changeToken!==url.searchParams.get('since')};}
  else if(url.pathname==='/v1/telemetry/results'){value=read(state.stage+'-index');}
  else {value=read(state.stage+'-detail');}
  if(state.mutate)value=state.mutate(value,url)||value;
  if(state.delayDetail&&url.pathname.includes('/timing-demo/')){state.detailStarted?.();setTimeout(()=>res.end(JSON.stringify(value)),100);}
  else res.end(JSON.stringify(value));
 });await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>{server.closeAllConnections();server.close();});
 const client=new PaddockClient(path.join(dir,'results.json'));t.after(()=>client.disconnect());const connect=()=>client.connect({address:'127.0.0.1:'+server.address().port,password:'test-password'});return {state,client,connect,dir};
}
test('local addresses only; no credential URLs, paths, redirects or Internet hosts',()=>{
 assert.equal(address('localhost:48000'),'http://127.0.0.1:48000');
 for(const a of ['https://192.168.1.2','http://me:pass@127.0.0.1','8.8.8.8','example.com','192.168.1.2/path','192.168.1.2?x=1'])assert.throws(()=>address(a));
});
test('sync is incremental, credentials never persist, corrections replace and withdrawals clear records',async t=>{
 const {state,client,connect}=await setup(t);await connect();assert.equal((await client.sync()).downloaded,1);assert.equal((await client.sync()).downloaded,0);
 assert.equal(state.requests.filter(r=>r.url.includes('/timing-demo/')).length,1);assert.ok(state.requests.every(r=>r.method==='GET'));
 assert.equal(JSON.stringify(client.view()).includes('test-password'),false);assert.equal(fs.readFileSync(client.file,'utf8').includes('test-password'),false);
 assert.equal(model.records(model.runs(client.data))[0].lap.durationMs,10000);
 state.stage='corrected';await client.sync();assert.equal(client.data.hosts[0].results.length,1);assert.equal(model.records(model.runs(client.data))[0].lap.durationMs,11000);
 state.stage='withdrawn';await client.sync();assert.equal(model.runs(client.data).length,0);assert.equal(client.data.hosts[0].results[0].payload.state,'withdrawn');
 client.disconnect();const reopened=new PaddockClient(client.file);assert.equal(reopened.connection,null);assert.equal(reopened.data.hosts[0].results.length,1);
 state.stage='original';await connect();await client.sync();assert.equal(client.data.hosts[0].results[0].payload.revision,1,'restored host with lower revisions reconciles');
});
test('failed or invalid transfers preserve the complete existing cache',async t=>{
 const {state,client,connect}=await setup(t);await connect();await client.sync();const original=fs.readFileSync(client.file,'utf8');state.stage='corrected';state.fail=500;await assert.rejects(()=>client.sync());assert.equal(fs.readFileSync(client.file,'utf8'),original);
 state.fail=null;state.mutate=(value,url)=>{if(url.pathname.includes('/timing-demo/'))value.payload.participants[0].laps[0].durationMs++;return value;};await assert.rejects(()=>client.sync(),/match|summary|overlap|lap/i);assert.equal(fs.readFileSync(client.file,'utf8'),original);
 state.mutate=(value)=>{if(value.databaseId)value.databaseId='another';return value;};await assert.rejects(()=>client.sync());assert.equal(fs.readFileSync(client.file,'utf8'),original);
});
test('snapshot changes and duplicate manifest identities fail closed',async t=>{
 const {state,client,connect}=await setup(t);await connect();state.mutate=(value,url)=>{if(url.pathname.includes('/timing-demo/'))value.databaseRevision++;return value;};await assert.rejects(()=>client.sync(),/changed/);assert.equal(client.data.hosts.length,0);
 state.mutate=value=>{if(value.entries)value.entries.push(value.entries[0]);return value;};await assert.rejects(()=>client.sync(),/duplicate/);
});
test('empty complete refresh removes absent sessions, but wrong capability never connects',async t=>{
 const {state,client,connect}=await setup(t);await connect();await client.sync();state.mutate=value=>{if(value.entries)value.entries=[];return value;};await client.sync();assert.equal(client.data.hosts[0].results.length,0);
 state.mutate=value=>{if(value.capabilities)delete value.capabilities.telemetry;return value;};await assert.rejects(connect,/does not support/);assert.equal(client.connection,null);
});
test('optional notifications use imported token and support correction catch-up',async t=>{
 const {state,client,connect}=await setup(t);state.notifications=true;await connect();assert.equal((await client.watch()).supported,false);await client.sync();assert.equal((await client.watch()).changed,false);state.stage='corrected';assert.equal((await client.watch()).changed,true);await client.sync();assert.equal((await client.watch()).changed,false);
});
test('rate limits apply across port changes on the same host',async t=>{
 const {state,client,connect}=await setup(t);await connect();state.fail=429;await assert.rejects(()=>client.sync());const count=state.requests.length;await assert.rejects(()=>client.sync(),/Retry in/);assert.equal(state.requests.length,count);await assert.rejects(()=>client.connect({address:'127.0.0.1:1',password:'test-password'}),/Retry in/);
});
test('bad cache is retained until explicitly archived; no import overwrites it',async t=>{
 const {client,connect}=await setup(t);fs.writeFileSync(client.file,'{ broken');const broken=new PaddockClient(client.file);assert.ok(broken.loadError);await assert.rejects(()=>broken.sync(),/unreadable/);assert.equal(fs.readFileSync(client.file,'utf8'),'{ broken');const result=broken.rebuild();assert.equal(fs.readFileSync(result.backup,'utf8'),'{ broken');assert.equal(broken.loadError,'');await connect();
});
test('model separates measured pace, record flags and classification',()=>{
 const d=read('original-detail');const data={hosts:[{id:d.databaseId,name:'Example',syncedAt:'2026-11-01T10:00:00.000Z',results:[d]}]};const run=model.runs(data)[0],s=model.statistics(run);assert.equal(s.best,10000);assert.equal(s.median,10500);assert.equal(s.excluded,1);assert.equal(run.standing.classifiedLaps,3);assert.equal(s.count,2);assert.equal(s.bestRun,null);
 run.laps[0].recordEligible=false;assert.equal(model.statistics(run).best,11000);assert.equal(model.statistics(run).count,2);
 const other={...run,sourceId:'another-source',id:'different'};assert.equal(model.comparable(run,other),false);assert.equal(model.records([run,other]).length,2);
});
test('sustained runs never bridge pit laps, missing laps or driver stints',()=>{
 const run={laps:Array.from({length:7},(_,i)=>({id:String(i),number:i+1,durationMs:1000+i*10,valid:true,pit:false,recordEligible:true,stintId:'one',heatId:'h'}))};assert.equal(model.statistics(run).bestRun.mean,1020);run.laps[3].pit=true;assert.equal(model.statistics(run).bestRun,null);run.laps[3].pit=false;run.laps[3].stintId='two';assert.equal(model.statistics(run).bestRun,null);run.laps[3].stintId='one';run.laps[3].number=40;assert.equal(model.statistics(run).bestRun,null);
});
test('cross-heat overlaps are quarantined even if historical receipt claimed inclusion',()=>{
 const d=read('original-detail'),p=d.payload;p.participants[0].laps[1].endedAtMs=15000;const data={hosts:[{id:p.databaseId,results:[d]}]};assert.equal(model.unsafe(p),true);assert.equal(model.runs(data).length,0);
});
test('hash checks bind payload and receipt, including captured configuration identity',()=>{
 const d=read('original-detail'),m=read('original-index').entries[0];assert.doesNotThrow(()=>verify(d,m,d.databaseId,d.databaseRevision));d.payload.participants[0].configuration.carId='other';const digest=hash(d.payload);d.receipt.contentHash=digest;m.contentHash=digest;assert.throws(()=>verify(d,m,d.databaseId,d.databaseRevision),/configuration/);
});
test('paged manifests import every identity, including same session ID from different sources',async t=>{
 const {state,client,connect}=await setup(t);const extra=read('original-detail');extra.payload.source.id='timing-second';extra.receipt.sourceId='timing-second';extra.receipt.contentHash=hash(extra.payload);
 const entry={sourceId:'timing-second',sessionId:extra.payload.sessionId,revision:1,state:'active',contentHash:extra.receipt.contentHash};
 state.mutate=(value,url)=>{if(value.entries){if(url.searchParams.get('offset')==='1'){value.entries=[entry];value.nextOffset=null;}else value.nextOffset=1;}else if(url.pathname.includes('/timing-second/'))return extra;return value;};
 await connect();await client.sync();assert.equal(client.data.hosts[0].results.length,2);assert.equal(model.records(model.runs(client.data)).length,2);
});
test('disconnect cancels an in-flight correction without replacing cached results',async t=>{
 const {state,client,connect}=await setup(t);await connect();await client.sync();const before=fs.readFileSync(client.file,'utf8');state.stage='corrected';state.delayDetail=true;const started=new Promise(r=>state.detailStarted=r);const pending=client.sync();await started;client.disconnect();await assert.rejects(pending);assert.equal(fs.readFileSync(client.file,'utf8'),before);assert.equal(client.data.hosts[0].results[0].payload.revision,1);
});
test('failed atomic cache replacement retains in-memory and on-disk previous data',async t=>{
 const {state,client,connect,dir}=await setup(t);await connect();await client.sync();const original=client.file,before=fs.readFileSync(original,'utf8');state.stage='corrected';const obstruction=path.join(dir,'directory-not-file');fs.mkdirSync(obstruction);client.file=obstruction;await assert.rejects(()=>client.sync(),/Could not save/);assert.equal(client.data.hosts[0].results[0].payload.revision,1);assert.equal(fs.readFileSync(original,'utf8'),before);assert.equal(fs.readdirSync(dir).some(n=>n.endsWith('.tmp')),false);
});
test('the final consistency check cannot silently accept a different host snapshot',async t=>{
 const {state,client,connect}=await setup(t);await connect();let pages=0;state.mutate=(value,url)=>{if(url.pathname==='/v1/telemetry/results'&&++pages%2===0)value.databaseRevision++;return value;};await assert.rejects(()=>client.sync(),/before the import/);assert.equal(client.data.hosts.length,0);assert.equal(pages,6,'retries are bounded');
});

test('stable snapshots survive private edits and receipt-only corrections refresh the offline cache',async t=>{
 const {state,client,connect}=await setup(t);let warning=false,dbRevision=10;
 state.notifications=true;
 state.mutate=(value,url)=>{
  if(value.capabilities){Object.assign(value.capabilities.telemetry,{snapshot:true,status:'/v1/telemetry/status'});return value;}
  const snapshot=hash({warning}),resultHash=hash({receipt:warning});
  if(url.pathname==='/v1/telemetry/status')return {version:1,databaseId:'paddock-demo',databaseRevision:++dbRevision,snapshot};
  value.databaseRevision=++dbRevision;value.snapshot=snapshot;value.changeToken=snapshot;
  if(value.entries){for(const e of value.entries)e.resultHash=resultHash;}
  if(value.receipt&&warning)value.receipt.warnings.push({code:'SESSION_REQUIRES_CORRECTION',carId:'car-a'});
  if(url.searchParams.has('snapshot'))assert.equal(url.searchParams.get('snapshot'),snapshot);
  return value;
 };
 await connect();assert.equal((await client.sync()).downloaded,1);assert.equal((await client.sync()).downloaded,0);assert.equal(model.runs(client.data).length,1);
 warning=true;assert.equal((await client.sync()).downloaded,1);assert.equal(model.runs(client.data).length,0);assert.equal(model.quarantined(client.data.hosts[0].results[0]),true);
 const reopened=new PaddockClient(client.file);assert.equal(reopened.loadError,'');assert.equal(model.runs(reopened.data).length,0);assert.ok(reopened.data.hosts[0].snapshot);assert.ok(reopened.data.hosts[0].results[0].resultHash);
 assert.ok(state.requests.some(r=>r.url==='/v1/telemetry/status'));assert.equal(state.requests.some(r=>r.url.includes('revision=')),false);
});

test('one snapshot race retries from the complete manifest and succeeds',async t=>{
 const {state,client,connect}=await setup(t);await connect();let pages=0;state.mutate=(value,url)=>{if(url.pathname==='/v1/telemetry/results'&&++pages===2)value.databaseRevision++;return value;};assert.equal((await client.sync()).downloaded,1);assert.equal(pages,4);
});

test('access revocation stops the connection while preserving offline evidence',async t=>{
 const {state,client,connect}=await setup(t);await connect();await client.sync();const before=fs.readFileSync(client.file,'utf8');state.fail=403;await assert.rejects(()=>client.sync());assert.equal(client.connection,null);assert.equal(fs.readFileSync(client.file,'utf8'),before);assert.equal((await client.watch()).supported,false);
});

test('participant-local driver IDs never imply a cross-session or cross-car driver match',()=>{
 const d=read('original-detail'),a=model.runs({hosts:[{id:d.databaseId,results:[d]}]})[0];
 assert.equal(model.sameDriver(a,{...a}),true);assert.equal(model.sameDriver(a,{...a,sessionId:'elsewhere'}),false);assert.equal(model.sameDriver(a,{...a,participantId:'another-car'}),false);
});

test('long-chart sampling retains valid extrema and does not bridge hidden invalid or missing laps',()=>{
 const rows=Array.from({length:5000},(_,i)=>({id:String(i),number:i+1,durationMs:1000,valid:true,pit:false,stintId:'s',heatId:'h'}));
 rows[11].valid=false;rows[11].durationMs=1;rows[15].durationMs=900;rows[20].durationMs=2000;
 const points=model.chartPoints(rows,'25',false);assert.ok(points.length<1000);assert.ok(points.some(p=>p.index===15));assert.ok(points.some(p=>p.index===25));assert.ok(points.every(p=>p.lap.valid));
 const before=points.filter(p=>p.index<11).at(-1),after=points.find(p=>p.index>11);assert.notEqual(before.segment,after.segment);
 const medianBefore=points.filter(p=>p.index<11&&p.median!==null).at(-1);const medianAfter=points.find(p=>p.index>11&&p.median!==null);if(medianBefore)assert.notEqual(medianBefore.medianSegment,medianAfter.medianSegment);
 const short=rows.slice(30,40).map(l=>({...l}));short[4].number+=10;const gaps=model.chartPoints(short,'',false);assert.notEqual(gaps[3].segment,gaps[4].segment);assert.equal(gaps[4].median,null);
});
