// Optional: Telemetry against REAL Paddock code on this computer. Reads Paddock's source only and
// uses synthetic temporary collections. Set SLOTFORGE_PADDOCK_SOURCE to a Paddock checkout.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {LocalHistoryClient}=require('../src/paddock-local.cjs'),model=require('../renderer/race-model.js');
const source=process.env.SLOTFORGE_PADDOCK_SOURCE;
test('real Paddock local service: both formats, corrections, withdrawals and a restart',{skip:!source,timeout:60000},async t=>{
 const P=f=>require(path.join(source,f));
 const {Store}=P('src/store.cjs'),T=P('src/timing-integration.cjs'),H=P('src/shared-history.cjs'),R=P('src/rich-history.cjs'),{LocalLibrary}=P('src/local-library.cjs');
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'telemetry-paddock-local-')),file=path.join(root,'db.sqlite'),data=P('tests/support/timing-fixtures.cjs').fixtures();
 const seed=new Store(file,{deferred:true});seed.replace(data.store.snapshot());const store=new Store(file,{deferred:true});
 // One older-format race (timing-v1) and one Shared-library race (history-v1), accepted the way Paddock accepts them.
 T.receive(store,data.normal);
 const op=JSON.parse(fs.readFileSync(path.join(source,'tests/fixtures/contracts/shared-racing-history-v1/fixtures/classes-and-eligibility.json')));
 op.recoveryId=H.status(store).recoveryId;op.bundle.context.scoringSnapshot=null;const created=R.receiveQualified(store,op);
 const folder=path.join(root,'discovery'),options={store,folder,profile:root};let service=new LocalLibrary(options);await service.start();
 const client=new LocalHistoryClient(path.join(root,'telemetry','shared.json'),{folder});
 t.after(async()=>{client.disconnect();service.quiesce();await service.idle();service.close();fs.rmSync(root,{recursive:true,force:true});});
 assert.equal(service.error,'');
 assert.deepEqual((await client.libraries()).map(l=>l.databaseId),[store.data.id]);
 await client.connect();const first=await client.sync();assert.equal(first.downloaded,2);assert.equal(first.skipped,0);assert.equal(first.unsupported,0);
 // The network Telemetry-v1 index still hides the history-v1 race: this is why the local reader exists.
 const legacy=P('src/telemetry-export.cjs').handleStore(store,'GET',new URL('http://localhost/v1/telemetry/results'),{timingResults:true},store.data.id);assert.equal(legacy.entries.length,1);
 let runs=model.runs({hosts:client.hosts()});
 assert.ok(runs.some(r=>r.format==='timing-v1'));const rich=runs.filter(r=>r.format==='history-v1');assert.ok(rich.length>0);
 for(const r of rich){const st=model.statistics(r);assert.ok(st.count>0);assert.ok(Number.isFinite(st.median));}
 assert.equal((await client.sync()).downloaded,0);
 // A correction in Paddock replaces the imported race; a withdrawal removes it from analysis.
 const edit={...structuredClone(op),operationId:'telemetry-correction',action:'replace',expected:created.accepted};edit.bundle.race.participants[0].laps.splice(0,1);
 const lapsOf=(list,id)=>list.filter(r=>r.format==='history-v1'&&r.participantId===id).reduce((n,r)=>n+r.laps.length,0),entry=edit.bundle.race.participants[0].id,before=lapsOf(rich,entry);
 const corrected=R.receiveQualified(store,edit);assert.equal((await client.sync()).downloaded,1);
 assert.equal(lapsOf(model.runs({hosts:client.hosts()}),entry),before-1,'the corrected race replaced the original');
 const withdrawal={...structuredClone(edit),operationId:'telemetry-withdraw',action:'withdraw',expected:corrected.accepted,withdrawalReason:'Test withdrawal'};delete withdrawal.bundle;R.receiveQualified(store,withdrawal);
 await client.sync();assert.equal(model.runs({hosts:client.hosts()}).filter(r=>r.format==='history-v1').length,0);
 // Restarting Paddock's service rotates its credential and instance: Telemetry rediscovers it.
 service.quiesce();await service.idle();service.close();service=new LocalLibrary(options);await service.start();
 assert.equal((await client.sync()).downloaded,0);
 assert.equal(fs.readFileSync(client.file,'utf8').includes(service.token),false);
});
