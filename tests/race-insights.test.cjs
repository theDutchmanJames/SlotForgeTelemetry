const test=require('node:test'),assert=require('node:assert/strict'),insights=require('../renderer/race-insights.js');
test('comparison deltas and benefit colours agree at displayed precision',()=>{
 assert.deepEqual(insights.delta(10000,10000.2),{text:'0.000 s',direction:0});assert.deepEqual(insights.delta(10000,9999.8),{text:'0.000 s',direction:0});
 assert.deepEqual(insights.delta(null,10000),{text:'—',direction:0});assert.deepEqual(insights.delta(10000,9999),{text:'−0.001 s',direction:-1});assert.deepEqual(insights.delta(10000,10001),{text:'+0.001 s',direction:1});
});
function run(id,times,extra={}){return {id,hostId:'h',sourceId:'s',sessionId:id,participantId:'p',driverId:'d',sessionName:id,carId:'c',car:'Car',trackId:'t',track:'Track',lane:1,laneLengthM:20,type:'race',driver:'Driver',startedAt:'2026-10-01T12:00:00.000Z',syncedAt:'2026-10-02T12:00:00.000Z',revision:1,contentHash:'a'.repeat(64),configuration:{technical:{gear:'27'},components:[]},adjustments:[],standing:null,laps:times.map((durationMs,i)=>({id:id+i,number:i+1,endedAtMs:(i+1)*12000,durationMs,stintId:'s',heatId:'h',valid:true,pit:false,recordEligible:true})),...extra};}
test('findings distinguish best-lap gains from slower or unchanged median pace',()=>{
 const a=run('a',[10000,10000,10000,10000,10000]);
 const slower=run('b',[9000,11000,11000,11000,11000]),same=run('b',[9000,10000,10000,10000,10000]);
 assert.equal(insights.comparison(a,slower).cards[0].title,'Lower best lap, higher median');assert.match(insights.comparison(a,slower).cards[0].text,/1.000 s higher/);assert.equal(insights.comparison(a,same).cards[0].title,'Lower best lap, unchanged median');
});
test('no-lap, one-lap, missing eligibility and small differences remain honest',()=>{
 const empty=run('a',[]),one=run('b',[10000]);assert.match(insights.run(empty).cards[0].text,/0 of 0/);assert.match(insights.comparison(empty,one).cards[1].text,/unavailable/);
 one.laps[0].recordEligible=false;const text=insights.comparison(run('a',[10000]),one).cards[0].text;assert.match(text,/median lap is unchanged/);assert.match(text,/eligible lap is unavailable/);assert.doesNotMatch(JSON.stringify(insights.comparison(empty,one)),/NaN|Infinity/);
});
test('excluded laps stay out of findings and pit-invalid laps are not counted twice',()=>{
 const a=run('a',[10000,10000,10000]),b=run('b',[500,10000,10000]);b.laps[0].pit=true;b.laps[0].valid=false;b.laps[0].recordEligible=false;
 const result=insights.comparison(a,b);assert.match(result.cards[0].text,/median lap is unchanged/);assert.match(result.cards[2].text,/1 pit and 0 other invalid/);
});
test('large sample imbalances are disclosed without inventing confidence levels',()=>{
 const f=insights.comparison(run('a',Array(5).fill(10000)),run('b',Array(12).fill(9900)));
 assert.match(f.cards[2].text,/twice as many/);assert.ok(f.checks.some(c=>c.includes('not a statistical confidence score')));
});
test('confirmation never overrides mismatched source, track, lane, type or length',()=>{
 const a=run('a',[10000,10000]);for(const extra of [{sourceId:'another'},{trackId:'another'},{lane:2},{type:'practice'},{laneLengthM:21}]){const b=run('b',[9900,9900],extra);assert.equal(insights.compatible(a,b),false);assert.ok(insights.comparison(a,b,{confirmed:true}).checks.some(c=>c.includes('have not been confirmed')));}
 assert.equal(insights.compatible(a,a),false);assert.ok(insights.comparison(a,run('b',[9900]),{confirmed:true}).checks.some(c=>c.startsWith('You confirmed')));
});
test('unknown lane length and different cars remain explicit limitations',()=>{
 const checks=insights.comparison(run('a',[10000]),run('b',[9900],{laneLengthM:null,carId:'different'})).checks;
 assert.ok(checks.some(c=>c.includes('unrecorded')));assert.ok(checks.some(c=>c.includes('different car identities')));
});
test('static report preserves provenance and separates classification while escaping all imported text',()=>{
 const a=run('a',[10000,10000,10000,10000,10000]),b=run('b',[9900,9900,9900,9900,9900],{sessionName:'<script>alert(1)</script>',password:'DO-NOT-EXPORT',privateNotes:'PRIVATE-NOTE',standing:{status:'finished',position:1,classifiedLaps:4,classifiedElapsedMs:60000,points:1},adjustments:[{kind:'time',amount:1000,reason:'<img src=x onerror=alert(1)>'}]});
 b.configuration.technical.gear='<svg onload=alert(1)>';b.configuration.components=[{partId:'p',name:'<b>Wheel</b>',quantity:1,field:'rear',position:'rear',assemblyId:null}];
 const report=insights.report(a,b,{exportedAt:'2026-11-01T00:00:00.000Z'});
 assert.match(report,/Content-Security-Policy/);assert.match(report,/default-src 'none'/);assert.doesNotMatch(report,/<script|<img|<svg|DO-NOT-EXPORT|PRIVATE-NOTE/);assert.match(report,/&lt;script&gt;/);assert.match(report,/&lt;b&gt;Wheel/);assert.match(report,/9.900 s/);assert.match(report,/60.000 s/);assert.match(report,/penalties are not reapplied/);assert.match(report,/Payload content hash/);assert.match(report,/Later corrections or withdrawals do not update/);assert.match(report,/2026-11-01T00:00:00.000Z/);
});
