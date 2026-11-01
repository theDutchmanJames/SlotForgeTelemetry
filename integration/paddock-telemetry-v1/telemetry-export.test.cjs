const test=require('node:test'),assert=require('node:assert/strict');
const {fixtures}=require('./support/timing-fixtures.cjs');
const timing=require('../src/timing-integration.cjs'),{Network}=require('../src/network.cjs');
test('Telemetry reads complete results without private database fields and follows corrections/withdrawals',async t=>{
 const f=fixtures(),host=new Network(f.store);timing.receive(f.store,f.normal);await host.start();t.after(()=>host.stop());
 const get=async(route,{code=host.timingCode,method='GET',database=f.store.data.id,origin}={})=>{const r=await fetch('http://127.0.0.1:'+host.port+route,{method,headers:{Authorization:'Bearer '+code,'X-SlotForge-Database':database,...(origin?{Origin:origin}:{})}});return {status:r.status,body:await r.json()};};
 const status=await get('/v1/status');assert.equal(status.body.capabilities.telemetry.version,1);require('../src/timing-schema.cjs').validate(status.body,require('../src/timing-schema.cjs').schema.$defs.status);
 assert.equal((await get('/v1/telemetry/results',{code:host.browseCode})).status,403);
 assert.equal((await get('/v1/telemetry/results',{database:'another'})).status,409);
 assert.equal((await get('/v1/telemetry/results',{origin:'null'})).status,403);
 assert.equal((await get('/v1/telemetry/results',{method:'POST'})).status,404);
 const index=await get('/v1/telemetry/results');assert.equal(index.body.entries.length,1);
 const route='/v1/telemetry/results/timing-demo/session-normal?revision='+index.body.databaseRevision;
 const record=await get(route);assert.deepEqual(record.body.payload,f.normal);assert.equal(record.body.receipt.summaries[0].statistics.bestLapMs,10000);
 assert.equal(JSON.stringify(record.body).includes('private ownership note'),false);assert.equal(JSON.stringify(record.body).includes('private technical note'),false);assert.equal(JSON.stringify(record.body).includes(f.store.data.timing.key),false);
 timing.receive(f.store,f.correction);assert.equal((await get(route)).status,409);
 timing.receive(f.store,f.withdrawal);const latest=await get('/v1/telemetry/results');assert.equal(latest.body.entries[0].state,'withdrawn');assert.equal(latest.body.entries[0].revision,3);
 assert.equal((await get('/v1/telemetry/results?offset=1')).status,400);
});
