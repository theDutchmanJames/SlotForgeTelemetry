const test=require('node:test'),assert=require('node:assert/strict');
const H=require('../renderer/chassis-model.js'),X=require('../renderer/chassis-test-model.js'),C=require('../renderer/calculator-model.js'),L=require('../renderer/library-model.js'),Compare=require('../renderer/compare-model.js'),fixture=require('./chassis-fixtures.cjs');
const setup=(overrides={})=>({...C.EXAMPLE,...fixture,...overrides});
const calc=(overrides={})=>H.calculate(setup(overrides));
const near=(a,b)=>assert.ok(Number.isFinite(a)&&Math.abs(a-b)<1e-8,`${a} != ${b}`);
const plan=rows=>({chassisChanges:JSON.stringify(rows)});

test('legacy setups load with geometry and weighing unknown, not zero',()=>{
 const old={name:'Legacy',pinion:'9',gear:'27',tyreMode:'diameter',rearDiameter:'20'};
 const c=C.cleanSetup(old),r=H.calculate(c);assert.equal(c.chassisMode,'none');assert.equal(c.chassisRunSnapshots,'[]');assert.equal(r.error,'');assert.equal(r.geometry,null);assert.equal(r.baseline,null);
 assert.deepEqual(C.decode(C.encode(c)).setup,c);
});
test('geometry uses guide pivot and contact centres, with correct angle and signed axle offset',()=>{
 const r=calc({wheelbase:'80'});assert.equal(r.error,'');near(r.geometry.angle,33.39848846798724);near(r.geometry.ratio,5/3);near(r.geometry.side,Math.sqrt(10900));near(r.geometry.frontOffset,20);
 near(calc({wheelbase:'120'}).geometry.frontOffset,-20);
 const outside=calc({chassisTrackMethod:'outside',chassisOutside:'70',chassisLeftWidth:'8',chassisRightWidth:'12'});near(outside.track,60);
 assert.match(calc({chassisTrackMethod:'outside',chassisOutside:'10',chassisLeftWidth:'8',chassisRightWidth:'12'}).error,/Outside/);
 assert.equal(calc({chassisTrackMethod:'outside',chassisOutside:'70'}).geometry,null);
});
test('measurement modes gate calculations and distinguish the actual front support',()=>{
 assert.equal(calc({chassisConfirmed:'no'}).baseline,null);assert.equal(calc({chassisMode:'mixed'}).baseline,null);
 assert.equal(calc({chassisRight:''}).baseline,null);
 near(calc({chassisSupportReference:'measured',chassisSupportSpan:'80'}).baseline.x,60);
 const axle=calc({chassisMode:'axle',wheelbase:'80',chassisFront:'32',chassisRear:'48',chassisChanges:'[]'});near(axle.baseline.x,48);assert.equal(axle.baseline.y,null);
 const guide=calc({chassisMode:'guide',chassisFront:'20',chassisRear:'60',chassisChanges:'[]'});near(guide.baseline.x,75);
 assert.match(calc({chassisMode:'guide',chassisRear:'60'}).error,/y = 0/);
});
test('known three-point example gives independent measured and planned values',()=>{
 const r=calc();assert.equal(r.error,'');assert.deepEqual(r.baseline.loads,[20,30,30]);near(r.baseline.x,75);near(r.baseline.y,0);
 assert.deepEqual(r.planned.loads,[23,31,36]);near(r.planned.mass,90);near(r.planned.x,6700/90);near(r.planned.y,150/90);near(r.massMargin,10);
 near(r.planned.rearLeftShare,31/67*100);near(r.planned.rearRightShare,36/67*100);
 assert.equal(setup().totalWeight,''); // Planning does not supply or mutate measured main mass.
});
test('ballast conserves total mass and both first moments for many positions',()=>{
 for(let i=1;i<=60;i++){
  const m=1+i/10,x=(i*17)%100,y=(i*7)%30-15;
  const r=calc(plan([{action:'add',name:'Part',mass:String(m),x:String(x),y:String(y)}]));assert.equal(r.error,'');
  near(r.planned.mass,80+m);near(r.planned.mass*r.planned.x,6000+m*x);near(r.planned.mass*r.planned.y,m*y);
 }
});
test('mirroring ballast swaps rear loads; centred ballast keeps symmetry',()=>{
 const a=calc(),b=calc(plan([{action:'add',name:'Mirror',mass:'10',x:'70',y:'-15'}]));
 near(a.planned.loads[1],b.planned.loads[2]);near(a.planned.loads[2],b.planned.loads[1]);near(a.planned.y,-b.planned.y);
 const c=calc(plan([{action:'add',name:'Centre',mass:'10',x:'70',y:'0'}]));near(c.planned.loads[1],c.planned.loads[2]);
});
test('move preserves mass and updates moments; removal is an explicit subtraction',()=>{
 const r=calc(plan([{action:'move',name:'Existing part',mass:'5',x:'20',y:'-10',toX:'80',toY:'10'}]));near(r.planned.mass,80);near(r.planned.mass*r.planned.x,6300);near(r.planned.mass*r.planned.y,100);
 const remove=calc(plan([{action:'remove',name:'Part',mass:'10',x:'70',y:'15'}]));near(remove.planned.mass,70);near(remove.planned.mass*remove.planned.x,5300);near(remove.planned.mass*remove.planned.y,-150);
});
test('negative load changes are allowed, but negative final support loads are rejected',()=>{
 const valid=calc(plan([{action:'add',name:'Overhang',mass:'5',x:'120',y:'0'}]));assert.equal(valid.error,'');near(valid.planned.loads[0],19);
 assert.match(calc(plan([{action:'add',name:'Too far',mass:'100',x:'200',y:'0'}])).error,/negative final/);
 assert.match(calc(plan([{action:'remove',name:'Impossible',mass:'80',x:'75',y:'0'}])).error,/non-positive/);
 const zero=calc({chassisFront:'0',chassisChanges:'[]'});assert.equal(zero.error,'');assert.ok(zero.notes.some(s=>s.includes('zero load')));
});
test('missing spans preserve readings without inventing CG or planned results',()=>{
 const r=calc({chassisGuideSpan:''});near(r.baseline.mass,80);assert.equal(r.baseline.x,null);assert.equal(r.planned,null);
 const missingT=calc({chassisTrack:''});assert.equal(missingT.baseline.y,null);assert.equal(missingT.planned,null);
 assert.match(calc({chassisFront:'0',chassisLeft:'0',chassisRight:'0'}).error,/non-positive/);
});
test('target solver meets requested share and keeps suggested ballast separate',()=>{
 const r=calc({chassisChanges:'[]',chassisTarget:'70',chassisTargetX:'0',chassisTargetY:'0'});near(r.target.addedMass,40/7);near(r.target.rearShare,70);near(r.planned.mass,80);near(r.target.massMargin,100-r.target.mass);
 near(calc({chassisChanges:'[]',chassisTarget:'75',chassisTargetX:'75',chassisTargetY:'0'}).target.addedMass,0);
 assert.equal(calc({chassisChanges:'[]',chassisTarget:'70',chassisTargetX:'70',chassisTargetY:'0'}).target,null);
 assert.equal(calc({chassisChanges:'[]',chassisTarget:'80',chassisTargetX:'0',chassisTargetY:'0'}).target,null);
 const lateral=calc({chassisChanges:'[]',chassisTarget:'70',chassisTargetX:'0',chassisTargetY:'1000'});assert.equal(lateral.target,null);assert.ok(lateral.notes.some(s=>s.includes('unload')));
});
test('repeats, absolute bounds and independent mass checks have distinct meanings',()=>{
 const r=calc({chassisFront:'19,20,21',chassisCheckMass:'81'});near(r.baseline.mass,80);assert.equal(r.repeats[0].count,3);near(r.repeats[0].max-r.repeats[0].min,2);near(r.massDifference,-1);near(r.massTolerance,.4);
 near(r.bounds.mass[0],79.7);near(r.bounds.mass[1],80.3);
 const noBound=calc({chassisBound:''});assert.equal(noBound.bounds,null);assert.equal(noBound.massTolerance,null);
 const zeroBound=calc({chassisBound:'0',chassisCheckBound:'0'});near(zeroBound.bounds.x[0],75);near(zeroBound.bounds.x[1],75);
 assert.equal(calc({chassisBound:'40'}).bounds,null);
 for(const front of [19.9,20,20.1])for(const left of [29.9,30,30.1])for(const right of [29.9,30,30.1]){
  const c=calc({chassisFront:String(front),chassisLeft:String(left),chassisRight:String(right)}).baseline;
  for(const k of ['mass','frontShare','rearShare','x','y'])assert.ok(c[k]>=r.bounds[k][0]-1e-9&&c[k]<=r.bounds[k][1]+1e-9,k);
 }
});
test('malformed, excessive or nonfinite values fail closed',()=>{
 for(const bad of [{chassisGuideSpan:'0'},{chassisTrack:'-1'},{chassisFront:'NaN'},{chassisFront:'1e999'},{chassisFront:Array(21).fill('1').join(',')},{chassisMode:'unknown'},{chassisTrack:null},{chassisChanges:'{}'},{chassisChanges:JSON.stringify([{action:'add',name:'x',mass:'5',x:'1',y:null}])}]){
  assert.ok(calc(bad).error,JSON.stringify(bad));assert.throws(()=>C.cleanSetup(setup(bad)));
 }
});
test('new setup inputs survive file and library round trips',()=>{
 const s=setup({name:'Geometry'}),encoded=C.encode(s),out=C.decode(encoded).setup;assert.equal(out.chassisChanges,s.chassisChanges);assert.equal(out.chassisNotes,s.chassisNotes);
 const entry={id:'test',createdAt:'2026-11-10T12:00:00Z',updatedAt:'2026-11-10T12:00:00Z',notes:'Fixture',setup:s};const entries=L.decode(L.encode([entry]));assert.deepEqual(H.calculate(entries[0].setup),H.calculate(s));
});
test('geometry comparisons stay neutral and incompatible support references suppress deltas',()=>{
 const a=setup(),b=setup({chassisTrack:'65'}),rows=Compare.compare(a,b,'power');assert.equal(rows.find(r=>r.key==='chassisAngle').tone,'neutral');
 const c=Compare.compare(a,setup({chassisSupportReference:'measured',chassisSupportSpan:'80'})).find(r=>r.key==='chassisCgX');assert.equal(c.sameBasis,false);assert.equal(c.delta,null);
});
test('run evidence freezes source inputs and detaches after a row is edited or moved',()=>{
 const entry={id:'saved-a',setup:setup({name:'A'})},s=setup({experimentRows:'Run 1 | A | 5,5.1,5.2'});
 const raw=X.capture(s,{row:0,entry,now:'2026-11-10T12:00:00Z'});entry.setup.chassisTrack='99';
 const record=X.records(raw)[0];assert.equal(record.setup.chassisTrack,'60');assert.equal(X.attached(record,s.experimentRows),true);assert.equal(X.attached(record,'Changed | A | 5,5.1,5.2'),false);
 assert.equal(X.attached(record,'Before | A | 6\n'+s.experimentRows),false);
 const saved=C.decode(C.encode({...s,chassisRunSnapshots:raw})).setup;assert.equal(X.records(saved.chassisRunSnapshots)[0].setup.chassisTrack,'60');
 assert.throws(()=>X.records(raw.replace('"version":1','"version":2')));
 assert.throws(()=>X.capture(s,{row:8,entry,now:'2026-11-10T12:00:00Z'}));
});
test('snapshots cannot recursively capture themselves or bypass input validation',()=>{
 const entry={id:'a',setup:setup({name:'A'})},s=setup({experimentRows:'A | A | 5'});
 const raw=X.capture(s,{row:0,entry,now:'2026-11-10T12:00:00Z'});entry.setup.chassisRunSnapshots=raw;
 const next=X.capture(s,{row:0,entry,now:'2026-11-10T12:00:00Z'});assert.equal(next,raw);
 const tampered=JSON.parse(raw);tampered[0].setup.wheelbase='bad';assert.throws(()=>X.records(JSON.stringify(tampered)));
 assert.throws(()=>X.records(' '.repeat(40001)));
});
test('UTF-8 setup size is checked on import rather than character count',()=>{
 assert.throws(()=>C.decode('é'.repeat(60000)),/100 KB/);
});
test('conflicting snapshots for one row fail validation rather than both appearing attached',()=>{
 const s=setup({experimentRows:'A | A | 5'}),entry={id:'a',setup:setup({name:'A'})};
 const raw=X.capture(s,{row:0,entry,now:'2026-11-10T12:00:00Z'}),r=JSON.parse(raw)[0];
 assert.throws(()=>X.records(JSON.stringify([r,r])),/same run row/);
});
test('comparison shares use percentage points without relative-position percentages',()=>{
 const a=setup(),b=setup({chassisFront:'30'}),rows=Compare.compare(a,b);
 const share=rows.find(r=>r.key==='chassisFrontShare');assert.equal(share.deltaUnit,'percentage points');assert.equal(share.percent,null);near(share.delta,100/3-25);
 assert.equal(rows.find(r=>r.key==='chassisCgX').percent,null);
});
test('incomplete plans are described and exceeding entered mass limits is explicit',()=>{
 assert.ok(calc({chassisMode:'none'}).notes.some(s=>s.includes('Select a weighing method')));
 assert.ok(calc({chassisMaxMass:'85'}).notes.some(s=>s.includes('Planned mass exceeds')));
 assert.ok(calc({chassisChanges:'[]',chassisTarget:'70',chassisTargetX:'0',chassisTargetY:'0',chassisMaxMass:'81'}).notes.some(s=>s.includes('within this plan’s mass budget')));
});
