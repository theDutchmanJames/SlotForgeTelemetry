const test=require('node:test'),assert=require('node:assert/strict');
const W=require('../renderer/pace-wall-model.js'),N=require('../renderer/run-notes-model.js');
let n=0;
function run({car='Club GT',track='Club circuit',lane=1,at,laps,tech={},kind,source='Home collection',type='practice',session='Club night'}){
 n++;let t=0;
 return {id:'run-'+n,entryKind:kind,car,track,lane,startedAt:at,sessionName:session,type,sourceName:kind==='manual'?source:'Timing PC',hostName:'Home collection',driver:'Alex',
  configuration:{technical:tech,components:[]},stints:[{id:'s',heatId:'h'}],
  laps:laps.map((ms,i)=>({id:`l${n}-${i}`,number:i+1,durationMs:ms,endedAtMs:(t+=ms),valid:ms>0,pit:false,recordEligible:ms>0,stintId:'s',heatId:'h'}))};
}
test('lines join Paddock races and typed-in runs of one car, track and lane',()=>{
 const runs=[run({at:'2026-09-18T19:00:00Z',laps:[10400,10300]}),run({car:' club  GT ',at:'2026-11-20T01:00:00Z',kind:'manual',source:'Track day',laps:[9900]}),run({lane:2,at:'2026-10-01T19:00:00Z',laps:[10500]}),run({car:'Rally',at:'2026-10-02T19:00:00Z',laps:[12000]})];
 const cars=W.cars(runs);assert.deepEqual(cars.map(c=>[c.name,c.runs,c.lines]),[[' club  GT ',3,2],['Rally',1,1]]);
 const lines=W.lines(runs,cars[0].key);assert.deepEqual(lines.map(l=>[l.lane,l.runs.length]),[[1,2],[2,1]]);
 assert.equal(lines[0].runs[0].startedAt,'2026-11-20T01:00:00Z','newest first');
});
test('the scoreboard: record, pace now, gained and consistency',()=>{
 const runs=[run({at:'2026-09-18T19:00:00Z',laps:[10400,10500,10300]}),run({at:'2026-10-18T19:00:00Z',laps:[10100,10200,10000]}),run({at:'2026-11-18T19:00:00Z',laps:[9900,10000,9950,-1]})];
 const line=W.lines(runs)[0],s=W.summary(line);
 assert.equal(s.record.lap.durationMs,9900);assert.equal(s.record.run,runs[2]);
 assert.equal(s.gained,9950-10400,'typical lap of the latest run against the first run');assert.equal(s.since,runs[0]);
 assert.equal(s.paceRuns,3);assert.equal(s.paceNow,10100,'median of the valid laps of the last three runs');
 assert.equal(s.previousSpread,100);
 const one=W.summary(W.lines([runs[0]])[0]);assert.equal(one.gained,null);assert.equal(one.since,null);
});
test('a lap that is not record-eligible never sets the record',()=>{
 const r=run({at:'2026-09-18T19:00:00Z',laps:[9000,10000]});r.laps[0].recordEligible=false;
 assert.equal(W.summary(W.lines([r])[0]).record.lap.durationMs,10000);
 r.laps[1].trackRecordEligible=false;assert.equal(W.summary(W.lines([r])[0]).record,null);
});
test('what changed between two runs, named for people',()=>{
 const a=run({at:'2026-09-18T19:00:00Z',laps:[10400],tech:{pinion:'9',gear:'27',rearDiameter:'20',weight:''}}),b=run({at:'2026-10-18T19:00:00Z',laps:[10100],tech:{pinion:'10',gear:'27',rearDiameter:'19.5',weight:'80'}});
 assert.deepEqual(W.changes(a,b).map(c=>c.label),['pinion 9 → 10','rear tyre 20 mm → 19.5 mm'],'a value recorded only once is not a change');
 assert.deepEqual(W.changes(null,b),[]);
 const led=W.ledger(W.lines([a,b])[0]);assert.equal(led.length,1);assert.equal(led[0].delta,10100-10400);assert.equal(led[0].run,b);
});
test('the colour scale reads 6% of the reference lap',()=>{
 assert.equal(W.shade(10000,10000),0);assert.equal(W.shade(10300,10000),.5);assert.equal(W.shade(11000,10000),1);assert.equal(W.shade(9000,10000),0);assert.equal(W.shade(10000,null),null);
 assert.equal(W.scaleMs(10000),600);
});
test('a run’s kind: Track day runs are tests, others follow the session',()=>{
 assert.equal(W.defaultTag(run({at:'2026-01-01T00:00:00Z',laps:[1],kind:'manual',source:'Track day'})),'test');
 assert.equal(W.defaultTag(run({at:'2026-01-01T00:00:00Z',laps:[1],type:'race'})),'race');
 assert.equal(W.defaultTag(run({at:'2026-01-01T00:00:00Z',laps:[1],type:'odd'})),'practice');
});
test('notes and tags: kept small, empty entries removed, bad files refused',()=>{
 let d=N.decode(null);d=N.set(d,'a',{note:'Grippy tonight',tag:'club'});d=N.set(d,'b',{tag:'nope'});
 assert.deepEqual(d.runs,{a:{note:'Grippy tonight',tag:'club'}});
 d=N.set(d,'a',{note:'  '});assert.deepEqual(d.runs,{a:{tag:'club'}});d=N.set(d,'a',{tag:''});assert.deepEqual(d.runs,{});
 assert.equal(N.set(N.empty(),'x',{note:'x'.repeat(5000)}).runs.x.note.length,N.MAX_NOTE);
 assert.deepEqual(N.decode(JSON.stringify({version:1,runs:{a:{note:'n'},b:{}}})).runs,{a:{note:'n'}});
 assert.throws(()=>N.decode('{"version":2,"runs":{}}'));assert.throws(()=>N.decode('{"version":1,"runs":[]}'));assert.throws(()=>N.decode('nope'));
});
