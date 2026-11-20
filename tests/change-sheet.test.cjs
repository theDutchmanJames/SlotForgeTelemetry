const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../renderer/calculator-model.js'),S=require('../renderer/change-sheet-model.js');
const base={...C.EXAMPLE,name:'Technical',totalWeight:'80'},fast={...base,name:'Fast',pinion:'10'},light={...fast,name:'Light',totalWeight:'72'};
test('what you changed: only the inputs that differ, names and notes left out',()=>{
 assert.deepEqual(S.inputChanges(base,fast),[{key:'pinion',from:'9',to:'10'}]);
 assert.deepEqual(S.inputChanges(base,{...base,name:'Other',notes:'x'}),[]);
 assert.deepEqual(S.sheet(base,[fast,light]).changed,['pinion','totalWeight']);
});
test('what it does: only results that moved, each coloured by which way is better',()=>{
 const s=S.sheet(base,[fast,light]),row=k=>s.moved.find(r=>r.key===k);
 assert.equal(row('speedKmh').cells[0].tone,'good');assert.equal(row('forceN').cells[0].tone,'bad');
 assert.equal(row('ratio').cells[0].tone,'neutral','the ratio depends on the track');
 assert.equal(row('massG').cells[0].moved,false);assert.equal(row('massG').cells[1].moved,true);assert.equal(row('massG').cells[1].tone,'neutral');
 assert.equal(row('powerToWeight').cells[1].tone,'good');
 assert.ok(s.unchanged.some(r=>r.key==='peakPowerW'));
 assert.ok(s.missing.some(r=>r.key==='magneticMean'&&r.reason==='missing'));
});
test('pull per kg follows force and weight',()=>{
 const r=S.rows(base,light).find(x=>x.key==='pullPerKg'),f=S.rows(base,light).find(x=>x.key==='forceN');
 assert.ok(Math.abs(r.a-f.a/80*1000)<1e-9);assert.ok(Math.abs(r.b-f.b/72*1000)<1e-9);
});
test('the same-basis rule stays: other test voltages are never better or worse',()=>{
 const other={...fast,ratedVoltage:'14'},s=S.sheet(base,[other]);
 assert.equal(s.moved.some(r=>r.key==='speedKmh'),false);assert.ok(s.missing.some(r=>r.key==='speedKmh'&&r.reason==='basis'));
});
test('the verdict in plain words',()=>{
 const v=S.verdict(S.sheet(base,[fast]).pairs[0]);
 assert.deepEqual(v.parts.map(p=>p.text),['quicker on the straight','pulls less out of a corner']);
 assert.equal(v.parts[0].detail,'+11.1% no-load speed');
 const w=S.verdict(S.sheet(base,[light]).pairs[0]);assert.ok(w.parts.some(p=>p.text==='lighter'&&p.grams===8));
 const q=S.verdict(S.sheet(base,[{...base,magneticReadings:'10'}]).pairs[0]);assert.equal(q.quiet,true);assert.equal(q.inputs,1);
});
