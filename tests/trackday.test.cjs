const test=require('node:test'),assert=require('node:assert/strict');
const T=require('../renderer/trackday-model.js'),ML=require('../renderer/manual-laps-model.js'),C=require('../renderer/calculator-model.js');
const ctx={car:'Club GT',track:'Home track',lane:1,driver:'Alex'};
// Build saved runs the way the app does: normalize → manual library → runs.
function library(sessions){return {id:'lib',sessions:sessions.map((values,i)=>({id:'s'+i,carId:'c',trackId:'t',revision:1,updatedAt:values.startedAt,contentHash:'h',values}))};}
const laps=text=>ML.parse(text);
test('a run is saved as an ordinary manual session with the change note and a setup snapshot',()=>{
 const v=T.session({ctx,setup:{...C.EXAMPLE,totalWeight:'80',trackLength:'20.5'},note:'pinion 9 → 10',laps:laps('10.2\n10.1\n10.3'),sequenceConfirmed:true,now:new Date('2026-11-17T14:03:22.456Z'),runNumber:3});
 assert.equal(v.name,'Run 3 · pinion 9 → 10');assert.equal(v.source,'Track day');assert.equal(v.type,'practice');assert.equal(v.lane,1);assert.equal(v.lengthM,20.5);
 assert.equal(v.startedAt,'2026-11-17T14:03:22.456Z','millisecond precision keeps quick successive runs in order');assert.match(v.notes,/^Changed: pinion 9 → 10\nSetup: Example/);
 assert.deepEqual(v.technical,{pinion:'9',gear:'27',rearDiameter:'20',weight:'80',ratedRpm:'21500'});assert.equal(v.laps.length,3);
 const blank=T.session({ctx,setup:C.blank(),laps:laps('9.9'),sequenceConfirmed:false});assert.equal(blank.name,'Run 1 · no change');assert.deepEqual(Object.values(blank.technical),['','','','','']);assert.equal(blank.lengthM,null);
});
test('previous and today match car, track and lane, ignoring letter case',()=>{
 const s=(t,car='Club GT',lane=1)=>T.session({ctx:{...ctx,car,lane},laps:laps('10'),sequenceConfirmed:true,now:new Date(t)});
 const runs=ML.runs(library([s('2026-11-17T10:00:00Z'),s('2026-11-17T11:00:00Z','club gt'),s('2026-11-17T12:00:00Z','Other car'),s('2026-11-17T13:00:00Z','Club GT',2),s('2026-11-10T09:00:00Z')]));
 assert.equal(T.previous(runs,ctx).startedAt,'2026-11-17T11:00:00.000Z');
 assert.equal(T.previous(runs,ctx,T.previous(runs,ctx).id).startedAt,'2026-11-17T10:00:00.000Z');
 assert.equal(T.today(runs,ctx,new Date('2026-11-17T15:00:00Z')).length,2);assert.equal(T.previous(runs,{...ctx,track:'Elsewhere'}),null);
 // Same start time: the later save wins.
 const tie=[{id:'a',car:'Club GT',track:'Home track',lane:1,startedAt:'2026-11-17T10:00:00.000Z',syncedAt:'2026-11-17T10:00:00.100Z'},{id:'b',car:'Club GT',track:'Home track',lane:1,startedAt:'2026-11-17T10:00:00.000Z',syncedAt:'2026-11-17T10:00:00.900Z'}];
 assert.equal(T.previous(tie,ctx).id,'b');assert.equal(T.previous([...tie].reverse(),ctx).id,'b');
});
test('comparison: lower times are better, tiny differences read as the same',()=>{
 const before=T.preview(laps('10.00\n10.20\n10.10\n10.40'),true),faster=T.preview(laps('9.80\n9.90\n9.85\n9.95'),true),same=T.preview(laps('10.01\n10.19\n10.12\n10.39'),true);
 const rows=T.compare(faster,before);const by=k=>rows.find(r=>r.key===k);
 assert.equal(by('best').verdict,'better');assert.equal(by('median').verdict,'better');assert.equal(by('spread').verdict,'better');assert.equal(by('count').delta,0);
 assert.match(T.verdict(rows),/^Typical pace faster by 0\.\d{3} s; best lap faster by 0\.200 s\.$/);
 assert.equal(T.compare(same,before).find(r=>r.key==='median').verdict,'same');assert.match(T.verdict(T.compare(same,before)),/about the same/);
 assert.equal(T.compare(before,faster).find(r=>r.key==='best').verdict,'worse');
 assert.match(T.verdict(T.compare({laps:[]},before)),/Enter laps/);
});
test('change notes are read back from saved runs; contexts need car, track and a lane',()=>{
 const run=ML.runs(library([T.session({ctx,laps:laps('10'),note:'new rear tyres',sequenceConfirmed:true})]))[0];
 assert.equal(T.changeOf(run),'new rear tyres');assert.equal(T.changeOf(ML.runs(library([T.session({ctx,laps:laps('10'),sequenceConfirmed:true})]))[0]),'No change');assert.equal(T.changeOf({notes:'other'}),'');
 assert.equal(T.validContext(ctx),true);for(const bad of [{...ctx,car:' '},{...ctx,track:''},{...ctx,lane:0},{...ctx,lane:1.5},null])assert.equal(T.validContext(bad),false);
});
test('Pit Board: the change is read from the setup, the quickest run, and what Keep this change writes back',()=>{
 const C=require('../renderer/calculator-model.js'),prior={configuration:{technical:{pinion:'9',gear:'27',rearDiameter:'20',weight:'80',ratedRpm:'21500'}}};
 assert.deepEqual(T.autoChange(prior,{...C.EXAMPLE,pinion:'10',totalWeight:'72'}),['pinion 9 → 10','weight 80 → 72 g']);
 assert.deepEqual(T.autoChange(prior,{...C.EXAMPLE,totalWeight:'80'}),[],'same setup: no change');assert.deepEqual(T.autoChange(null,C.EXAMPLE),[]);
 assert.deepEqual(T.autoChange({configuration:{technical:{pinion:'9'}}},{...C.EXAMPLE,pinion:'10',totalWeight:'72'}),['pinion 9 → 10'],'a value the run did not record is not a change');
 const run=(id,times)=>({id,laps:times.map((t,i)=>({number:i+1,durationMs:t,valid:true,pit:false,recordEligible:true,stintId:'s',heatId:'h'}))});
 assert.equal(T.quickest([run('a',[10000,10100]),run('b',[9900,9950]),run('c',[10050])]).id,'b');assert.equal(T.quickest([run('a',[10000])]),null);
 assert.deepEqual(T.keepable(prior,{...C.EXAMPLE,pinion:'11',totalWeight:'80'}).map(c=>[c.field,c.from,c.to]),[['pinion','11','9']]);
 assert.deepEqual(T.keepable(prior,{...C.EXAMPLE,totalWeight:'80'}),[]);
});
