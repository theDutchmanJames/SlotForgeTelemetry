const {test}=require('node:test'),assert=require('node:assert/strict');
const M=require('../renderer/ballast-map-model.js'),H=require('../renderer/chassis-model.js'),C=require('../renderer/calculator-model.js');
const fixture={...C.blank(),...require('./chassis-fixtures.cjs')};
test('drawing coordinates preserve car handedness and physical units',()=>{
 const g=M.geometry(fixture);assert.equal(g.ready,true);
 assert.deepEqual(M.position(g,333.5,260.5),{x:50,y:-15});
 assert.deepEqual(M.position(g,333.5,113.5),{x:50,y:15});
 for(const x of [-10,0,25,100,110])for(const y of [-35,-15,0,15,35]){
  const p=M.pixel(g,x,y);assert.deepEqual(M.position(g,p.x,p.y),{x,y});
 }
});
test('front axle and measured guide supports use their own longitudinal zero',()=>{
 const axle=M.geometry({...fixture,chassisMode:'axle',wheelbase:'80'});
 assert.deepEqual(M.position(axle,333.5,113.5),{x:30,y:0});
 const measured=M.geometry({...fixture,chassisSupportReference:'measured',chassisSupportSpan:'95'});
 assert.deepEqual(M.position(measured,333.5,113.5),{x:45,y:15});
 assert.equal(M.geometry({...fixture,chassisMode:'axle',wheelbase:''}).ready,false);
 assert.equal(M.geometry({...fixture,chassisMode:'mixed'}).ready,false);
});
test('geometry-only planning requires dimensions but never invents weighing readings',()=>{
 const input={...C.blank(),chassisGuideSpan:'100',chassisTrackMethod:'outside',chassisOutside:'68',chassisLeftWidth:'8',chassisRightWidth:'8'};
 const g=M.geometry(input);assert.equal(g.track,60);assert.equal(g.span,100);
 assert.equal(H.calculate(input).baseline,null);assert.equal(M.geometry(C.blank()).ready,false);
});
test('drawing calibration survives export and rejects broken/nonfinite reference triangles',()=>{
 const input={...fixture,chassisMap:JSON.stringify({guide:90,rear:600,centre:180,right:30,left:340})};
 const restored=C.decode(C.encode(input,null)).setup;
 assert.equal(restored.chassisMap,input.chassisMap);assert.equal(restored.chassisChanges,input.chassisChanges);
 const legacy={...fixture};delete legacy.chassisMap;assert.equal(C.cleanSetup(legacy).chassisMap,'');
 for(const changes of [{guide:600},{right:185},{left:190},{centre:null},{rear:800}]){
  assert.throws(()=>H.mapReferences(JSON.stringify({...H.mapReferences(),...changes})));
 }
 const g=M.geometry(restored),point=M.pixel(g,50,-15);assert.deepEqual(M.position(g,point.x,point.y),{x:50,y:-15});
});
test('drawing placements save without measurements and resolve only when dimensions are supplied',()=>{
 const input={...C.blank(),chassisChanges:JSON.stringify([{name:'Ballast 1',action:'add',mass:'3',space:'drawing',x:'0.5',y:'-0.5'}])};
 const decoded=C.decode(C.encode(input,null)).setup;
 assert.equal(H.calculate(decoded).planned,null);
 const drawing=M.drawing(input),p=M.pixel(drawing,.5,-.5);assert.deepEqual(M.drawingPosition(drawing,p.x,p.y),{x:.5,y:-.5});
 const result=H.calculate({...fixture,...decoded,chassisGuideSpan:'100',chassisTrack:'60',chassisMode:'tripod',chassisConfirmed:'yes',chassisFront:'20',chassisLeft:'30',chassisRight:'30'});
 assert.equal(result.error,'');assert.deepEqual(result.planned.loads,[21.5,31.5,30]);
 const pending=H.calculate({...fixture,chassisGuideSpan:'',chassisSupportReference:'measured',chassisSupportSpan:'100',chassisChanges:input.chassisChanges});
 assert.equal(pending.planned,null);assert.equal(pending.error,'');
 const axle=H.calculate({...fixture,chassisMode:'axle',wheelbase:'80',chassisFront:'32',chassisRear:'48',chassisChanges:input.chassisChanges});
 assert.equal(axle.error,'');assert.deepEqual(axle.planned.loads,[33.875,49.125]);
 assert.throws(()=>H.changes(JSON.stringify([{name:'Bad',action:'add',mass:'3',space:'drawing',x:'100',y:'0'}])));
 assert.throws(()=>H.changes(JSON.stringify([{name:'Bad',action:'add',mass:'3',space:'unknown',x:'1',y:'0'}])));
});
