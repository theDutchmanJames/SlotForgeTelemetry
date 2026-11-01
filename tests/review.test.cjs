const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../renderer/calculator-model.js'),P=require('../renderer/performance-model.js'),T=require('../renderer/telemetry-model.js'),L=require('../renderer/library-model.js');
const close=(a,b)=>assert.ok(Math.abs(a-b)<=1e-9*Math.max(1,Math.abs(b)),`${a} != ${b}`);

test('small nonzero results remain distinguishable from zero in the UI',()=>{
  const fs=require('node:fs'),vm=require('node:vm');
  const format=vm.runInNewContext(fs.readFileSync(require.resolve('../renderer/performance-view.js'),'utf8')+';performanceNumber');
  assert.equal(format(0),'0');assert.equal(format(null),'—');assert.equal(format(Infinity),'—');
  assert.equal(format(27.0177),'27.02');assert.equal(format(0.000001),'1E-6');assert.equal(format(-0.000001),'-1E-6');
});

test('native number-input notation round trips and calculates consistently',()=>{
  const setup={...C.EXAMPLE,ratedRpm:'2.15e4',pinion:'9.0',gear:'2.7e1',rearDiameter:'20.',totalWeight:'8e1',ballast:'0e0'};
  const restored=C.decode(C.encode(setup,null)).setup;
  assert.deepEqual(restored,{...setup,ratedRpm:'21500',pinion:'9',gear:'27',rearDiameter:'20',totalWeight:'80',ballast:'0'});
  close(P.calculate(restored).speedKmh,P.calculate(C.EXAMPLE).speedKmh);
  close(T.calculate(restored).massG,80);
  for(const v of ['', ' ', '0x10','Infinity','NaN','1e','--1',[],null])assert.equal(P.positive(v),null);
});

test('import, calculation and UI tooth-count limits agree',()=>{
  for(const key of ['pinion','gear'])for(const value of ['1000000','9007199254740991','0','0.5','-1']){
    const setup={...C.EXAMPLE,[key]:value};
    assert.throws(()=>C.encode(setup,null));
    assert.equal(P.calculate(setup).ratio,null);
    assert.throws(()=>L.save([],{setup,newId:'bad',now:'2026-11-01T00:00:00Z'}));
  }
  assert.equal(P.calculate({...C.EXAMPLE,pinion:'999999',gear:'999999'}).ratio,1);
  for(const key of ['ratedRpm','ratedVoltage','motorTorque','torqueVoltage','rearDiameter','totalWeight','wheelbase','rimDiameter','tyreThickness']){
    assert.throws(()=>C.cleanSetup({...C.EXAMPLE,[key]:'1e-7'}),key);
    assert.doesNotThrow(()=>C.cleanSetup({...C.EXAMPLE,[key]:'0.000001'}),key);
  }
});

test('gear, tyre, mass and operating-point variations conserve power and static moments',()=>{
  for(const pinion of [6,9,13])for(const gear of [24,27,40])for(const diameter of [14,20,28])for(const percent of [0,25,50,75,100]){
    const input={...C.EXAMPLE,pinion:String(pinion),gear:String(gear),rearDiameter:String(diameter),totalWeight:'80',frontWeight:'30',rearWeight:'50',ballast:'17',wheelbase:'85',ballastPosition:'23',efficiency:'73',motorPercent:String(percent)};
    const m=T.calculate(input),p=P.point(input,percent);
    close(p.forceN*p.speedKmh/3.6,p.powerW);
    close(m.wheelForce*p.speedKmh/3.6,m.wheelPower);
    close(m.acceleration*0.08,m.wheelForce);
    close(m.loadedAcceleration*0.097,m.wheelForce);
    close(m.ballastFront+m.ballastRear,97);
    close(m.ballastRear*85,50*85+17*23);
    close(m.ballastFrontPercent+m.ballastRearPercent,100);
    close(m.motor.rollout*m.motor.ratedRpm*60/1e6,m.motor.speedKmh);
  }
});

test('large Unicode backups obey the byte limit without mutating saved entries',()=>{
  const item=L.save([],{setup:{...C.EXAMPLE,name:'Race'},newId:'one',now:'2026-11-01T00:00:00Z'})[0];
  const list=Array.from({length:500},(_,i)=>({...item,id:'setup-'+i,notes:'🛞'.repeat(1000)}));
  assert.throws(()=>L.encode(list),/2 MB/);
  assert.equal(list[0].notes.length,2000);
  assert.equal(item.notes,'');
});
