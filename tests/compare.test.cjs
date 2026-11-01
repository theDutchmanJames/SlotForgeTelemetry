const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../renderer/calculator-model.js'),Compare=require('../renderer/compare-model.js');
test('saved setup comparison shows speed/force tradeoff without judging gearing or mass',()=>{
 const a={...C.EXAMPLE,totalWeight:'80'},b={...a,pinion:'10',totalWeight:'100'};
 const rows=Compare.compare(a,b),row=k=>rows.find(r=>r.key===k);
 assert.equal(row('speedKmh').tone,'good');assert.equal(row('forceN').tone,'bad');
 assert.equal(row('ratio').tone,'neutral');assert.equal(row('massG').tone,'neutral');
 assert.ok(Math.abs(row('speedKmh').percent-100/9)<1e-8);
 assert.equal(Compare.compare(a,b,'power').find(r=>r.key==='powerToWeight').tone,'bad');
 assert.ok(Compare.compare(a,b,'neutral').every(r=>r.tone==='neutral'));
});
test('incompatible rating conditions and missing data have no performance verdict',()=>{
 const a={...C.EXAMPLE},b={...a,ratedVoltage:'14',torqueVoltage:'14'};
 const rows=Compare.compare(a,b);assert.equal(rows.find(r=>r.key==='speedKmh').sameBasis,false);
 assert.equal(rows.find(r=>r.key==='forceN').tone,'neutral');
 const blank=Compare.compare(C.blank(),C.blank());assert.ok(blank.every(r=>r.delta===null&&r.tone==='neutral'));
});
