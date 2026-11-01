// Optional real host interoperability; read source only, use artificial in-memory data.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {PaddockClient,verify}=require('../src/paddock-client.cjs'),model=require('../renderer/race-model.js');
const source=process.env.SLOTFORGE_PADDOCK_SOURCE;
test('Paddock-owned handoff fixtures validate and remain distinct across heats and drivers',()=>{
 const folder=path.join(__dirname,'../integration/paddock-telemetry-v1/host-handoff/fixtures');
 const read=name=>JSON.parse(fs.readFileSync(path.join(folder,name+'.json')));
 for(const name of ['normal','multi-heat','endurance','correction','withdrawal']){
  const d=read(name+'-result'),index=read(name+'-index'),entry=index.entries.find(e=>e.sessionId===d.payload.sessionId);
  const result=verify(d,entry,d.databaseId,d.databaseRevision,index.snapshot),runs=model.runs({hosts:[{id:d.databaseId,results:[result]}]});
  assert.equal(runs.length,{normal:1,'multi-heat':4,endurance:2,correction:1,withdrawal:0}[name]);
  if(name==='correction')assert.equal(model.statistics(runs[0]).best,11000);
 }
});

test('completed Paddock host: password, snapshots, notifications, receipt changes, restore and revocation',{skip:!source,timeout:20000},async t=>{
 const {fixtures}=require(path.join(source,'tests/support/timing-fixtures.cjs'));
 const {Network}=require(path.join(source,'src/network.cjs')),timing=require(path.join(source,'src/timing-integration.cjs'));
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'slotforge-interop-')),f=fixtures(),host=new Network(f.store);
 const club=new (require(path.join(source,'src/club.cjs')).Club)(f.store,host,path.join(dir,'club'));
 const client=new PaddockClient(path.join(dir,'telemetry-results.json'));
 t.after(async()=>{client.disconnect();await host.stop();club.close();fs.rmSync(dir,{recursive:true,force:true});});
 club.enable('Artificial test host','test-password');for(const p of [f.normal,f.multi,f.endurance])timing.receive(f.store,p);
 await host.start();await client.connect({address:'127.0.0.1:'+host.port,password:'test-password'});
 assert.equal((await client.sync()).downloaded,3);assert.equal(model.runs(client.data).length,7);assert.equal((await client.sync()).downloaded,0);
 const saved=structuredClone(f.store.data),snapshot=client.data.hosts[0].snapshot,request=client.request.bind(client);let edited=false;
 client.request=async(...args)=>{const r=await request(...args);if(!edited&&args[2].startsWith('/v1/telemetry/results?')){edited=true;f.store.mutate('car.save',{id:'car-a',revision:f.store.data.cars[0].revision,data:{name:'Changed today',privateNotes:'private edit during import'}});}return r;};
 assert.equal((await client.sync()).downloaded,0);assert.equal(client.data.hosts[0].snapshot,snapshot);client.request=request;
 const pending=client.watch();timing.receive(f.store,f.correction);assert.equal((await pending).changed,true);
 assert.equal((await client.sync()).downloaded,1);assert.equal(client.data.hosts[0].results.find(r=>r.payload.sessionId==='session-normal').payload.revision,2);
 // A receipt-only correction warning must remove the session from statistics.
 f.store.transact(db=>{db.timing.sessions.find(r=>r.payload.sessionId==='session-normal').warnings.push({code:'SESSION_REQUIRES_CORRECTION',carId:'car-a'});});
 assert.equal((await client.sync()).downloaded,1);assert.equal(model.runs(client.data).some(r=>r.sessionId==='session-normal'),false);
 timing.receive(f.store,f.withdrawal);await client.sync();assert.equal(client.data.hosts[0].results.find(r=>r.payload.sessionId==='session-normal').payload.state,'withdrawn');
 saved.revision=f.store.data.revision;f.store.replace(saved);assert.equal((await client.sync()).downloaded,1);assert.equal(client.data.hosts[0].results.find(r=>r.payload.sessionId==='session-normal').payload.revision,1);
 f.store.transact(db=>{db.timing.sessions=[];});await client.sync();assert.equal(client.data.hosts[0].results.length,0);
 const before=fs.readFileSync(client.file,'utf8');club.setPassword('changed-password');await assert.rejects(()=>client.sync());assert.equal(client.connection,null);assert.equal(fs.readFileSync(client.file,'utf8'),before);
});
