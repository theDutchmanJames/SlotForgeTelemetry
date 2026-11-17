const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto');
const {LocalHistoryClient,descriptor,hash,scan}=require('../src/paddock-local.cjs'),projection=require('../src/shared-history-projection.cjs'),model=require('../renderer/race-model.js');
const {createHost,sessionsFromFixtures,read,DB}=require('./support/shared-history-host.cjs');
async function host(t,options){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'telemetry-local-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const h=await createHost(options),s=h.s;t.after(()=>h.close());
 const scanner=async()=>[{...h.descriptor(),key:'a'.repeat(64)+'.json'}];
 const make=()=>new LocalHistoryClient(path.join(dir,'shared.json'),{scanner});const client=make();t.after(()=>client.disconnect());
 return {s,client,make,dir};
}
test('imports both formats, verifies every hash and maps history-v1 for analysis',async t=>{
 const {client,s,dir}=await host(t);
 await client.connect();const r=await client.sync();assert.equal(r.downloaded,2);assert.equal(r.skipped,0);
 const hosts=client.hosts(),runs=model.runs({hosts});
 assert.equal(runs.length,5,'1 timing-v1 run + 2 cars × 2 lanes in the history-v1 race');
 const rich=runs.filter(x=>x.format==='history-v1');assert.equal(rich.length,4);assert.ok(rich.every(x=>x.hostKind==='local'));
 const lane1=rich.find(x=>x.participantId==='entry-1'&&x.lane===1);assert.deepEqual(lane1.laps.map(l=>l.number),[1,2,3]);assert.equal(model.statistics(lane1).best,10000,'personal-record-eligible lap 1 counts for the run best');
 const record=model.records(rich).find(x=>x.run.participantId==='entry-1'&&x.run.lane===1);assert.equal(record.lap.durationMs,11000,'Records only use track-record-eligible laps');
 assert.equal(lane1.standing.position,1);assert.equal(lane1.standing.points,10);
 // Lap and list paging were used; the second import downloads nothing.
 assert.ok(s.requests.some(q=>q.includes('offset=2')));assert.ok(s.requests.some(q=>q.includes('page=')));
 assert.equal((await client.sync()).downloaded,0);
 // Credentials never reach the cache, the settings file or the renderer view.
 for(const file of fs.readdirSync(dir))assert.equal(fs.readFileSync(path.join(dir,file),'utf8').includes(s.token),false,file);
 assert.equal(JSON.stringify(client.status()).includes(s.token),false);assert.equal(JSON.stringify(hosts).includes('127.0.0.1'),false);
});
test('corrections replace, withdrawals remove, and a reopened cache is re-verified',async t=>{
 const {client,s,make}=await host(t);await client.connect();await client.sync();
 const rich=s.sessions[1];rich.full=structuredClone(rich.full);rich.full.race.participants[0].laps[1].durationMs=9000;rich.revision=2;s.sequence++;
 assert.equal((await client.sync()).downloaded,1);assert.equal(model.statistics(model.runs({hosts:client.hosts()}).find(x=>x.format==='history-v1'&&x.participantId==='entry-1'&&x.lane===1)).best,9000);
 rich.state='withdrawn';rich.revision=3;s.sequence++;await client.sync();
 assert.equal(model.runs({hosts:client.hosts()}).filter(x=>x.format==='history-v1').length,0);
 const again=make();assert.equal(again.status().error,'');assert.equal(again.hosts()[0].results.length,2);
 const file=client.file,data=JSON.parse(fs.readFileSync(file,'utf8'));data.hosts[0].sessions[0].body.participants[0].laps[0].durationMs=1;fs.writeFileSync(file,JSON.stringify(data));
 assert.match(make().status().error,/could not be read/);
});
test('changes during an import retry from a fresh listing; tampered sessions are left out',async t=>{
 const {client,s}=await host(t);await client.connect();
 let once=true;s.hook=async url=>{if(once&&url.pathname.includes('/laps/')){once=false;s.sequence++;}};
 const r=await client.sync();assert.equal(r.downloaded,2);assert.ok(s.requests.filter(q=>q==='/v1/shared-history/status').length>=4,'retried after the snapshot changed');
 s.hook=null;const rich=s.sessions[1];rich.full=structuredClone(rich.full);rich.full.race.participants[1].laps[0].durationMs=12345;rich.revision=2;s.sequence++;
 s.tamper=(x,laps)=>x.format==='history-v1'?laps.map(l=>({...l,durationMs:l.durationMs+1})):laps;
 const tampered=await client.sync();assert.equal(tampered.skipped,1);assert.equal(model.runs({hosts:client.hosts()}).filter(x=>x.format==='history-v1').length,0,'never imported unverified laps');
});
test('a restarted Paddock rotates its credential: the client rediscovers and continues',async t=>{
 const {client,s}=await host(t);await client.connect();await client.sync();
 s.token=crypto.randomBytes(32).toString('base64url');s.instanceId='instance-2';
 assert.equal((await client.sync()).downloaded,0);
});
test('unknown formats are reported, not guessed; a busy client refuses parallel imports',async t=>{
 const sessions=sessionsFromFixtures();sessions.push({...sessions[0],sessionId:'future-format',format:'history-v2'});
 const {client}=await host(t,{sessions});await client.connect();
 const pending=client.sync();await assert.rejects(()=>client.sync(),/Wait for the current/);const r=await pending;
 assert.equal(r.unsupported,1);assert.equal(r.downloaded,2);
});
test('descriptors follow the local-library-v1 contract; discovery needs a private folder',async t=>{
 const d=read('discovery');assert.equal(descriptor(d).databaseId,d.databaseId);
 for(const bad of [{...d,address:'http://192.168.1.2:5000'},{...d,token:'short'},{...d,extra:true},{...d,format:'other'}])assert.throws(()=>descriptor(bad));
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'telemetry-scan-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 assert.deepEqual(await scan({folder:path.join(dir,'missing')}),[]);
 fs.writeFileSync(path.join(dir,'b'.repeat(64)+'.json'),JSON.stringify(d));fs.writeFileSync(path.join(dir,'c'.repeat(64)+'.json'),'{bad json');fs.writeFileSync(path.join(dir,'ignored.tmp'),'x');
 const found=await scan({folder:dir,checkWindows:async(f,names)=>names});assert.equal(found.length,1);assert.equal(found[0].databaseId,d.databaseId);
 await assert.rejects(()=>scan({folder:dir,checkWindows:async()=>{throw Error('not private');}}),/not private/);
});
test('historical history-v1 gaps stay unknown instead of becoming numbers',()=>{
 const bundle=structuredClone(read('history-create').bundle);bundle.provenance.kind='historical';bundle.race.startedAt=null;bundle.context.savedAt='2026-10-01T00:00:00.000Z';
 const lap=bundle.race.participants[0].laps[0];Object.assign(lap,{durationMs:null,endedAtMs:null,stintId:null,valid:null,personalRecordEligible:null,trackRecordEligible:null});
 projection.checkBundle(bundle);
 const p=projection.project({body:bundle,sourceId:'timing-demo',sessionId:'s',accepted:{revision:1}},DB);
 assert.equal(p.startedAt,'2026-10-01T00:00:00.000Z');assert.equal(p.dateUnknown,true);
 const runs=model.runs({hosts:[{id:DB,name:'n',kind:'local',results:[{payload:p,receipt:null,format:'history-v1'}]}]});
 const unknown=runs.flatMap(r=>r.laps).find(l=>l.id===lap.id);assert.equal(unknown.valid,false);assert.equal(unknown.durationMs,null);assert.match(unknown.reason,/not recorded/);
 for(const r of runs){const st=model.statistics(r);assert.ok(st.median===null||Number.isFinite(st.median));}
 assert.equal(model.chartPoints(runs.find(r=>r.laps.some(l=>l.id===lap.id)).laps,'',true).some(x=>x.lap.id===lap.id),false,'unknown times are never plotted');
 const broken=structuredClone(bundle);broken.race.participants[0].laps[0].durationMs='fast';assert.throws(()=>projection.checkBundle(broken),/Unsupported history-v1/);
});
