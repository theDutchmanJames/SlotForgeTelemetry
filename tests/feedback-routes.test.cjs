const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../renderer/calculator-model.js'),D=require('../renderer/driver-feedback-model.js'),R=require('../renderer/feedback-routes.js'),Checks=require('../renderer/feedback-checks.js');
const setup=x=>({...C.blank(),...x}),analyze=x=>D.analyze(C.inputOf(setup(x))),rule=(x,id)=>analyze(x).suggestions.find(s=>s.id===id),fields=x=>analyze(x).next.map(q=>q.field);

test('all ten starting routes have a distinct first question and no required measurements',()=>{
 const routes={tip:'adviceTipFirst',slide:'adviceSlideWhen',snap:'adviceCatchResult',guide:'adviceGuideWhen',hop:'adviceHopWhen',slow:'adviceWeakWhere',brake:'adviceBrakeFeel',fade:'adviceFadeWhat',consistent:'adviceConsistentWhat',unknown:'adviceUnknownWhat'};
 for(const [symptom,first] of Object.entries(routes)){
  const d=analyze({adviceSymptom:symptom});assert.equal(d.next[0].field,first);assert.equal(d.mass,null);assert(d.suggestions.some(s=>s.kind==='inspection'));
  for(const option of require('../renderer/prediction-model.js').fields[first].options.slice(1)){
   const x={adviceSymptom:symptom,[first]:option.split('|')[0]},r=analyze(x);
   assert(!r.next.some(q=>q.field===first),symptom+'/'+option);assert(r.suggestions.length);assert.equal(new Set(r.suggestions.map(s=>s.id)).size,r.suggestions.length);
   for(const s of r.suggestions){assert(s.title&&s.why&&s.action&&s.test&&s.trade&&s.effort&&s.tools);assert(!/undefined|NaN/.test(JSON.stringify(s)),s.id);}
   assert.deepEqual(C.decode(C.encode(setup(x))).setup,C.cleanSetup(setup(x)));
  }
 }
});

test('explicit crossovers retain original observations and stop contradictory cycles',()=>{
 const cases=[
  [{adviceSymptom:'tip',adviceTipFirst:'front'},'guide','adviceGuideWhen'],
  [{adviceSymptom:'tip',adviceTipFirst:'catch'},'snap','adviceCatchResult'],
  [{adviceSymptom:'slide',adviceSlideWhen:'brake'},'brake','adviceBrakeDirection'],
  [{adviceSymptom:'snap',adviceCatchResult:'hop'},'hop','adviceHopWhen'],
  [{adviceSymptom:'guide',adviceGuideWhen:'accel',adviceGuideFirst:'cutout'},'slow','adviceCutoutWhere'],
  [{adviceSymptom:'slow',adviceWeakWhere:'fade'},'fade','adviceCooling'],
  [{adviceSymptom:'consistent',adviceConsistentWhat:'incident',advicePrimaryIncident:'tip'},'tip','adviceTipFirst'],
  [{adviceSymptom:'fade',adviceFadeWhat:'pace'},'consistent','adviceRunContext'],
  [{adviceSymptom:'unknown',adviceUnknownWhat:'slow'},'slow','adviceWeakWhere']
 ];
 for(const [x,symptom,question] of cases){const before=JSON.stringify(x),d=analyze(x);assert.equal(d.route.symptom,symptom);assert(d.next.some(q=>q.field===question),question);assert.equal(JSON.stringify(x),before);assert.equal(d.originalInput.adviceSymptom,x.adviceSymptom);}
 const cycle=analyze({adviceSymptom:'tip',adviceTipFirst:'front',adviceGuideWhen:'roll'});assert.equal(cycle.next[0].level,0);assert(cycle.suggestions.some(s=>s.id==='route-sequence'));assert(cycle.route.path.length<4);
});

test('observation answers distinguish wheel lift, trip, coast, hopping and contact',()=>{
 assert(rule({adviceSymptom:'tip',adviceTipFirst:'lift'},'route-wheel-lift'));
 const trip={adviceSymptom:'tip',adviceTipFirst:'trip',adviceUseSetup:'yes'};assert(rule(trip,'route-local'));assert(!fields(trip).includes('adviceHeight'));assert(!fields(trip).includes('totalWeight'));
 const coast={adviceSymptom:'slide',adviceSlideWhen:'coast'};assert.match(rule({...coast,adviceLowerSpeed:'no'},'route-coast-slide').why,/disappears/);assert(!fields(coast).includes('adviceWheelspin'));
 const hop={adviceSymptom:'hop',adviceHopWhen:'power'};assert.match(rule({...hop,adviceGentle:'no'},'route-power-hop').action,/axle alignment/);assert.notEqual(rule({...hop,adviceGentle:'yes'},'route-power-hop').action,rule({...hop,adviceGentle:'no'},'route-power-hop').action);
 assert(rule({adviceSymptom:'guide',adviceGuideWhen:'all',adviceFrontContact:'yes'},'route-front-contact').unresolved);
 const local={adviceSymptom:'guide',adviceGuideWhen:'bump',adviceOtherCar:'yes'};assert(rule(local,'route-shared-location'));assert.match(rule(local,'route-shared-location').action,/does not prove/);
});

