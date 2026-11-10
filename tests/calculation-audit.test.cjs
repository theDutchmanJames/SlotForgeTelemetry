const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../renderer/calculator-model'),P=require('../renderer/performance-model'),T=require('../renderer/telemetry-model'),W=require('../renderer/workshop-model'),H=require('../renderer/chassis-model'),F=require('../renderer/fit-model'),A=require('../renderer/prediction-model');
const close=(a,b)=>assert.ok(Number.isFinite(a)&&Math.abs(a-b)<1e-8,`${a} != ${b}`);
const metric=(r,label)=>r.metrics.find(m=>m.label===label)?.value;

test('screenshot regression: actual clearance survives an unusable legacy target without manufactured tyre sizes',()=>{
 const s={...C.blank(),rearDiameter:'19',gearDiameter:'18',tyreMinimum:'19',tyreRequiredGap:'17',tyreLeft:'19',tyreRight:'19',tyreSamples:'19.02,19.05',adviceUseSetup:'yes'};
 for(const input of [s,C.decode(C.encode(s,null)).setup]){
  const r=W.calculate(input,'tyres');close(metric(r,'Current gap below driven gear'),.5);close(T.calculate(input).clearance,.5);
  assert.equal(metric(r,'Minimum tyre diameter for required gear gap'),null);assert.equal(metric(r,'Usable tyre diameter before minimum'),null);assert.equal(metric(r,'Estimated remaining laps'),null);
  assert.doesNotMatch(JSON.stringify(r),/52|\-33/);assert.doesNotMatch(JSON.stringify(A.analyze(input).suggestions),/52|\-33/);
 }
 assert.equal(s.tyreRequiredGap,'17'); // Never silently rewrite a saved measurement.
});
test('tyre targets, input diameter and rim-derived diameter cannot escape the supported 1:32 envelope',()=>{
 for(const raw of ['0.001','52','520']){
  const s={...C.EXAMPLE,rearDiameter:raw};const m=P.calculate(s);assert.equal(m.rearDiameter,null);assert.equal(m.rollout,null);assert.equal(m.forceN,null);
 }
 const rim=C.inputOf({...C.EXAMPLE,tyreMode:'rim',rimDiameter:'18',tyreThickness:'17'});assert.equal(P.calculate(rim).speedKmh,null);
 const r=W.calculate({...C.EXAMPLE,targetRollout:'1000'},'tyres');assert.equal(metric(r,'Diameter for target rollout'),null);
 for(const d of [15.1,16.7,19,20.4,21.4,24])assert.equal(F.diameter(d),d);
});
test('physical gap and protrusion remain separate over realistic tyre/gear combinations',()=>{
 for(const tyre of [16,17,18,19,20,21,22])for(const gear of [16,17,18,19]){
  const fit=F.clearance(tyre,gear),s={...C.blank(),rearDiameter:String(tyre),gearDiameter:String(gear)};
  if(tyre>=gear){close(fit.gap,(tyre-gear)/2);close(T.calculate(s).clearance,fit.gap);}
  else{assert.equal(fit.gap,null);close(fit.interference,(gear-tyre)/2);assert.equal(T.calculate(s).clearance,null);}
  assert.ok(fit.gap===null||fit.gap>=0);
 }
});
test('wear projection uses fitted tyre and preserves unknown/zero wear without negative life',()=>{
 const s={...C.EXAMPLE,rearDiameter:'19.5',tyreMinimum:'19',tyreHistory:'0,20\n1000,19.8',tyreRequiredGap:''};
 close(metric(W.calculate(s,'tyres'),'Estimated remaining laps'),2500);
 close(metric(W.calculate({...s,rearDiameter:'18.8'},'tyres'),'Estimated remaining laps'),0);
 close(metric(W.calculate({...s,rearDiameter:'18.8'},'tyres'),'Tyre diameter below minimum'),.2);
 assert.equal(metric(W.calculate({...s,tyreHistory:'0,20\n1000,20'},'tyres'),'Estimated remaining laps'),null);
 assert.equal(metric(W.calculate({...s,tyreMinimum:''},'tyres'),'Estimated remaining laps'),null);
});
test('power, wheel force and speed conserve energy across realistic gearing and tyre sweeps',()=>{
 for(const pinion of [8,10,13])for(const gear of [24,28,32])for(const diameter of [17,19,21])for(const rpmPercent of [0,25,50,75,100]){
  const s={...C.EXAMPLE,pinion:String(pinion),gear:String(gear),rearDiameter:String(diameter),motorPercent:String(rpmPercent),totalWeight:'80',efficiency:'80'},m=T.calculate(s);
  close(m.wheelForce*m.point.speedKmh/3.6,m.wheelPower);close(m.acceleration*.08,m.wheelForce);
  close(m.motor.speedKmh,m.motor.ratedRpm*Math.PI*diameter*pinion/gear*60/1e6);
 }
});
test('near-singular ballast targets and over-budget additions are not presented as suggestions',()=>{
 const s={...C.blank(),chassisMode:'tripod',chassisConfirmed:'yes',chassisGuideSpan:'100',chassisTrack:'60',chassisFront:'20',chassisLeft:'30',chassisRight:'30',chassisTarget:'80',chassisTargetX:'80.001',chassisTargetY:'0'};
 assert.equal(H.calculate(s).target,null);
 assert.equal(H.calculate({...s,chassisTargetX:'100',chassisMaxMass:'85'}).target,null);
 const valid=H.calculate({...s,chassisTargetX:'100',chassisMaxMass:'110'}).target;close(valid.addedMass,20);close(valid.rearShare,80);
 const hugeMove={...s,chassisChanges:JSON.stringify([{action:'move',name:'Impossible part',mass:'81',x:'50',y:'0',toX:'50',toY:'0'}])};assert.match(H.calculate(hugeMove).error,/exceeds the car mass/);
 const w=W.calculate({...C.blank(),balanceFront:'20',balanceRear:'60',balanceSpan:'100',balanceTarget:'80',balanceTargetX:'80.001'},'balance');assert.equal(metric(w,'Additional ballast for target'),null);
});
test('range outputs express possible gear contact without negative clearance and outsize gear geometry is withheld',()=>{
 const r=W.calculate({...C.EXAMPLE,rearDiameter:'18',gearDiameter:'18',rangeDiameter:'0.2'},'ranges');
 close(r.rows.find(r=>r[0]==='Possible gear gap')[2],.1);close(r.rows.find(r=>r[0]==='Possible gear protrusion')[2],.1);
 const g=W.calculate({...C.blank(),gearPitch:'50',gearDriver:'10',gearDriven:'30'},'gears');assert.equal(metric(g,'Driving pitch diameter'),null);assert.equal(metric(g,'Standard centre distance'),null);
});
