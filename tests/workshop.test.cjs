const test=require('node:test'),assert=require('node:assert/strict');
const W=require('../renderer/workshop-model.js'),C=require('../renderer/calculator-model.js'),L=require('../renderer/library-model.js'),fixture=require('./workshop-fixtures.cjs');
const setup=()=>({...C.EXAMPLE,...fixture,totalWeight:'80',gearDiameter:'18',targetRollout:String(Math.PI*20/3),magneticReadings:'19,20,21'});
const calc=(tool,overrides={})=>W.calculate(C.inputOf({...setup(),...overrides}),tool);
const metric=(r,label)=>r.metrics.find(m=>m.label===label).value;
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
test('all eleven tools accept an empty legacy setup without inventing measurements',()=>{
  for(const k of Object.keys(W.tools)){const r=W.calculate(C.inputOf(C.blank()),k);assert.equal(r.error,'',k);assert.ok(r.metrics.every(m=>m.value===null),k);assert.equal(r.rows.length,0,k);}
  assert.equal(Object.keys(W.tools).length,11);
});
test('tyre preparation solves target diameter, observed wear life and mismatch',()=>{
  const r=calc('tyres');assert.equal(r.error,'');near(metric(r,'Gear-limited minimum diameter'),19);near(metric(r,'Diameter for target rollout'),20);near(metric(r,'Observed wear'),.04);near(metric(r,'Estimated remaining laps'),1000);near(metric(r,'Circumference mismatch per axle revolution'),Math.PI*.2);near(metric(r,'Measured diameter spread (not TIR)'),.02);
  assert.equal(metric(calc('tyres',{tyreHistory:'0,20\n500,20'}),'Estimated remaining laps'),null);
  assert.equal(metric(calc('tyres',{tyreMinimum:'20.2'}),'Estimated remaining laps'),0);
  assert.match(calc('tyres',{tyreHistory:'0,20\n500,21'}).error,/non-increasing/);
  assert.match(calc('tyres',{tyreHistory:'500,20\n500,19'}).error,/increasing/);
});
test('electrical calculations require measured steady DC and reject inconsistent voltages',()=>{
  const row=calc('electrical').rows[0];near(row[4],.6);near(row[5],5);near(row[6],.3);near(row[7],1.2);
  assert.equal(calc('electrical',{electricalMode:'pulsed'}).rows.length,0);
  assert.match(calc('electrical',{electricalRows:'Rail | 12 | 13 | 2'}).error,/exceeds/);
  assert.match(calc('electrical',{electricalRows:'Rail | 12 | 11 | 0'}).error,/between/);
});
test('motor tests keep no-load, stall and simultaneous loaded power distinct',()=>{
  const r=calc('motor');assert.equal(r.error,'');assert.equal(r.rows[0][7],null);near(r.rows[1][5],100);near(r.rows[1][7],10.269499865892516);near(r.rows[1][8],85.57916554910431);assert.equal(r.rows[2][7],0);
  const bad=calc('motor',{motorBenchRows:'Test | loaded | CW | 1 | 10000 | 1 | 10 | 10'});assert.equal(bad.rows[0][8],null);assert.match(bad.notes.join(' '),/exceeds/);
  assert.match(calc('motor',{motorBenchRows:'Test | stall | CW | 12 | 1 | 1 | 10 | 10'}).error,/zero RPM/);
  assert.match(calc('motor',{motorBenchRows:'Test | loaded | CW | 12 | 10000 | 1 | - | -'}).error,/need/);
});
test('race scenarios handle unknown versus zero losses and break-even arithmetic',()=>{
  const r=calc('strategy');near(metric(r,'Scenario race duration'),261);near(metric(r,'Extra-stop break-even distance'),60);near(metric(r,'Alternative net saving over entered laps'),-1);
  assert.equal(metric(calc('strategy',{strategyIncidents:''}),'Scenario race duration'),null);
  near(metric(calc('strategy',{strategyIncidents:'0',strategyRecovery:'',strategyStops:'0',strategyPitLoss:''}),'Scenario race duration'),250);
  assert.match(calc('strategy',{strategyGain:'5'}).error,/smaller/);
});
test('multi-part balance uses selected support geometry and solves achievable targets',()=>{
  const r=calc('balance');near(metric(r,'Planned mass'),100);near(metric(r,'Guide support load'),37);near(metric(r,'Rear support load'),63);near(metric(r,'Additional ballast for target'),2/.35);
  assert.match(calc('balance',{balanceChanges:'Remove | -100 | 40'}).error,/mass/);
  const impossible=calc('balance',{balanceTargetX:'52'});assert.equal(metric(impossible,'Additional ballast for target'),null);assert.match(impossible.notes.join(' '),/cannot be reached/);
  const removed=calc('balance',{balanceChanges:'Remove | -10 | 40'});near(metric(removed,'Planned mass'),70);
});
test('controlled tests compare run means rather than pooling unequal lap counts',()=>{
  const r=calc('experiment');near(metric(r,'B − A run-mean change'),-.2);near(metric(r,'Return-to-A drift'),0);assert.match(r.notes[0],/ordering present/);
  assert.equal(metric(calc('experiment',{experimentConfirmed:'no'}),'B − A run-mean change'),null);
  const unequal=calc('experiment',{experimentRows:'A1 | A | 4\nB1 | B | 4\nA2 | A | 6,6,6'});near(metric(unequal,'A · average of run means'),5);
  assert.equal(unequal.rows[0][5],null);
  const incidents=calc('experiment',{experimentRows:'A1 | A | 4,9 | 1 | 5\nB1 | B | 4,4 | 0 | 0'});assert.deepEqual(incidents.rows[0].slice(6),[1,5]);near(incidents.rows[0][3],6.5);
  assert.match(calc('experiment',{experimentRows:'A1 | A | 4 | 1.5 | 5'}).error,/whole/);
});
test('class limits distinguish missing limits, boundaries and failures',()=>{
  const r=calc('rules');near(r.rows[0][4],.15);assert.equal(r.rows[0][7],'Within');assert.equal(r.rows[1][7],'Outside');
  assert.equal(calc('rules',{rulesRows:'Mass | 80 | 80 | 80 | g'}).rows[0][7],'Within');
  assert.match(calc('rules',{rulesRows:'Mass | 80 | - | - | g'}).error,/at least one/);
});
test('compound ratios and standard spur geometry preserve single-stage setup',()=>{
  const r=calc('gears');near(metric(r,'Compound ratio'),6);near(metric(r,'Compound rollout'),Math.PI*20/6);near(metric(r,'Standard centre distance'),10);near(metric(r,'Driving pitch diameter'),5);
  near(metric(calc('gears',{gearPitchMode:'dp',gearPitch:'50.8'}),'Module'),.5);
  assert.match(calc('gears',{gearStages:'9.5,27'}).error,/whole/);
});
test('rotational inertia adds equivalent mass without counting physical mass twice',()=>{
  const r=calc('inertia');near(metric(r,'Listed equivalent inertia mass'),4);near(metric(r,'Ideal effective accelerating mass'),84);near(metric(r,'Ideal acceleration including listed inertia'),1/.084);
  near(metric(calc('inertia',{inertiaRows:'Cylinder | 4 | 10 | 0 | 1'}),'Listed equivalent inertia mass'),2);
  near(metric(calc('inertia',{inertiaRows:'Rotor | 4 | 10 | 10 | 3'}),'Listed equivalent inertia mass'),36);
  assert.match(calc('inertia',{totalWeight:'3'}).error,/exceed/);
});
test('braking integrates measured samples only and identifies incomplete stops',()=>{
  const r=calc('braking');near(metric(r,'Estimated stopping distance in recorded window'),1.5);near(metric(r,'Mean deceleration'),5/.6);
  const partial=calc('braking',{brakeRows:'10,18\n10.2,12'});near(metric(partial,'Recorded duration'),.2);assert.match(partial.notes[0],/does not measure a complete stop/);
  assert.match(calc('braking',{brakeRows:'0,18\n0,12'}).error,/increase/);
  assert.match(calc('braking',{brakeRows:'0,12\n1,18'}).notes.join(' '),/Speed rises/);
  assert.match(calc('braking',{brakeRows:'0,18\n1e-320,0'}).error,/finite results/);
  assert.deepEqual(r.rows[0].slice(2,4),[18,12]);
});
test('measurement bounds propagate endpoint intervals without silent clipping',()=>{
  const r=calc('ranges');const clearance=r.rows.find(r=>r[0]==='Nominal gear clearance');near(clearance[1],.975);near(clearance[2],1.025);const force=r.rows.find(r=>r[0]==='Magnetic force');near(force[1],19*.00980665);near(force[2],21*.00980665);
  assert.match(calc('ranges',{rangeDiameter:'20'}).error,/impossible/);
  assert.equal(calc('ranges',{rangeDiameter:''}).rows.some(r=>r[0]==='No-load speed'),false);
});
test('all optional measurements survive setup/library backups; old setups get blank tools',()=>{
  const s=setup(),decoded=C.decode(C.encode(s,null)).setup;for(const k of Object.keys(fixture))assert.equal(decoded[k],fixture[k],k);
  const legacy={...C.EXAMPLE};for(const k of Object.keys(W.fields))delete legacy[k];const upgraded=C.cleanSetup(legacy);assert.equal(upgraded.tyreHistory,'');assert.equal(upgraded.electricalMode,'unknown');
  const entries=L.save([],{setup:s,newId:'test',now:'2026-11-09T12:00:00Z'});assert.deepEqual(L.decode(L.encode(entries)),entries);
  assert.throws(()=>C.cleanSetup({...s,brakeRows:'1,0\n0,10'}),/increase/);
});
test('malformed, oversized, nonfinite and prototype inputs never enter saved data',()=>{
  for(const v of ['Infinity','NaN','1e999','0x10'])assert.throws(()=>W.clean({tyreLeft:v}));
  assert.throws(()=>W.clean({tyreHistory:'0,20\n'.repeat(51)}),/50 rows/);
  assert.throws(()=>W.clean({electricalRows:42}),/text/);
  assert.throws(()=>W.clean({strategyLaps:'1.5'}),/whole/);
  assert.throws(()=>W.clean({tyreSet:'x'.repeat(501)}),/500/);
  assert.equal(Object.hasOwn(W.clean(JSON.parse('{"__proto__":{"polluted":true}}')),'__proto__'),false);
});
