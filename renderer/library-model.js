(function(root) {
  const C=typeof module==='object'&&module.exports?require('./calculator-model.js'):root.CalculatorModel;
  const LIMIT=500,MAX_BYTES=2000000;
  function name(value) {
    if(typeof value!=='string'||!value.trim()||value.trim().length>100)throw Error('Give the setup a name (1–100 characters).');
    return value.trim();
  }
  function entry(value) {
    if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Invalid library entry.');
    if(typeof value.id!=='string'||!/^[-a-zA-Z0-9_]{1,80}$/.test(value.id))throw Error('Invalid library identifier.');
    for(const key of ['createdAt','updatedAt'])if(typeof value[key]!=='string'||!Number.isFinite(Date.parse(value[key])))throw Error('Invalid library date.');
    if(typeof value.notes!=='string'||value.notes.length>2000)throw Error('Notes must be at most 2,000 characters.');
    const setup=C.cleanSetup(value.setup);setup.name=name(setup.name);
    return {id:value.id,setup,notes:value.notes,createdAt:value.createdAt,updatedAt:value.updatedAt};
  }
  function clean(entries) {
    if(!Array.isArray(entries)||entries.length>LIMIT)throw Error('The library can hold up to 500 setups.');
    const result=entries.map(entry);
    if(new Set(result.map(e=>e.id)).size!==result.length)throw Error('Duplicate library identifiers.');
    return result;
  }
  function decode(text) {
    if(typeof text!=='string'||new TextEncoder().encode(text).length>MAX_BYTES)throw Error('Choose a library backup smaller than 2 MB.');
    const data=JSON.parse(text);
    if(data?.format!=='slotforge-telemetry-library'||data.version!==1)throw Error('This is not a SlotForge Telemetry library backup.');
    return clean(data.entries);
  }
  function encode(entries) {
    const text=JSON.stringify({format:'slotforge-telemetry-library',version:1,entries:clean(entries)},null,2);
    if(new TextEncoder().encode(text).length>MAX_BYTES)throw Error('The library exceeds 2 MB. Shorten notes or export and remove entries before adding more.');
    return text;
  }
  function save(entries,{id,setup,notes='',now,newId}) {
    const list=clean(entries),existing=id?list.find(e=>e.id===id):null;
    if(id&&!existing)throw Error('This saved setup no longer exists. Save a new copy instead.');
    const next=entry({id:existing?.id||newId,setup,notes,createdAt:existing?.createdAt||now,updatedAt:now});
    return clean(existing?list.map(e=>e.id===id?next:e):[next,...list]);
  }
  function rename(entries,id,label,now) {
    const item=entries.find(e=>e.id===id);if(!item)throw Error('This saved setup no longer exists.');
    return save(entries,{id,setup:{...item.setup,name:name(label)},notes:item.notes,now});
  }
  function duplicate(entries,id,newId,now) {
    const item=entries.find(e=>e.id===id);if(!item)throw Error('This saved setup no longer exists.');
    return save(entries,{setup:{...item.setup,name:item.setup.name.slice(0,93)+' (copy)'},notes:item.notes,newId,now});
  }
  function remove(entries,id) {
    const list=clean(entries);if(!list.some(e=>e.id===id))throw Error('This saved setup no longer exists.');
    return list.filter(e=>e.id!==id);
  }
  function merge(entries,incoming,makeId) {return clean([...clean(incoming).map(e=>({...e,id:makeId()})),...clean(entries)]);}
  function search(entries,query='',sort='recent') {
    const q=query.trim().toLocaleLowerCase();
    return entries.filter(e=>(e.setup.name+' '+e.notes).toLocaleLowerCase().includes(q)).sort(sort==='name'?(a,b)=>a.setup.name.localeCompare(b.setup.name):(a,b)=>Date.parse(b.updatedAt)-Date.parse(a.updatedAt)||a.setup.name.localeCompare(b.setup.name));
  }
  const api={LIMIT,MAX_BYTES,name,entry,clean,decode,encode,save,rename,duplicate,remove,merge,search};
  if(typeof module==='object'&&module.exports)module.exports=api;else root.LibraryModel=api;
})(globalThis);
