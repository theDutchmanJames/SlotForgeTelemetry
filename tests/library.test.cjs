const test=require('node:test'),assert=require('node:assert/strict');
const L=require('../renderer/library-model.js'),C=require('../renderer/calculator-model.js');
const now='2026-10-31T12:00:00.000Z';
const saved=()=>L.save([],{setup:{...C.EXAMPLE,name:'Club GT',totalWeight:'80'},notes:'Short track',newId:'one',now});
test('saving stores a validated independent snapshot of every setup input',()=>{
  const setup={...C.EXAMPLE},list=L.save([],{setup,notes:'notes',newId:'one',now});
  setup.pinion='10';assert.equal(list[0].setup.pinion,'9');assert.deepEqual(L.decode(L.encode(list)),list);
  const updated=L.save(list,{id:'one',setup:{...list[0].setup,pinion:'10'},notes:'new notes',now:'2026-11-01T12:00:00Z'});
  assert.equal(updated.length,1);assert.equal(updated[0].createdAt,now);assert.equal(updated[0].setup.pinion,'10');assert.equal(list[0].setup.pinion,'9');
});
test('rename, duplicate and delete leave unrelated setups intact',()=>{
  const list=saved(),renamed=L.rename(list,'one','Race trim',now),copied=L.duplicate(renamed,'one','two',now);
  assert.equal(list[0].setup.name,'Club GT');assert.equal(copied[0].setup.name,'Race trim (copy)');assert.equal(copied[0].setup.totalWeight,'80');
  assert.equal(L.remove(copied,'two').length,1);assert.equal(copied.length,2);assert.throws(()=>L.rename(list,'missing','name',now));
});
test('search matches notes and names; backup import creates copies',()=>{
  const list=saved();assert.equal(L.search(list,'SHORT').length,1);assert.equal(L.search(list,'missing').length,0);
  const merged=L.merge(list,list,()=> 'two');assert.equal(merged.length,2);assert.deepEqual(merged[0].setup,merged[1].setup);
});
test('invalid backups, duplicate ids and capacity are rejected atomically',()=>{
  const list=saved();
  for(const value of ['{}','null','{',L.encode(list).replace('slotforge-telemetry-library','other')])assert.throws(()=>L.decode(value));
  assert.throws(()=>L.clean([...list,...list]));
  for(const change of [{setup:{...C.EXAMPLE,name:' '}},{setup:{...C.EXAMPLE,pinion:'0'}},{notes:'x'.repeat(2001)},{updatedAt:'invalid'},{id:'<script>'}])assert.throws(()=>L.clean([{...list[0],...change}]));
  assert.throws(()=>L.clean(Array.from({length:501},(_,i)=>({...list[0],id:'id'+i}))));
  assert.equal(list.length,1);
});
