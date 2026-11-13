const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../renderer/calculator-model.js'),D=require('../renderer/driver-feedback-model.js'),Checks=require('../renderer/feedback-checks.js'),K=require('../renderer/handling-knowledge.js');
const setup=overrides=>({...C.blank(),...overrides}),calc=s=>D.analyze(C.inputOf(s));
const fixture={...require('./chassis-fixtures.cjs'),adviceUseSetup:'yes',adviceChecks:'clear',adviceSymptom:'tip',totalWeight:'80',adviceHeight:'14',adviceHeightBasis:'measured'};
const rule=(s,id)=>calc(s).suggestions.find(x=>x.id===id);
test('the research catalogue retains every record, valid sources and explicit counterexamples',()=>{
 assert.equal(K.records.length,79);assert.equal(K.sources.length,61);assert.equal(new Set(K.records.map(r=>r.id)).size,79);
 const covered=new Set(Object.values(K.principles).flatMap(p=>p.records).map(n=>'R'+n));
 for(const r of K.records){assert(covered.has(r.id),r.id);for(const id of r.sources)assert(K.sources.some(s=>s.id===id&&/^https:\/\//.test(s.url)));}
 for(const key of Object.keys(K.principles)){const p=K.evidence(key);assert(p.records.every(Boolean));assert(p.limit);assert(p.lesson);}
 assert(K.evidence('tyres').records.some(r=>/no meaningful/.test(r.report)));
 assert.match(K.principles.layout.limit,/no controlled/);assert.match(K.principles.body.limit,/No verified/);
});
test('all symptoms work without measurements and retain practical actions',()=>{
 for(const symptom of Object.keys(D.descriptions)){const r=calc(setup({adviceSymptom:symptom}));assert(r.suggestions.length>=2);assert(r.suggestions.every(s=>s.action&&s.why&&s.principles.length));assert(r.next.length);assert.equal(r.mass,null);}
 const empty=calc(setup()),demo=calc({...C.EXAMPLE});assert.deepEqual(empty.suggestions,demo.suggestions);
});
test('support and body measurements change the actual explanation without invented risk scores',()=>{
 const narrow=rule(setup({...fixture,chassisTrack:'45'}),'support-height'),wide=rule(setup({...fixture,chassisTrack:'65'}),'support-height');
 assert.notEqual(narrow.why,wide.why);assert.match(narrow.why,/45 mm/);assert.match(wide.why,/65 mm/);assert.match(wide.action,/does not establish a safe speed/);
 const light=rule(setup({...fixture,adviceBodyMass:'15'}),'body-mass'),heavy=rule(setup({...fixture,adviceBodyMass:'35'}),'body-mass');assert.match(light.why,/18.75%/);assert.match(heavy.why,/43.75%/);
 assert(!rule(setup({...fixture,chassisMode:'mixed'}),'support-height'));assert(!rule(setup({...fixture,chassisConfirmed:'no'}),'support-height'));assert(!rule(setup({...fixture,totalWeight:'81'}),'support-height'));
});
test('ballast plan quantifies loads and points out a reduction in guide load',()=>{
 const s=setup({...fixture,adviceSymptom:'guide',chassisChanges:JSON.stringify([{name:'Move existing',action:'move',mass:'5',x:'20',y:'0',toX:'80',toY:'0'}])});
 const r=rule(s,'ballast-plan');assert.match(r.why,/20 → 17 g/);assert.match(r.action,/reduces the front support load/);assert.equal(s.totalWeight,'80');
 const add=setup({...fixture,adviceProposal:'add',advicePartMass:'5',adviceNewZ:'2'});assert.match(rule(add,'height-proposal').action,/lowers CG height/);
 assert.match(rule({...add,adviceNewZ:'20'},'height-proposal').action,/does not lower/);
});
test('tyre-change wheel lift uses the researched grip/roll trade-off',()=>{
 const s=setup({adviceSymptom:'tip',adviceRecentChange:'tyres'}),r=rule(s,'grip-after-tyres');assert(r);assert.deepEqual(r.principles,['gripRoll']);assert.match(r.action,/previous tyres/);
 assert(!rule({...s,adviceRecentChange:'none'},'grip-after-tyres'));
 for(const [change,id] of Object.entries({body:'route-mounting',ballast:'after-ballast',motor:'after-motor',gearing:'after-gearing',track:'after-conditions',layout:'layout-package'}))assert(rule({...s,adviceRecentChange:change},id));
});
test('known numerical conflicts stay visible together and cannot be cleared by a checklist',()=>{
 let s=setup({adviceUseSetup:'yes',adviceSymptom:'slide',rearDiameter:'19',gearDiameter:'20',tyreLeft:'19',tyreRight:'18.8',tyreMinimum:'20',rulesRows:'Mass | 85 | - | 80 | g'});
 s.adviceCheckLog=Checks.mark(C.inputOf(s),'tyres','clear');const r=calc(s);
 for(const id of ['gear-clearance','tyre-mismatch','tyre-minimum','class-limits'])assert(r.suggestions.find(s=>s.id===id&&s.unresolved),id);
 assert(r.suggestions.some(s=>s.id==='symptom-slide'));
 assert.equal(rule({...s,rangeDiameter:'0.2'},'tyre-mismatch').unresolved,false);
});
test('next questions adapt to supplied facts and avoid irrelevant measurements',()=>{
 let s=setup({adviceSymptom:'slide'});assert.equal(calc(s).next[0].field,'adviceSlideWhen');s.advicePower='power';assert.equal(calc(s).next[0].field,'adviceWheelspin');
 s={...s,adviceDirection:'both',advicePhase:'exit',adviceRecentChange:'none',adviceWheelspin:'yes',adviceUseSetup:'yes',rearDiameter:'19',gearDiameter:'18',tyreLeft:'19',tyreRight:'19',chassisGuideSpan:'100',chassisTrack:'60'};
 const fields=calc(s).next.map(q=>q.field);assert(!fields.includes('advicePower'));assert(!fields.includes('rearDiameter'));assert(!fields.includes('tyreHistory'));assert(!fields.includes('ratedRpm'));assert(rule(s,'wheelspin'));
 const outside=setup({...fixture,chassisTrackMethod:'outside',chassisOutside:'68',chassisLeftWidth:'',chassisRightWidth:'8'});assert(calc(outside).next.some(q=>q.field==='chassisLeftWidth'));assert(!calc(outside).next.some(q=>q.field==='chassisOutside'));
 const complete=setup({...fixture,adviceBodyMass:'20',adviceDirection:'both',advicePhase:'middle',adviceRecentChange:'none',adviceBody:'high',rearDiameter:'19',gearDiameter:'18',tyreLeft:'19',tyreRight:'19'});assert(!calc(complete).next.some(q=>['adviceBodyMass','adviceHeight','chassisMode','chassisFront','totalWeight'].includes(q.field)));assert(calc(complete).next.some(q=>q.field==='adviceProposal'));
});
test('check results are scoped, survive exports, and can be explicitly reconfirmed',()=>{
 let s=setup({name:'Checked car',adviceSymptom:'tip'});s.adviceCheckLog=Checks.mark(C.inputOf(s),'body','clear');s.adviceCheckLog=Checks.mark(C.inputOf(s),'tyres','issue');
 assert.equal(calc(s).checks.statuses.body,'clear');assert.equal(calc(s).suggestions[0].id,'check-tyres');assert(!calc(s).suggestions.some(r=>r.id==='check-body'));
 const restored=C.decode(C.encode(s,null)).setup;assert.deepEqual(calc(restored).checks.statuses,calc(s).checks.statuses);
 const changed={...restored,tyreLeft:'19'};assert(calc(changed).checks.stale);assert.equal(calc(changed).checks.statuses.tyres,undefined);changed.adviceCheckLog=Checks.mark(C.inputOf(changed),'guide','clear');assert.equal(calc(changed).checks.statuses.guide,'clear');assert(calc(changed).checks.staleIds.includes('tyres'));
 changed.adviceCheckLog=Checks.reconfirm(C.inputOf(changed));assert.equal(calc(changed).checks.statuses.tyres,'issue');
 assert(!calc({...s,name:'Renamed',adviceStep:'measure'}).checks.stale);
 assert.throws(()=>Checks.parse('{'),/could not be read/);assert.throws(()=>C.cleanSetup({...s,adviceCheckLog:'{}'}),/Invalid/);
 assert.throws(()=>Checks.parse(JSON.stringify({version:1,scope:'',items:[{id:'bogus',status:'clear'}]})),/Invalid/);
});
test('linked tests advance a specific suggestion; unresolved measurements remain',()=>{
 let s=setup({adviceSymptom:'tip',adviceOutcome:'clear'}),first=calc(s).suggestions[0];
 s={...s,adviceTestId:first.id,adviceTestAction:first.action,adviceTestChange:first.action};s.adviceResultContext=D.record(C.inputOf(s));assert(!calc(s).suggestions.some(x=>x.id===first.id));
 const reset={...s,adviceCheckLog:Checks.mark(C.inputOf(s),first.checkId,'unknown')};assert.equal(calc(reset).checks.statuses[first.checkId],'unknown');assert(calc(reset).suggestions.some(x=>x.id===first.id));
 for(const outcome of ['same','better','worse']){const repeated={...reset,adviceOutcome:outcome};repeated.adviceResultContext=D.record(C.inputOf(repeated));assert(calc(repeated).suggestions.some(x=>x.id===first.id));}
 const edited={...s,adviceTestChange:'Something else'};assert.equal(calc(edited).resultState,'changed');assert(calc(edited).suggestions.some(x=>x.id===first.id));
 s={...s,adviceOutcome:'better'};s.adviceResultContext=D.record(C.inputOf(s));assert.equal(calc(s).suggestions[0].id,'test-followup');
 const conflict=setup({adviceUseSetup:'yes',rearDiameter:'19',gearDiameter:'20',adviceSymptom:'tip',adviceOutcome:'clear'}),issue=rule(conflict,'gear-clearance');Object.assign(conflict,{adviceTestId:issue.id,adviceTestAction:issue.action,adviceTestChange:issue.action});conflict.adviceResultContext=D.record(C.inputOf(conflict));assert(rule(conflict,'gear-clearance'));
});
test('previous-version recorded outcomes are not invalidated by new blank optional fields',()=>{
 const s=setup({adviceSymptom:'tip',adviceTestChange:'Check body clearance',adviceOutcome:'better'}),old=JSON.parse(D.context(C.inputOf(s)));
 for(const k of ['adviceRecentChange','adviceWheelspin','adviceBrakeFeel','adviceTestId','adviceTestAction'])delete old[k];s.adviceResultContext=JSON.stringify(old);assert.equal(calc(s).resultState,'recorded');assert.equal(calc({...s,adviceRecentChange:'tyres'}).resultState,'changed');
});
test('magnetic interpretation requires net force, rail response and motor-off angle tests',()=>{
 const s=setup({adviceUseSetup:'yes',adviceSymptom:'snap',adviceRails:'yes',advicePullMethod:'net',magneticCondition:'off',magneticReadings:'0',adviceYawRows:'0, 10\n10, 5\n20, 2',adviceYawAngle:'10'});
 assert.match(rule(s,'magnetic-force').action,/zero net pull/);assert.match(rule(s,'yaw-force').why,/50%/);
 for(const extra of [{adviceRails:'no'},{advicePullMethod:'total'},{adviceUseSetup:'no'},{magneticCondition:'running'},{magneticCondition:'unknown'}])assert(!rule({...s,...extra},'yaw-force'));
 assert(!rule({...s,adviceYawAngle:'30'},'yaw-force'));assert(!rule({...s,adviceRails:'no'},'magnetic-force'));
});
test('gearing advice combines the proposal with power-on sliding and never applies it',()=>{
 const s=setup({adviceUseSetup:'yes',adviceSymptom:'slide',advicePower:'power',pinion:'9',gear:'27',rearDiameter:'19',adviceProposal:'gear',adviceGear:'30'});
 assert.match(rule(s,'gearing-proposal').why,/1.1111/);assert.match(rule(s,'gearing-proposal').action,/aggravate/);assert.equal(s.gear,'27');assert(!rule({...s,gearStages:'9, 27\n10, 20'},'gearing-proposal'));
});
test('wear, steady DC, braking and inertia findings retain their measurement limits',()=>{
 const s=setup({adviceUseSetup:'yes',adviceSymptom:'fade',rearDiameter:'19',gearDiameter:'18',wornDiameter:'17',electricalMode:'dc',electricalRows:'Far end | 12 | 11 | 2',brakeRows:'0, 18\n1, 0'});
 assert(rule(s,'wear-geometry').unresolved);assert.match(rule(s,'voltage-drop').why,/1 V/);assert.match(rule(s,'braking-trace').why,/5 m\/s/);
 assert(!rule({...s,electricalMode:'pulsed'},'voltage-drop'));assert(!rule({...s,electricalRows:'broken'},'voltage-drop'));
 assert.match(rule({...s,adviceSymptom:'brake',brakeRows:'0, 0\n1, 18'},'braking-trace').action,/does not show net slowing/);
 assert(rule({...s,adviceSymptom:'slow',totalWeight:'80',inertiaRows:'Tyres | 4 | 9.5 | 8 | 1'},'rotating-mass'));
});
test('test-run advice keeps faster pace and increased incidents together',()=>{
 const s=setup({adviceUseSetup:'yes',adviceSymptom:'consistent',experimentConfirmed:'yes',experimentRows:'A before | A | 5, 5, 5 | 0 | 0\nB trial | B | 4.8, 4.8, 4.8 | 1 | 2\nA after | A | 5.1, 5.1, 5.1 | 0 | 0'});
 assert.match(rule(s,'run-comparison').action,/faster.*more reported incidents/);assert.match(rule(s,'run-comparison').why,/Return-to-A drift/);
 assert(!rule({...s,experimentConfirmed:'no'},'run-comparison'));assert(!rule({...s,experimentRows:'broken'},'run-comparison'));
 const missing={...s,experimentRows:'A | A | 5, 5\nB | B | 4.8, 4.8'};assert.doesNotMatch(rule(missing,'run-comparison').why,/incidents per/);
});
