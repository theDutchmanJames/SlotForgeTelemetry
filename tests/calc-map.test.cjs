const test=require('node:test'),assert=require('node:assert/strict');
const M=require('../renderer/calc-map-model.js'),C=require('../renderer/calculator-model.js');
test('the map uses the same numbers as the workbench',()=>{
 const v=M.values(C.inputOf({...C.EXAMPLE,totalWeight:'80'}));
 assert.equal(v.ratio,3);assert.equal(Math.round(v.axleRpm),7167);assert.equal(v.rollout.toFixed(2),'20.94');assert.equal(v.speedKmh.toFixed(2),'27.02');
 assert.equal(v.forceN.toFixed(2),'8.38');assert.equal(v.powerToWeight.toFixed(2),'196.64');assert.ok(Math.abs(v.circ-Math.PI*20)<1e-9);
 const blank=M.values(C.inputOf(C.blank()));assert.equal(blank.ratio,null);assert.equal(blank.speedKmh,null);
});
test('every line joins two known boxes, left to right, and every box explains itself',()=>{
 for(const e of M.edges()){assert.ok(M.byId[e.from]&&M.byId[e.to]);assert.ok(M.byId[e.from].col<M.byId[e.to].col||e.from==='ratio'&&e.to==='axleRpm');}
 for(const n of M.NODES){assert.ok(n.topic);if(n.col>0){assert.ok(n.formula);assert.ok(M.LIMITS[n.id]);}else assert.ok(n.field);}
});
test('the path behind a number, and what uses it',()=>{
 assert.deepEqual([...M.path('rollout')].sort(),['circ','gear','pinion','ratio','rollout','tyre']);
 assert.deepEqual([...M.path('powerToWeight')].sort(),['peakPowerW','powerToWeight','rpm','torque','weight']);
 assert.deepEqual(M.usedBy('ratio'),['axleRpm','rollout','forceN']);assert.deepEqual(M.usedBy('weight'),['powerToWeight']);
});