test('tyre profiling, rim slip and body versus pod work get distinct checks',()=>{
 const tyre={adviceSymptom:'tip',adviceTipFirst:'lift',adviceTrued:'yes'};
 assert.match(rule({...tyre,adviceShoulder:'square'},'route-shoulders').why,/squared/);
 assert.match(rule({...tyre,adviceShoulder:'rounded'},'route-shoulders').action,/Do not remove more/);
 const mounting={adviceSymptom:'hop',adviceRecentChange:'body'};
 assert.match(rule({...mounting,adviceMountChange:'pod'},'route-mounting').action,/keeping body adjustment fixed/);
 assert.match(rule({...mounting,adviceMountChange:'body'},'route-mounting').action,/keeping the pod fixed/);
 assert(rule({...mounting,adviceMovement:'yes'},'route-rubbing').unresolved);
 const slipping={adviceSymptom:'slow',adviceWeakWhere:'revs',adviceUseSetup:'yes',pinion:'9',gear:'27',rearDiameter:'19'};
 for(const slip of ['rim','hardware','track','none'])assert(rule({...slipping,adviceDriveSlip:slip},'route-drive-slip'));
 assert.match(rule({...slipping,adviceDriveSlip:'rim'},'route-drive-slip').action,/tyre\/rim-compatible/);
 assert.match(rule({...slipping,adviceDriveSlip:'hardware'},'route-drive-slip').action,/secure the wheel or gear/);
 assert.match(rule({...slipping,adviceDriveSlip:'track'},'route-drive-slip').action,/before a torque increase/);
 for(const slip of ['rim','hardware','track'])assert(!rule({...slipping,adviceDriveSlip:slip},'drivetrain'));
});

test('weak power uses its branch and distinguishes controller travel and shared supply',()=>{
 const weak={adviceSymptom:'slow',adviceWeakWhere:'accel'};
 assert(fields(weak).includes('adviceRevs'));
 assert(fields({...weak,adviceRevs:'yes'}).includes('adviceDriveSlip'));
 assert(rule({...weak,adviceRevs:'no'},'route-acceleration'));
 assert(rule({adviceSymptom:'slow',adviceWeakWhere:'tight'},'route-tight-drag'));
 const top={adviceSymptom:'slow',adviceWeakWhere:'top'};assert.notEqual(rule({...top,adviceStillGaining:'yes'},'route-straight-speed').why,rule({...top,adviceStillGaining:'no'},'route-straight-speed').why);
 const trigger={adviceSymptom:'slow',adviceWeakWhere:'trigger'};
 assert.match(rule({...trigger,adviceSystem:'digital'},'route-trigger').action,/documented car speed/);
 assert.match(rule({...trigger,adviceSystem:'analogue'},'route-trigger').action,/sensitivity/);
 assert(rule({...weak,adviceFullTrigger:'full'},'route-full-power'));assert(!rule({...weak,adviceFullTrigger:'full'},'route-trigger'));
 assert.match(rule({...weak,adviceSharedPower:'yes',adviceSystem:'digital'},'route-shared-power').action,/Digital electronics/);
 assert.match(rule({...weak,adviceSharedPower:'yes',adviceSystem:'analogue'},'route-shared-power').action,/loaded rail voltage/);
 const digital=fields({...weak,adviceSystem:'digital',adviceUseSetup:'yes'});assert(!digital.includes('electricalRows'));
});

test('braking, deterioration and consistency answers change the practical advice',()=>{
 const brake={adviceSymptom:'brake',adviceBrakeFeel:'weak'};
 assert.match(rule({...brake,adviceBrakeAdjust:'fixed'},'route-brake').action,/Do not assume/);
 assert.match(rule({...brake,adviceBrakeAdjust:'no'},'route-brake').action,/not proof/);
 assert.match(rule({...brake,adviceBrakeFeel:'sideways',adviceBrakeDirection:'same'},'route-brake').action,/both sides/);
 const fade={adviceSymptom:'fade',adviceFadeWhat:'grip'};
 assert.match(rule({...fade,adviceCleaning:'yes'},'route-fading-grip').action,/cleaning and preparation interval/);
 assert.match(rule({...fade,adviceCleaning:'no'},'route-fading-grip').action,/wear, seating/);
 assert(fields({...fade,adviceUseSetup:'yes'}).includes('tyreHistory'));
 assert(!fields({adviceSymptom:'fade',adviceFadeWhat:'power',adviceUseSetup:'yes'}).includes('tyreHistory'));
 assert.match(rule({adviceSymptom:'fade',adviceFadeWhat:'power',adviceCooling:'no'},'route-warm-power').action,/lasting changes/);
 const pace={adviceSymptom:'consistent',adviceConsistentWhat:'times'};
 assert.match(rule({...pace,adviceRunContext:'traffic'},'route-lap-context').action,/Separate traffic/);
 assert.match(rule({...pace,adviceRunContext:'warmup'},'route-lap-context').action,/same warm-up/);
 assert.match(rule({adviceSymptom:'consistent',adviceConsistentWhat:'tradeoff',advicePriority:'best'},'route-goal').action,/do not call it the best race setup/);
});

