const test=require('node:test'),assert=require('node:assert/strict');
const L=require('../renderer/library-model.js'),B=require('../renderer/binder-model.js'),C=require('../renderer/calculator-model.js');
const at=d=>`2026-11-${String(d).padStart(2,'0')}T10:00:00.000Z`;
const entry=(id,name,carRef,day,extra={})=>({id,setup:{...C.EXAMPLE,name,carRef,...extra},notes:'',createdAt:at(day),updatedAt:at(day)});
test('a favourite star survives saves and old files without it still open',()=>{
 let list=L.clean([entry('a','Technical','local:gt',1)]);assert.equal('favourite' in list[0],false);
 list=L.star(list,'a',true);assert.equal(list[0].favourite,true);assert.equal(list[0].updatedAt,at(1),'starring is not an edit');
 list=L.save(list,{id:'a',setup:{...list[0].setup,pinion:'10'},notes:'',now:at(2)});assert.equal(list[0].favourite,true,'kept when the setup is saved again');
 assert.equal(L.decode(L.encode(list))[0].favourite,true);
 list=L.star(list,'a',false);assert.equal('favourite' in list[0],false);
 assert.throws(()=>L.clean([{...entry('b','X','',1),favourite:'yes'}]));assert.throws(()=>L.star(list,'nope',true));
});
test('sections by car: newest first, then cars without setups, then setups without a car',()=>{
 const cars=[{ref:'local:gt',name:'Club GT'},{ref:'local:lm',name:'Le Mans'},{ref:'local:rally',name:'Rally'},{ref:'local:old',name:'Old',archived:true}];
 const list=[entry('a','GT one','local:gt',1),entry('b','LM','local:lm',5),entry('c','GT two','local:gt',3),entry('d','Bench','',2),entry('e','Gone car','local:missing',4)];
 const g=B.groups(list,cars);
 assert.deepEqual(g.map(x=>[x.car?.name||null,x.entries.map(e=>e.id)]),[['Le Mans',['b']],['Club GT',['a','c']],['Rally',[]],[null,['d','e']]]);
});
test('driven: the best eligible lap of runs with this car and this gearing',()=>{
 const lap=(ms,ok=true)=>({durationMs:ms,valid:ok,pit:false,recordEligible:ok});
 const runs=[{car:'club gt',track:'Club',lane:1,configuration:{technical:{pinion:'9',gear:'27'}},laps:[lap(10100),lap(9800,false)]},{car:'Club GT',track:'Club',lane:2,configuration:{technical:{pinion:'9',gear:'27'}},laps:[lap(9950)]},{car:'Club GT',configuration:{technical:{pinion:'10',gear:'27'}},laps:[lap(9000)]}];
 const d=B.driven({pinion:'9',gear:'27'},'Club GT',runs);assert.equal(d.ms,9950);assert.equal(d.count,2);assert.equal(d.run.lane,2);
 assert.equal(B.driven({pinion:'11',gear:'27'},'Club GT',runs),null);assert.equal(B.driven({pinion:'9',gear:'27'},'',runs),null);
});
test('filters: favourites, driven and not driven yet',()=>{
 const list=[{id:'a',favourite:true},{id:'b'},{id:'c'}],driven=e=>e.id==='b';
 assert.deepEqual(B.filter(list,'favourites',driven).map(e=>e.id),['a']);assert.deepEqual(B.filter(list,'driven',driven).map(e=>e.id),['b']);
 assert.deepEqual(B.filter(list,'new',driven).map(e=>e.id),['a','c']);assert.equal(B.filter(list,'all',driven).length,3);
});
test('a run with this gearing but no record-eligible lap is not counted as driven (it broke the Library)',()=>{
 const runs=[{car:'Club GT',configuration:{technical:{pinion:'9',gear:'27'}},laps:[{durationMs:9900,valid:true,pit:true,recordEligible:false}]}];
 assert.equal(B.driven({pinion:'9',gear:'27'},'Club GT',runs),null);
});
