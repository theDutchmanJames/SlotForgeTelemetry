const {test}=require('node:test'),assert=require('node:assert/strict');
const A=require('../renderer/prediction-model'),C=require('../renderer/calculator-model'),L=require('../renderer/library-model');
const input=extra=>({...C.blank(),...extra});
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
test('readiness distinguishes absent, partial, usable and invalid records',()=>{
 const base=input({adviceUseSetup:'yes',rearDiameter:'19',gearDiameter:'18',tyreLeft:'19',tyreRight:'19',tyreMinimum:'18'});
 const state=(r,key)=>r.inputState.find(s=>s.field===key).status;
 const empty=A.analyze(base);assert.equal(state(empty,'tyreHistory'),'Not entered');
 assert.ok(!empty.guidance.tyres.some(n=>['rearDiameter','gearDiameter','tyreLeft','tyreRight'].includes(n.field)));
 const one=A.analyze({...base,tyreHistory:'0,19'});assert.match(state(one,'tyreHistory'),/1 recorded; 2 needed/);assert.match(one.guidance.tyres.find(n=>n.field==='tyreHistory').title,/second/);
 const two=A.analyze({...base,tyreHistory:'0,19.2\n100,19'});assert.equal(state(two,'tyreHistory'),'2 recorded');assert.ok(!two.guidance.tyres.some(n=>['tyreHistory','tyreMinimum'].includes(n.field)));
 const bad=A.analyze({...base,tyreHistory:'0,19\n100,20'});assert.match(state(bad,'tyreHistory'),/correction/);assert.match(bad.guidance.tyres.find(n=>n.field==='tyreHistory').title,/Review/);
 const outside=A.analyze({...base,tyreHistory:'0,52\n100,51'});assert.match(state(outside,'tyreHistory'),/outside supported/);
 const noWear=A.analyze({...base,tyreHistory:'0,19\n100,19'});assert.match(state(noWear,'tyreHistory'),/no diameter decrease/);assert.ok(!noWear.guidance.tyres.some(n=>n.field==='tyreMinimum'));
 const noGear=A.analyze({...base,gearDiameter:'',tyreRequiredGap:'0.5',tyreHistory:'0,19.2\n100,19'});assert.ok(noGear.guidance.tyres.some(n=>n.field==='gearDiameter'));assert.ok(!noGear.guidance.tyres.some(n=>n.field==='tyreMinimum'));
 const off=A.analyze({...base,adviceUseSetup:'no',tyreHistory:'0,19.2\n100,19'});assert.equal(state(off,'tyreHistory'),'Workbench data excluded');
});
test('existing records request their missing basis rather than re-entry',()=>{
 const r=A.analyze(input({adviceUseSetup:'yes',electricalRows:'Lane 1 | 12 | 11.4 | 2',brakeRows:'0,18',rulesRows:'Mass | 84 | 80 | - | g',experimentRows:'Before | A | 5,5.1'}));
 assert.ok(r.guidance.control.some(n=>n.field==='electricalMode'));assert.ok(!r.guidance.control.some(n=>n.field==='electricalRows'));
 assert.match(r.guidance.control.find(n=>n.field==='brakeRows').title,/another/);
 assert.ok(!r.guidance.checks.some(n=>n.field==='rulesRows'));
 assert.match(r.guidance.race.find(n=>n.field==='experimentRows').title,/other setup/);
 const complete=A.analyze(input({adviceUseSetup:'yes',electricalRows:'Lane 1 | 12 | 11.4 | 2',electricalMode:'dc',brakeRows:'0,18\n1,0',experimentRows:'Before | A | 5,5.1\nAfter | B | 4.9,5',experimentConfirmed:'yes'}));
 assert.ok(!complete.guidance.control.some(n=>['electricalRows','electricalMode','brakeRows'].includes(n.field)));
 assert.ok(!complete.guidance.race.some(n=>['experimentRows','experimentConfirmed'].includes(n.field)));
});
test('every advisor input is optional; observations alone work for every symptom',()=>{
 for(const o of A.fields.adviceSymptom.options){const s=o.split('|')[0],r=A.analyze(input({adviceSymptom:s}));assert.equal(r.error,'');assert.equal(r.evidence.length,0);assert.ok(r.suggestions.length);assert.ok(r.suggestions.every(s=>s.action&&s.trade&&s.test));}
 const r=A.analyze({...C.EXAMPLE,adviceSymptom:'tip'});assert.equal(r.evidence.length,0);assert.deepEqual(r.comparison,[]);
});
test('old setups gain optional defaults and new observations round-trip',()=>{
 const old=C.blank();for(const k of Object.keys(A.fields))delete old[k];const clean=C.cleanSetup(old);assert.equal(clean.adviceUseSetup,'no');
 const setup=input({adviceNotes:'<script>literal notes</script>',adviceSymptom:'slide',adviceComponents:'incomplete row',adviceTestObservations:'A: less sliding'});
 assert.deepEqual(C.decode(C.encode(setup,null)).setup,setup);assert.ok(A.analyze(setup).issues.length);assert.ok(A.analyze(setup).suggestions.length);
});
test('invalid advanced fields preserve symptom guidance and fail save validation',()=>{
 for(const v of ['NaN','Infinity','-2','1e999','0x10',4]){assert.throws(()=>A.clean({adviceHeight:v}));const r=A.analyze(input({adviceHeight:v,adviceSymptom:'tip'}));assert.ok(r.issues.length);assert.ok(r.suggestions.some(s=>s.title.includes('roll stability')));}
 assert.throws(()=>A.clean({adviceGear:'30.5'}));assert.throws(()=>A.clean({adviceSymptom:'bogus'}));
});
test('vertical move conserves mass and computes moments; addition changes mass',()=>{
 const base=input({totalWeight:'80',adviceUseSetup:'yes',adviceHeight:'14',adviceHeightBasis:'measured',advicePartMass:'5',adviceOldZ:'22',adviceNewZ:'3',adviceProposal:'lower'});
 const r=A.analyze(base);near(r.comparison[0].b,80);near(r.comparison[1].b,12.8125);assert.equal(base.totalWeight,'80');
 const add=A.analyze({...base,adviceProposal:'add'});near(add.comparison[0].b,85);near(add.comparison[1].b,(80*14+5*3)/85);
 const bad=A.analyze({...base,advicePartMass:'81'});assert.equal(bad.comparison.length,0);assert.ok(bad.issues.length);
 assert.equal(A.analyze({...base,advicePartMass:'80',adviceOldZ:'3'}).comparison.length,0);
 const bound=A.analyze({...base,adviceHeightBound:'13'});assert.equal(bound.comparison.length,2);assert.ok(bound.issues.length);
});
test('missing values do not become zero; valid zero height/pull values stay usable',()=>{
 const base=input({adviceUseSetup:'yes',totalWeight:'80',adviceHeight:'14',adviceProposal:'lower',advicePartMass:'5',adviceOldZ:'22',adviceNewZ:''});
 assert.equal(A.analyze(base).comparison.length,0);near(A.analyze({...base,adviceNewZ:'0'}).comparison[1].b,12.625);
 assert.equal(A.interpolate(A.yawPoints('0, 0\n10, 5'),0),0);assert.equal(A.interpolate(A.yawPoints('0, 0\n10, 5'),null),null);
});
test('component inertia includes displacement and optional box self inertia',()=>{
 const r=A.massProperties(A.components('Left | 5 | 0 | -10 | 2\nRight | 5 | 0 | 10 | 2'));near(r.mass,10);near(r.y,0);near(r.z,2);near(r.yaw,1000);near(r.roll,1000);
 const box=A.massProperties(A.components('Box | 12 | 0 | 0 | 5 | 10 | 4 | 6'));near(box.yaw,116);near(box.roll,52);
 assert.throws(()=>A.components('Bad | 0 | 0 | 0 | 0'));assert.throws(()=>A.components('Bad | 3 | 1 | 2'));
 const partial=A.analyze(input({adviceComponents:'Part | 5 | 0 | 0 | 2'}));assert.equal(partial.properties.complete,false);
 const mismatch=A.analyze(input({adviceComponents:'Part | 5 | 0 | 0 | 2',adviceInventory:'complete',totalWeight:'80',adviceUseSetup:'yes'}));assert.equal(mismatch.properties.complete,false);assert.ok(mismatch.issues.length);
});
test('magnetic angle interpolation is bounded, never mirrored, and gated by measurement method',()=>{
 const p=A.yawPoints('-20, 10\n0, 20\n10, 15');near(A.interpolate(p,-10),15);assert.equal(A.interpolate(p,11),null);assert.equal(A.interpolate(p,-21),null);assert.throws(()=>A.yawPoints('0, 20\n0, 21'));
 for(const method of ['unknown','total','rear','gauss'])assert.equal(A.analyze(input({adviceYawRows:'0,20\n10,10',adviceYawAngle:'5',adviceRails:'yes',advicePullMethod:method})).yaw.eligible,false);
 const r=A.analyze(input({adviceYawRows:'0,20\n10,10',adviceYawAngle:'5',adviceRails:'yes',advicePullMethod:'net'}));near(r.yaw.value,15);near(r.yaw.retention,75);
});
test('gear what-if respects same motor and withholds compound-stage substitution',()=>{
 const i=input({adviceUseSetup:'yes',pinion:'11',gear:'30',rearDiameter:'20',ratedRpm:'18000',adviceProposal:'gear',adviceGear:'32'}),r=A.analyze(i);near(r.comparison[3].b,32/30);near(r.comparison[2].b/r.comparison[2].a,30/32);
 assert.equal(A.analyze({...i,gearStages:'11,30\n10,20'}).comparison.length,0);assert.equal(i.gear,'30');
});
test('motor pull comparison needs compatible measurements and magnetic rails',()=>{
 const i=input({adviceUseSetup:'yes',adviceProposal:'motor',magneticReadings:'20',adviceCandidatePull:'30',adviceMotorMatch:'yes',advicePullMethod:'net',adviceRails:'yes'});
 near(A.analyze(i).comparison[0].b,0.2941995);for(const extra of [{adviceRails:'no'},{adviceRails:'unknown'},{advicePullMethod:'rear'},{adviceMotorMatch:'unknown'}])assert.equal(A.analyze({...i,...extra}).comparison.length,0);
 assert.equal(A.analyze({...i,adviceCandidatePull:'0'}).comparison[0].b,0);
});
test('support margin uses actual confirmed supports, not an angle score',()=>{
 const i=input({adviceUseSetup:'yes',totalWeight:'80',adviceHeight:'14',chassisGuideSpan:'100',chassisTrack:'60',chassisMode:'tripod',chassisConfirmed:'yes',chassisFront:'20',chassisLeft:'30',chassisRight:'30'});
 const r=A.analyze(i);near(r.support.distance,2250/Math.hypot(100,30));assert.equal(A.analyze({...i,chassisMode:'mixed'}).support,null);assert.equal(A.analyze({...i,chassisConfirmed:'no'}).support,null);assert.equal(A.analyze({...i,totalWeight:'90'}).support,null);
});
test('all workshop tools are represented; recommendations match their area',()=>{
 const r=A.analyze(C.blank());for(const key of Object.keys(require('../renderer/workshop-model').tools))assert.ok(r.coverage.some(c=>c.key===key));
 assert.ok(A.analyze(input({adviceSymptom:'brake'})).suggestions.some(s=>s.area==='control'));
});
test('stock inputs produce visible core results and targeted next inputs without inferring grip',()=>{
 const stock=input({adviceUseSetup:'yes',adviceSymptom:'tip',totalWeight:'80',pinion:'10',gear:'30',rearDiameter:'19',ratedRpm:'18000'}),r=A.analyze(stock);
 const drive=r.coverage.find(c=>c.key==='stockDrive');near(drive.metrics.find(m=>m.label==='Gear ratio').value,3);near(drive.metrics.find(m=>m.label==='No-load speed').value,18000/3*Math.PI*19*60/1e6);
 assert.match(r.suggestions.find(s=>s.title==='Investigate roll stability').why,/80 g/);
 assert.ok(r.guidance.handling.some(n=>n.field==='adviceHeight'));assert.ok(!r.guidance.drive.some(n=>n.field==='rearDiameter'));assert.match(r.guidance.drive.find(n=>n.title.includes('rating basis')).why,/stall torque/);
 assert.ok(!A.analyze({...stock,adviceHeight:'14'}).guidance.handling.some(n=>n.field==='adviceHeight'));
 const excluded=A.analyze({...stock,adviceUseSetup:'no'});assert.equal(excluded.coverage.find(c=>c.key==='stockDrive').metrics.length,0);assert.match(excluded.inputSummary,/switched off/);
 assert.equal(new Set(r.coverage.map(c=>c.key)).size,r.coverage.length);
});
test('empty workshop metrics are not results; zero is a valid result and row-only tools remain available',()=>{
 const r=A.analyze(input({adviceUseSetup:'yes',tyreLeft:'19',tyreRight:'19'}));
 for(const key of ['gears','braking']){const tool=r.coverage.find(c=>c.key===key);assert.equal(tool.metrics.length,0);assert.equal(tool.status,'Optional measurements missing');}
 near(r.coverage.find(c=>c.key==='tyres').metrics.find(m=>m.label==='Left/right diameter mismatch').value,0);
 const electric=A.analyze(input({adviceUseSetup:'yes',electricalMode:'dc',electricalRows:'Lane 1 | 12 | 11 | 1'})).coverage.find(c=>c.key==='electrical');assert.equal(electric.rows.length,1);assert.match(electric.status,/Results available/);
});
test('unsupported clearance targets never become advice for an oversized tyre',()=>{
 const stock=input({adviceUseSetup:'yes',rearDiameter:'19',gearDiameter:'18',tyreRequiredGap:'17'}),r=A.analyze(stock);
 const tyre=r.coverage.find(c=>c.key==='tyres');near(tyre.metrics.find(m=>m.label==='Current gap below driven gear').value,0.5);
 assert.ok(!tyre.metrics.some(m=>m.value===52||m.value===-33));assert.doesNotMatch(JSON.stringify(r.suggestions),/52|33/);
 const worn=A.analyze({...stock,tyreRequiredGap:'0.5',tyreMinimum:'19.2'});assert.equal(worn.suggestions[0].title,'The tyre has reached its usable minimum');
 assert.ok(!A.analyze({...stock,adviceUseSetup:'no'}).coverage.find(c=>c.key==='tyres').metrics.length);
});
test('note fields are explicitly described and do not silently alter numerical results or diagnoses',()=>{
 const stock=input({adviceUseSetup:'yes',adviceSymptom:'slide',totalWeight:'80',pinion:'10',gear:'30',rearDiameter:'19'}),a=A.analyze(stock),b=A.analyze({...stock,adviceTrack:'Bumpy wood track',adviceTyres:'Silicone tyres',adviceController:'12 V 50% brake'});
 assert.deepEqual(a.suggestions,b.suggestions);assert.deepEqual(a.coverage,b.coverage);
 for(const key of ['adviceTrack','adviceTyres','adviceController'])assert.match(A.hints[key],/Saved notes only/);
 const fields=new Set([...Object.keys(C.blank()),...Object.keys(A.fields)]);for(const g of Object.values(a.guidance))for(const n of g)assert.ok(fields.has(n.field),n.field);
});
test('coasting, power and corner phase affect the suggested test',()=>{
 const a=A.analyze(input({adviceSymptom:'slide',advicePower:'coast',advicePhase:'entry'})).suggestions.find(s=>s.area==='handling');assert.match(a.action,/electrical braking is off/);assert.match(a.test,/corner entry/);
 const b=A.analyze(input({adviceSymptom:'slide',advicePower:'power'})).suggestions.find(s=>s.area==='handling');assert.match(b.action,/gentler throttle/);
});
test('prediction evidence captures physical inputs without recursive run data',()=>{
 const X=require('../renderer/chassis-test-model');const setup=input({pinion:'11',gear:'30',adviceHeight:'14',adviceGoal:'Less tipping',adviceTestObservations:'Excluded from physical snapshot',experimentRows:'A | A | 5,6',chassisRunSnapshots:'[]'});
 const text=X.capture(setup,{row:0,entry:{id:'car-a',setup:{...setup,name:'Car A'}},now:'2026-11-10T12:00:00Z'}),r=X.records(text)[0];setup.gear='32';assert.equal(r.prediction.gear,'30');assert.equal(r.prediction.adviceGoal,'Less tipping');assert.equal(r.prediction.experimentRows,undefined);assert.equal(r.prediction.chassisRunSnapshots,undefined);assert.equal(r.prediction.adviceTestObservations,undefined);assert.equal(X.attached(r,'edited | A | 5,6'),false);
 const legacy={...r};delete legacy.prediction;assert.equal(X.records(JSON.stringify([legacy]))[0].prediction,undefined);
});