test('inactive branch answers remain saved without steering unrelated routes',()=>{
 const baseline={adviceSymptom:'brake',adviceBrakeFeel:'weak',adviceSystem:'analogue'};
 const stale={...baseline,adviceFullTrigger:'travel',adviceSharedPower:'yes',adviceHopWhen:'corner',adviceTrued:'yes',adviceDriveSlip:'rim',adviceOthersFade:'yes'};
 assert.deepEqual(analyze(stale).suggestions,analyze(baseline).suggestions);
 assert.deepEqual(fields(stale),fields(baseline));assert.equal(analyze(stale).originalInput.adviceDriveSlip,'rim');
 const accel={adviceSymptom:'slow',adviceWeakWhere:'accel',adviceRevs:'no',adviceUseSetup:'yes',gear:'27',pinion:'9',rearDiameter:'19'};
 assert(rule({...accel,adviceDriveSlip:'rim'},'drivetrain'));
 assert(!rule({adviceSymptom:'tip',adviceOnset:'new',adviceRecentChange:'body'},'route-mounting'));
});

test('skips and unavailable checks persist without hiding measured conflicts',()=>{
 const x={adviceSymptom:'tip',adviceTipFirst:'lift',adviceRouteSkipped:JSON.stringify(['adviceMovement']),adviceUnavailable:JSON.stringify(['route-wheel-lift'])};
 assert(!fields(x).includes('adviceMovement'));assert(!rule(x,'route-wheel-lift'));assert(rule(x,'alternative-observe'));
 assert.equal(C.decode(C.encode(setup(x))).setup.adviceRouteSkipped,x.adviceRouteSkipped);
 const hard={...x,adviceUseSetup:'yes',rearDiameter:'19',gearDiameter:'20',adviceUnavailable:JSON.stringify(['gear-clearance']),adviceRouteSkipped:JSON.stringify(['gearDiameter'])};
 assert(rule(hard,'gear-clearance').unresolved);assert.equal(analyze(hard).next[0].level,0);
 assert.throws(()=>C.cleanSetup(setup({adviceRouteSkipped:'["bad", "bad"]'})),/Invalid/);
 assert.throws(()=>R.list('["<img>"]'),/Invalid/);
 assert.doesNotThrow(()=>analyze({adviceRouteSkipped:'{'}));
});

test('checks survive unrelated route changes but relevant physical changes require individual rechecks',()=>{
 let x=setup({adviceSymptom:'tip',rearDiameter:'19',adviceSystem:'analogue'});
 for(const id of ['body','tyres','pickup'])x.adviceCheckLog=Checks.mark(C.inputOf(x),id,'clear');
 assert(!Checks.state(C.inputOf({...x,adviceSymptom:'brake',adviceBrakeFeel:'strong',totalWeight:'80',tyreMinimum:'18',tyreRequiredGap:'0.5',chassisMaxMass:'90',chassisChanges:'[]',gearMin:'25',gearMax:'30'})).stale);
 const changed={...x,rearDiameter:'20'},c=Checks.state(C.inputOf(changed));assert.deepEqual(c.staleIds.sort(),['body','tyres']);assert.equal(c.statuses.pickup,'clear');
 changed.adviceCheckLog=Checks.mark(C.inputOf(changed),'tyres','clear');assert.deepEqual(Checks.state(C.inputOf(changed)).staleIds,['body']);
 const legacy={...x,adviceCheckLog:JSON.stringify({version:1,scope:'old scope',items:[{id:'tyres',status:'clear'},{id:'pickup',status:'issue'}]})};
 legacy.adviceCheckLog=Checks.mark(C.inputOf(legacy),'tyres','clear');assert.equal(Checks.state(C.inputOf(legacy)).statuses.tyres,'clear');assert(Checks.state(C.inputOf(legacy)).staleIds.includes('pickup'));
 const oldInput=C.inputOf(x);for(const key of Object.keys(R.fields))delete oldInput[key];
 const migrated={...x,adviceSystem:'unknown',adviceCheckLog:JSON.stringify({version:1,scope:Checks.scope(oldInput),items:[{id:'tyres',status:'clear'},{id:'pickup',status:'clear'}]})};
 assert(!Checks.state(C.inputOf(migrated)).stale,'New blank route fields do not invalidate an old inspection');
 assert.deepEqual(Checks.state(C.inputOf({...migrated,rearDiameter:'20'})).staleIds,['tyres']);
});

