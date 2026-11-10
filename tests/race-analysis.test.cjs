const test=require('node:test'),assert=require('node:assert/strict'),model=require('../renderer/race-model.js');
const laps=(count,start=1)=>{let elapsed=(start-1)*12000;return Array.from({length:count},(_,i)=>({id:'lap-'+(start+i),number:start+i,stintId:'s1',heatId:'h1',endedAtMs:elapsed+=11000-i*100,durationMs:11000-i*100,valid:true,pit:false,recordEligible:true}));};
test('stints retain heat metadata, time boundaries and empty recorded periods',()=>{
 const d=require('../integration/paddock-telemetry-v1/host-handoff/fixtures/normal-result.json'),copy=structuredClone(d);
 copy.payload.participants[0].stints.push({...copy.payload.participants[0].stints[0],id:'empty',startedAtMs:60000,endedAtMs:60000});
 const run=model.runs({hosts:[{id:copy.databaseId,results:[copy]}]})[0],stints=model.stintAnalysis(run);
 assert.equal(stints.length,2);assert.equal(stints[0].heatName,'Heat 1');assert.equal(stints[0].startedAtMs,0);assert.equal(stints[0].pit,1);assert.equal(stints[0].statistics.count,2);assert.equal(stints[1].statistics.median,null);assert.equal(stints[1].longest,0);
});
test('opening and closing pace use non-overlapping five-lap medians in one continuous segment',()=>{
 const run={laps:laps(10)},s=model.stintAnalysis(run)[0];assert.equal(s.pace.first,10800);assert.equal(s.pace.last,10300);assert.equal(s.pace.change,-500);assert.equal(s.pace.count,10);assert.equal(model.stintAnalysis({laps:run.laps.slice(0,9)})[0].pace,null);
});
test('pace windows never bridge pit, invalid, missing lap, heat or stint boundaries',()=>{
 for(const mutate of [l=>l.pit=true,l=>l.valid=false,l=>l.number=99,l=>l.heatId='h2',l=>l.stintId='s2']){
  const rows=laps(12);mutate(rows[5]);assert.ok(model.stintAnalysis({laps:rows}).every(s=>s.pace===null));
 }
});
test('timestamp pauses break pace, best-five and chart windows without altering individual lap statistics',()=>{
 const rows=laps(10),before=model.statistics({laps:rows});
 for(let i=4;i<rows.length;i++)rows[i].endedAtMs+=2000;
 const after=model.statistics({laps:rows});assert.equal(after.mean,before.mean);assert.equal(after.median,before.median);
 assert.equal(after.bestRun.laps[0].number,6);assert.equal(model.stintAnalysis({laps:rows})[0].pace,null);
 const points=model.chartPoints(rows,'',false);assert.notEqual(points[3].segment,points[4].segment);assert.equal(points[4].median,null);
 const five=laps(5);five[4].endedAtMs++;assert.equal(model.statistics({laps:five}).bestRun,null);
});
test('longest uninterrupted sequence supplies pace; pit and other-invalid counts do not overlap',()=>{
 const rows=laps(25);rows[10].pit=true;rows[10].valid=false;rows[24].valid=false;
 const s=model.stintAnalysis({laps:rows})[0];assert.equal(s.pit,1);assert.equal(s.invalid,1);assert.equal(s.statistics.excluded,2);assert.equal(s.longest,13);assert.equal(s.pace.from,12);assert.equal(s.pace.to,24);assert.equal(s.sections,2);
});
test('equal-length uninterrupted sequences use the earliest and input is not mutated',()=>{
 const rows=laps(21);rows[10].pit=true;const original=structuredClone(rows);const s=model.stintAnalysis({laps:rows})[0];assert.equal(s.pace.from,1);assert.deepEqual(rows,original);
});
test('overlay sampling keeps separate sequence positions and all exclusion gaps',()=>{
 const a=laps(10),b=laps(6);a[2].valid=false;b[3].pit=true;
 const pa=model.chartPoints(a,'',false),pb=model.chartPoints(b,'',false);assert.equal(pa.at(-1).index,9);assert.equal(pb.at(-1).index,5);assert.equal(pa.some(p=>p.index===2),false);assert.notEqual(pa[1].segment,pa[2].segment);assert.equal(pb.some(p=>p.index===3),false);
});
