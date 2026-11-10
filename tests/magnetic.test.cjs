const test=require('node:test'),assert=require('node:assert/strict');
const M=require('../renderer/magnetic-model.js'),C=require('../renderer/calculator-model.js'),T=require('../renderer/telemetry-model.js'),L=require('../renderer/library-model.js'),Compare=require('../renderer/compare-model.js');
const setup=(extra={})=>({...C.EXAMPLE,totalWeight:'80',magneticReadings:'19, 20\n21',magneticClearance:'1.1',magneticCurve:'1.2, 20\n0.8, 30\n1.0, 24',...extra});
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
test('measured pull has correct force, mass ratio and total support, with repeatability and worst limit margin',()=>{
 const m=M.calculate(setup({magneticLimit:'20'}),80);
 near(m.mean,20);near(m.forceN,.196133);near(m.loadPercent,25);near(m.supportN,.980665);
 assert.equal(m.supportGf,100);assert.equal(m.count,3);assert.equal(m.min,19);assert.equal(m.max,21);assert.equal(m.range,2);assert.equal(m.margin,0);assert.equal(m.minMargin,-1);
});
test('unknown and measured zero stay distinct; mass is required only for load calculations',()=>{
 const blank=M.calculate(C.blank());assert.equal(blank.mean,null);assert.equal(blank.supportN,null);assert.equal(blank.count,0);
 const zero=M.calculate(setup({magneticReadings:'0'}),80);assert.equal(zero.mean,0);assert.equal(zero.loadPercent,0);near(zero.supportN,80*M.GF_TO_N);
 const noMass=M.calculate(setup());assert.equal(noMass.mean,20);assert.equal(noMass.loadPercent,null);assert.equal(noMass.supportN,null);
});
test('sorted curve interpolates only inside measured bounds and retains local slopes',()=>{
 const m=M.calculate(setup());near(m.estimate,22);near(m.segments[1].slope,-20);
 assert.equal(M.interpolate(m.points,.7),null);assert.equal(M.interpolate(m.points,1.3),null);assert.equal(M.interpolate(m.points,null),null);assert.equal(M.interpolate(m.points,1.2),20);
 const one=[{height:1,pull:20}];assert.equal(M.interpolate(one,1),20);assert.equal(M.interpolate(one,1.01),null);
 const rising=M.calculate(setup({magneticCurve:'1,20\n2,30'}));assert.equal(rising.increasing,true);assert.equal(rising.points[1].pull,30);
});
test('worn clearance is explicitly measured or approximated, with no force outside measured range',()=>{
 const exact=M.calculate(setup({magneticWornClearance:'.9'}),80,-.2);near(exact.wornEstimate,27);near(exact.estimateChange,5);assert.equal(exact.approximate,false);
 const assumed=M.calculate(setup({magneticWearMode:'axle',magneticWornClearance:'5'}),80,-.2);near(assumed.wornHeight,.9);near(assumed.wornEstimate,27);
 const impossible=M.calculate(setup({magneticWearMode:'axle'}),80,-2);assert.equal(impossible.wornHeight,null);assert.equal(impossible.wornContact,true);assert.equal(impossible.wornEstimate,null);
 assert.equal(M.calculate(setup({magneticWearMode:'axle'}),80,null).wornHeight,null);
 assert.equal(M.calculate(setup({magneticClearance:''}),80).estimate,null);
 const boundary=setup({magneticClearance:'1.2',magneticCurve:'0.8,30\n1,24',magneticWearMode:'axle',rearDiameter:'20',wornDiameter:'19.6'});
 const t=T.calculate(C.inputOf(boundary));assert.equal(M.calculate(boundary,80,t.rideHeightChange).wornEstimate,24);
 assert.equal(M.interpolate([{height:1,pull:20}],1.00000001),null);
});
test('malformed magnetic data fails saving and cannot produce partial apparently valid results',()=>{
 for(const extra of [{magneticReadings:'-1'},{magneticReadings:'NaN'},{magneticReadings:'0x10'},{magneticReadings:'Infinity'},{magneticReadings:'1 '.repeat(101)},
 {magneticCurve:'1,20\n1,25'},{magneticCurve:'1,20,30'},{magneticCurve:'1,-20'},{magneticCurve:'1'},{magneticCurve:'0,0\n1e-320,100000'},
 {magneticClearance:null},{magneticLimit:'-1'},{magneticTester:{}},{magneticExtra:'yes'},{magneticCondition:'maybe'},{magneticWearMode:'auto'}]){
  assert.throws(()=>C.cleanSetup(setup(extra)));assert.ok(M.calculate(setup(extra),80).error);
 }
 const emptyCurve=setup({magneticCurve:''});assert.equal(M.calculate(emptyCurve,80).estimate,null);
});
test('older setups migrate with blank optional fields; magnetic records round-trip through setup and library backups',()=>{
 const old={...C.EXAMPLE};for(const k of Object.keys(M.defaults()))delete old[k];
 assert.deepEqual(M.clean(C.cleanSetup(old)),M.defaults());
 const s=setup({magneticTester:'<img src=x onerror=alert(1)>',magneticRails:'Steel',magneticOrientation:'Inline',magneticExtra:'none',magneticCondition:'off'});
 assert.deepEqual(C.decode(C.encode(s,null)).setup,C.cleanSetup(s));
 const entry={id:'test',setup:s,notes:'Sample',createdAt:'2026-11-09T10:00:00Z',updatedAt:'2026-11-09T10:00:00Z'};
 assert.deepEqual(L.decode(L.encode([entry]))[0].setup,C.cleanSetup(s));
 const oldEnvelope=JSON.stringify({format:'slotforge-calculator',version:1,setup:old,reference:null});assert.equal(C.decode(oldEnvelope).setup.magneticReadings,'');
});
test('magnetic pull never changes drivetrain, acceleration, mass or ballast balance calculations',()=>{
 const a={...C.EXAMPLE,totalWeight:'80',ballast:'20',frontWeight:'32',rearWeight:'48',wheelbase:'80',ballastPosition:'60'};
 assert.deepEqual(T.calculate(C.inputOf(a)),T.calculate(C.inputOf({...a,...M.clean(setup())})));
});
test('magnetic comparisons stay neutral and distinguish unknown or different test conditions',()=>{
 const a=setup({magneticTester:'Tester A',magneticRails:'Rail A',magneticOrientation:'Inline',magneticExtra:'none',magneticCondition:'off'}),b={...a,magneticReadings:'30'};
 const row=(x,y)=>Compare.compare(x,y).find(r=>r.key==='magneticMean');
 assert.equal(row(a,b).sameBasis,true);assert.equal(row(a,b).delta,10);assert.equal(row(a,b).tone,'neutral');
 assert.equal(row(a,{...b,magneticRails:'Rail B'}).sameBasis,false);assert.equal(row(a,{...b,magneticExtra:'unknown'}).sameBasis,false);
 assert.equal(row(C.EXAMPLE,C.EXAMPLE).a,null);
});