test('inspection and change outcomes are distinct; uncertain and no-change results do not rule out causes',()=>{
 const x=setup({adviceSymptom:'slow',adviceWeakWhere:'tight',adviceTestChange:'Inspect guide freedom',adviceTestKind:'inspection'});
 for(const outcome of ['clear','fault','uncertain','unable','different'])assert.doesNotThrow(()=>D.record({...x,adviceOutcome:outcome}));
 for(const outcome of ['better','same','worse'])assert.throws(()=>D.record({...x,adviceOutcome:outcome}),/inspection/);
 for(const outcome of ['clear','fault'])assert.throws(()=>D.record({...x,adviceTestKind:'change',adviceOutcome:outcome}),/change/);
 const suggestion=rule(x,'route-tight-drag');
 for(const outcome of ['uncertain','unable','different','fault']){const y={...x,adviceTestId:suggestion.id,adviceTestAction:suggestion.action,adviceTestChange:suggestion.action,adviceOutcome:outcome};y.adviceResultContext=D.record(C.inputOf(y));const d=analyze(y);assert.equal(d.resultState,'recorded');assert(d.suggestions.some(s=>s.id==='test-followup'));if(outcome==='uncertain')assert(d.suggestions.some(s=>s.id===suggestion.id));}
 const y={...x,adviceTestKind:'change',adviceOutcome:'same'};y.adviceResultContext=D.record(C.inputOf(y));assert.match(rule(y,'test-followup').action,/does not rule out/);
});

test('a second investigation reuses measurements without carrying over the earlier outcome',()=>{
 const x=setup({adviceSymptom:'slow',adviceWeakWhere:'revs',adviceDriveSlip:'rim',adviceSystem:'digital',totalWeight:'80',adviceHeight:'14',adviceBodyMass:'22',adviceUseSetup:'yes',adviceProposal:'lower',adviceOutcome:'different',adviceSecondary:'tip',adviceTestChange:'Inspect tyre seating'});
 const y=D.newInvestigation(x,'tip');assert.equal(y.adviceSymptom,'tip');assert.equal(y.adviceWeakWhere,'unknown');assert.equal(y.adviceOutcome,'unknown');assert.equal(y.adviceTestChange,'');assert.equal(y.adviceProposal,'none');
 for(const k of ['totalWeight','adviceHeight','adviceBodyMass','adviceUseSetup','adviceSystem'])assert.equal(y[k],x[k]);
 assert.equal(x.adviceOutcome,'different');assert.equal(x.adviceSymptom,'slow');assert.doesNotThrow(()=>C.cleanSetup(y));assert.throws(()=>D.newInvestigation(x,'invalid'),/Choose/);
});

test('start over clears the investigation, retaining measurements for optional reuse',()=>{
 const x=setup({name:'My car',adviceSymptom:'tip',adviceTipFirst:'lift',adviceUseSetup:'yes',adviceSystem:'digital',adviceBody:'high',adviceChecks:'issue',adviceNotes:'First run',adviceOutcome:'fault',adviceTestChange:'Check rubbing',adviceHeight:'14',totalWeight:'80',magneticReadings:'5',adviceBodyMass:'22',adviceMethod:'Tilt fixture',adviceRouteSkipped:'["adviceMovement"]',adviceUnavailable:'["check-body"]'});
 x.adviceCheckLog=Checks.mark(C.inputOf(x),'body','issue');const before=JSON.stringify(x),y=D.resetInvestigation(x),defaults=C.blank();
 for(const k of ['adviceSymptom','adviceTipFirst','adviceUseSetup','adviceSystem','adviceBody','adviceChecks','adviceNotes','adviceOutcome','adviceTestChange','adviceCheckLog','adviceRouteSkipped','adviceUnavailable'])assert.equal(y[k],defaults[k],k);
 for(const k of ['name','adviceHeight','totalWeight','magneticReadings','adviceBodyMass','adviceMethod'])assert.equal(y[k],x[k],k);
 assert.equal(JSON.stringify(x),before);assert.doesNotThrow(()=>C.cleanSetup(y));assert.equal(analyze(y).next[0].field,'adviceUnknownWhat');assert.equal(C.decode(C.encode(y)).setup.adviceSymptom,'unknown');
});
