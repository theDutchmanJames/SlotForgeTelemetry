const test=require('node:test'),assert=require('node:assert/strict');
const T=require('../renderer/telemetry-model.js'),C=require('../renderer/calculator-model.js'),P=require('../renderer/performance-model.js');
const example=()=>({...C.EXAMPLE,totalWeight:'80',ballast:'20',frontWeight:'32',rearWeight:'48',efficiency:'80',motorPercent:'50'});
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
test('mass units, speed-dependent acceleration, efficiency and ballast',()=>{
  const s=example(),m=T.calculate(s);
  close(m.powerToWeight,P.calculate(s).peakPowerW/0.08);
  close(m.acceleration,8.38468575*0.5*0.8/0.08);
  close(m.loadedAcceleration/m.acceleration,0.8);
  close(m.loadedPowerToWeight/m.powerToWeight,0.8);
  close(T.calculate({...s,motorPercent:'100'}).acceleration,0);
  close(T.calculate({...s,efficiency:'0'}).acceleration,0);
  assert.equal(T.calculate({...s,motorType:'Brushless'}).acceleration,null);
  assert.equal(T.calculate({...s,torqueVoltage:'14'}).acceleration,null);
});
test('weight distribution, scale fallback, mismatch and missing data',()=>{
  const s=example(),m=T.calculate(s);close(m.frontPercent,40);close(m.rearPercent,60);
  assert.equal(T.calculate({...s,totalWeight:''}).massG,80);
  assert.equal(T.calculate({...s,totalWeight:'90'}).massMismatch,true);
  assert.equal(T.calculate({...s,frontWeight:'0',rearWeight:'80'}).frontPercent,0);
  assert.equal(T.calculate(C.blank()).acceleration,null);
  assert.equal(T.calculate({...s,totalWeight:'',frontWeight:'0',rearWeight:'0'}).massG,null);
});
test('tyre wear changes speed, force, rollout and rear height',()=>{
  const m=T.calculate({...example(),wornDiameter:'19'});
  close(m.worn.speedKmh/m.motor.speedKmh,19/20);close(m.worn.forceN/m.motor.forceN,20/19);close(m.rideHeightChange,-0.5);
  assert.equal(T.calculate({...example(),wornDiameter:'21'}).worn,null);
});
test('gear search finds exact rollout and bounds results',()=>{
  const m=T.gears({...example(),targetRollout:String(Math.PI*20/3)});
  assert.equal(m.count,65);assert.equal(m.rows.length,20);close(m.rows[0].error,0);
  for(let i=1;i<m.rows.length;i++)assert.ok(Math.abs(m.rows[i].error)>=Math.abs(m.rows[i-1].error));
  assert.equal(T.gears({...example(),pinionMin:'12',pinionMax:'8'}).count,0);
  assert.equal(T.gears({...example(),pinionMin:'1.5'}).count,0);
  assert.equal(T.gears({...example(),pinionMax:'1000'}).count,0);
});
test('measured speed and scale conversion remain independent of motor specs',()=>{
  const m=T.calculate({...C.blank(),trackLength:'20',lapTime:'5',scaleFactor:'32'});close(m.lapSpeed,14.4);close(m.scaleSpeed,460.8);
  assert.equal(T.calculate({...C.blank(),trackLength:'20',lapTime:'0'}).lapSpeed,null);
});
test('new inputs round trip and old files receive safe defaults',()=>{
  const s={...example(),wheelbase:'80',ballastPosition:'60',gearDiameter:'18'};assert.deepEqual(C.decode(C.encode(s,null)).setup,s);
  const old={...s};for(const k of Object.keys(T.fields))delete old[k];
  const restored=C.decode(JSON.stringify({format:'slotforge-calculator',version:1,setup:old})).setup;
  assert.equal(restored.totalWeight,'');assert.equal(restored.efficiency,'100');
  for(const key of ['wheelbase','ballastPosition','gearDiameter'])assert.equal(restored[key],'');
  for(const bad of [{totalWeight:'0'},{ballast:'-1'},{efficiency:'101'},{pinionMin:'2.5'},{gearMin:'40',gearMax:'30'},{lapTime:'NaN'},{wheelbase:'0'},{ballastPosition:'-1'},{ballastPosition:'81'},{gearDiameter:'0'}])assert.throws(()=>C.encode({...s,...bad},null));
});

test('ballast placement conserves total load and moments, including axle endpoints',()=>{
  const s={...example(),wheelbase:'80',ballastPosition:'60'},m=T.calculate(s);
  close(m.cg,48);close(m.ballastFront,37);close(m.ballastRear,63);close(m.ballastCg,50.4);
  close(m.ballastFrontPercent,37);close(m.ballastRearPercent,63);
  for(const x of [0,20,40,60,80]){
    const p=T.calculate({...s,ballastPosition:String(x)});
    close(p.ballastFront+p.ballastRear,100);
    close(p.ballastRear*80,48*80+20*x);
  }
  const zero=T.calculate({...s,ballast:'0',ballastPosition:''});close(zero.ballastCg,48);close(zero.ballastFront,32);
  const differentMass=T.calculate({...s,totalWeight:'90'});close(differentMass.ballastCg,50.4);assert.equal(differentMass.massMismatch,true);
  for(const missing of [{wheelbase:''},{frontWeight:''},{rearWeight:''},{ballastPosition:''},{ballastPosition:'81'},{frontWeight:'0',rearWeight:'0'}])assert.equal(T.calculate({...s,...missing}).ballastCg,null);
  assert.equal(T.calculate({...s,ballastPosition:'81'}).positionInvalid,true);
});

test('gear clearance separates physical gap from protrusion and requires actual diameters',()=>{
  const s={...example(),gearDiameter:'18',wornDiameter:'19'},m=T.calculate(s);
  close(m.clearance,1);close(m.wornClearance,0.5);
  close(T.calculate({...s,rearDiameter:'18',wornDiameter:''}).clearance,0);
  const clash=T.calculate({...s,rearDiameter:'17',wornDiameter:''});assert.equal(clash.clearance,null);close(clash.gearFit.interference,0.5);
  assert.equal(T.calculate({...s,gearDiameter:''}).clearance,null);
  assert.equal(T.calculate({...s,rearDiameter:''}).clearance,null);
  assert.equal(T.calculate({...s,wornDiameter:'21'}).wornClearance,null);
  const rim=C.inputOf({...s,tyreMode:'rim',rimDiameter:'16',tyreThickness:'2'});close(T.calculate(rim).clearance,1);
});

test('wheel outputs share one operating point and efficiency, independent of ballast position',()=>{
  for(const percent of ['0','50','100'])for(const efficiency of ['0','80','100']){
    const s={...example(),motorPercent:percent,efficiency},m=T.calculate(s),p=P.point(s,+percent);
    close(m.wheelForce,p.forceN*efficiency/100);close(m.wheelPower,p.powerW*efficiency/100);
    close(m.wheelForce*p.speedKmh/3.6,m.wheelPower);close(m.acceleration,m.wheelForce/0.08);
  }
  assert.equal(T.calculate({...example(),torqueType:'Unknown'}).wheelPower,null);
});
