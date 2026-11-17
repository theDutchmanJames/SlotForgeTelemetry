const test=require('node:test'),assert=require('node:assert/strict');
const U=require('../renderer/units.js'),S=require('../renderer/setup-sheet.js'),C=require('../renderer/calculator-model.js');
const close=(a,b,e=1e-9)=>assert.ok(Math.abs(a-b)<=e*Math.max(1,Math.abs(b)),`${a} != ${b}`);
test('metric is the identity; unknown tokens and choices never convert',()=>{
 const m=U.create();assert.equal(m.metric(),true);
 for(const t of ['km/h','g','gf·cm','mm','mm/motor rev','m','W/kg','N','RPM',':1','gf','%'])assert.equal(m.value(12.5,t),12.5);
 assert.equal(m.label('W/kg'),'W/kg');assert.deepEqual(U.clean({speed:'furlongs',mass:'oz'}),{...U.PRESETS.metric,mass:'oz'});
});
test('imperial conversions use exact definitions',()=>{
 const i=U.create(U.PRESETS.imperial);
 close(i.value(1.609344,'km/h'),1);close(i.value(28.349523125,'g'),1);close(i.value(25.4,'mm'),1);close(i.value(0.3048,'m'),1);
 close(i.value(72.00778,'gf·cm'),1,1e-6);close(i.value(1,'W/kg'),0.45359237);
 assert.equal(i.label('mm/motor rev'),'in/motor rev');assert.equal(i.label('W/kg'),'W/lb');assert.equal(i.label('gf'),'gf');
 close(U.create({torque:'mnm'}).value(1,'gf·cm'),0.0980665);
});
test('typed values round-trip to metric without float noise',()=>{
 const i=U.create(U.PRESETS.imperial);
 assert.equal(U.storedText(i.toMetric(0.8,'mm')),'20.32');assert.equal(U.storedText(i.toMetric(2.82,'g')),'79.94566');
 const back=i.value(Number(U.storedText(i.toMetric(2.82,'g'))),'g');close(back,2.82,1e-6);
 assert.equal(U.inputText(NaN),'');assert.equal(U.storedText(Infinity),'');
});
test('every unit-aware input names a convertible metric token',()=>{
 const i=U.create(U.PRESETS.imperial);
 for(const [name,token] of Object.entries(U.INPUTS)){assert.ok(U.TOKENS[token],name);assert.notEqual(i.label(token),token,name);}
});
test('setup sheets follow the chosen units while the saved setup stays metric',()=>{
 const setup={...C.EXAMPLE,totalWeight:'80'},fixed={exportedAt:new Date('2026-11-17T12:00:00Z')};
 const metric=S.html(setup,fixed),imperial=S.html(setup,{...fixed,units:U.PRESETS.imperial});
 assert.match(metric,/27\.02 km\/h/);assert.match(metric,/20 mm/);
 assert.match(imperial,/16\.79 mph/);assert.match(imperial,/0\.787 in/);assert.match(imperial,/2\.822 oz/);assert.match(imperial,/3\.958 oz·in at 12 V/);assert.match(imperial,/in\/motor rev, with no-load mph/);
 assert.doesNotMatch(imperial,/km\/h/);
});
