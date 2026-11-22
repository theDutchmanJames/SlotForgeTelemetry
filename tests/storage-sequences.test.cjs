// Random-sequence tests of every store that saves to disk. Thousands of random actions (add, edit, delete, star,
// import, stale edits, a failing or briefly locked disk, reopening the app) run through the real store; after each one
// the store must match a simple model of what should be there, what is on disk must match what is in memory, and the
// file must still pass the store's own check. A failed action must change nothing.
// SLOTFORGE_FUZZ_STEPS (default 250) and SLOTFORGE_FUZZ_SEEDS (default 3) make it longer (`npm run test:long`);
// SLOTFORGE_FUZZ_SEED repeats one run.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {ManualLapsStore,validate:validateManual}=require('../src/manual-laps-store.cjs');
const {GarageStore,validate:validateGarage}=require('../src/garage-store.cjs');
const {DataFiles,retry}=require('../src/data-files.cjs');retry.ms=0;
const L=require('../renderer/library-model.js'),C=require('../renderer/calculator-model.js'),N=require('../renderer/run-notes-model.js');
const STEPS=Number(process.env.SLOTFORGE_FUZZ_STEPS)||250;
const SEEDS=process.env.SLOTFORGE_FUZZ_SEED?[Number(process.env.SLOTFORGE_FUZZ_SEED)]:Array.from({length:Number(process.env.SLOTFORGE_FUZZ_SEEDS)||3},(_,i)=>1000+i*7919);
function random(seed){let a=seed>>>0;const next=()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};
 return {next,int:n=>Math.floor(next()*n),pick:list=>list[Math.floor(next()*list.length)],chance:p=>next()<p};}
const folder=t=>{const dir=fs.mkdtempSync(path.join(os.tmpdir(),'slotforge-seq-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));return dir;};
// The disk: fail every rename (a full or locked disk), or only the first one or two (antivirus holding a file).
function disk(){
 // Flushing to the platter is the crash tests' job (crash.test.cjs); here it only makes thousands of saves slow.
 const real=fs.renameSync,sync=fs.fsyncSync;let failing=0;fs.fsyncSync=()=>{};
 fs.renameSync=(...a)=>{if(failing>0){failing--;throw Object.assign(Error('EPERM: operation not permitted (test)'),{code:'EPERM'});}return real(...a);};
 return {fail(n){failing=n;},restore(){fs.renameSync=real;fs.fsyncSync=sync;failing=0;},get pending(){return failing;}};
}
const tempsIn=dir=>fs.readdirSync(dir).filter(n=>n.endsWith('.tmp'));
// Runs one sequence and reports the seed and the actions so far when something breaks.
function sequence(t,seed,steps,act){
 const r=random(seed),log=[];const d=disk();t.after(()=>d.restore());
 try{for(let i=0;i<steps;i++)act(r,d,s=>log.push(i+': '+s));}
 catch(e){e.message=`seed ${seed}: ${e.message}\nLast actions:\n${log.slice(-12).join('\n')}`;throw e;}
 finally{d.restore();}
}

test('manual and Track day laps: random saves, edits, deletes, imports and a failing disk',t=>{
 for(const seed of SEEDS){
  const dir=folder(t),file=path.join(dir,'manual-laps-v1.json');let store=new ManualLapsStore(file);const model=new Map(),exports=[];
  const CARS=['Club GT','club gt ','Le Mans','Rally'],TRACKS=['Home','Club circuit','home'];
  const values=r=>({name:'Run '+r.int(1000),car:r.pick(CARS),track:r.pick(TRACKS),driver:r.pick(['Alex','Sam','']),source:'Manual entry',notes:r.chance(.2)?'n'.repeat(r.int(50)):'',
   startedAt:new Date(Date.UTC(2026,0,1)+r.int(300)*86400000).toISOString(),type:r.pick(['practice','race']),lane:1+r.int(4),lengthM:r.chance(.2)?null:20,sequenceConfirmed:r.chance(.5),
   technical:{pinion:r.pick(['','9','10']),gear:'27',rearDiameter:'',weight:'',ratedRpm:''},laps:Array.from({length:1+r.int(8)},(_,n)=>({number:n+1,durationMs:9000+r.int(3000),valid:r.chance(.9),pit:r.chance(.05)}))});
  const canon=s=>s.normalize('NFKC').trim().toLowerCase();
  const check=()=>{
   assert.deepEqual(new Map(store.data.sessions.map(s=>[s.id,s.revision])),new Map([...model].map(([id,m])=>[id,m.revision])));
   for(const s of store.data.sessions)assert.deepEqual(s.values,model.get(s.id).values);
   if(fs.existsSync(file))assert.deepEqual(validateManual(JSON.parse(fs.readFileSync(file,'utf8'))),store.data,'disk matches memory');
   for(const key of ['car','track']){const ids=new Map();for(const s of store.data.sessions){const n=canon(s.values[key]);if(ids.has(n))assert.equal(s[key+'Id'],ids.get(n),'one id per '+key+' name');ids.set(n,s[key+'Id']);}assert.equal(new Set(ids.values()).size,ids.size,'different names, different ids');}
   assert.deepEqual(tempsIn(dir),[]);
  };
  sequence(t,seed,STEPS,(r,d,note)=>{
   const before=JSON.stringify(store.data),list=store.data.sessions,one=list.length?r.pick(list):null,failing=r.chance(.06)?6:r.chance(.06)?2:0;d.fail(failing);
   const expectFail=failing===6;let op=r.int(100),ok;
   try{
    if(op<35||!one){note('save new'+(failing?' (disk '+failing+')':''));const v=values(r),res=store.save({values:v});ok=res.savedId;assert.ok(!expectFail,'a failing disk must fail the save');model.set(ok,{revision:1,values:store.data.sessions.find(s=>s.id===ok).values});}
    else if(op<60){const stale=r.chance(.2);note('edit '+one.id+(stale?' (stale)':'')+(failing?' (disk '+failing+')':''));const v=values(r);store.save({id:one.id,revision:one.revision-(stale?1:0),values:v});assert.ok(!stale&&!expectFail,'must not save');const m=model.get(one.id);model.set(one.id,{revision:m.revision+1,values:store.data.sessions.find(s=>s.id===one.id).values});}
    else if(op<75){const stale=r.chance(.2);note('delete '+one.id+(stale?' (stale)':''));store.delete({id:one.id,revision:one.revision+(stale?1:0)});assert.ok(!stale&&!expectFail,'must not delete');model.delete(one.id);}
    else if(op<85){note('export');exports.push({text:JSON.stringify(store.view().data),model:new Map(model)});d.fail(0);}
    else if(op<95&&exports.length){const e=r.pick(exports);note('import an earlier export'+(failing?' (disk '+failing+')':''));const incoming=JSON.parse(e.text).sessions;
     const conflict=incoming.some(s=>{const o=store.data.sessions.find(x=>x.id===s.id);return o&&['contentHash','revision','createdAt','updatedAt'].some(k=>o[k]!==s[k]);});
     const res=store.importBackup(e.text);assert.ok(!conflict,'a different revision must stop the import');assert.ok(!expectFail);
     let added=0;for(const s of incoming)if(!model.has(s.id)){model.set(s.id,{revision:s.revision,values:s.values});added++;}assert.equal(res.added,added);}
    else {note('reopen');d.fail(0);store=new ManualLapsStore(file);assert.equal(store.error,'');}
   }catch(e){if(e.code==='ERR_ASSERTION')throw e;assert.equal(JSON.stringify(store.data),before,'a failed action changes nothing: '+e.message);}
   d.fail(0);check();
  });
 }
});

test('garage: random cars and tracks, name clashes, removes and a failing disk',t=>{
 for(const seed of SEEDS){
  const dir=folder(t),file=path.join(dir,'garage-v1.json');let store=new GarageStore(file);const model={cars:new Map(),tracks:new Map()};
  const NAMES=['Club GT','club gt','Le Mans','Rally','  Rally ','Home','Oval','Figure 8'];
  const key=s=>s.trim().toLowerCase();
  const check=()=>{
   for(const kind of ['cars','tracks']){
    assert.deepEqual(new Map(store.data[kind].map(r=>[r.id,r.name])),model[kind]);
    const names=store.data[kind].map(r=>r.name);assert.deepEqual(names,[...names].sort((a,b)=>a.localeCompare(b)),'sorted by name');
   }
   if(fs.existsSync(file))assert.deepEqual(validateGarage(JSON.parse(fs.readFileSync(file,'utf8'))),store.data,'disk matches memory');
   assert.deepEqual(tempsIn(dir),[]);
  };
  sequence(t,seed,STEPS,(r,d,note)=>{
   const before=JSON.stringify(store.data),kind=r.pick(['cars','tracks']),list=store.data[kind],one=list.length&&r.chance(.5)?r.pick(list):null,failing=r.chance(.06)?6:r.chance(.06)?1:0;d.fail(failing);
   const name=r.pick(NAMES),op=r.int(100);
   try{
    if(op<70){note((one?'edit ':'add ')+kind+' '+JSON.stringify(name)+(failing?' (disk '+failing+')':''));
     const clash=[...model[kind]].some(([id,n])=>id!==one?.id&&key(n)===key(name));
     const input=kind==='cars'?{id:one?.id,name,maker:r.pick(['','Home build']),notes:''}:{id:one?.id,name,lanes:Array.from({length:1+r.int(4)},(_,i)=>({lane:i+1,lengthM:r.chance(.3)?null:20+i})),notes:''};
     const res=kind==='cars'?store.saveCar(input):store.saveTrack(input);assert.ok(!clash,'two '+kind+' must not share a name');assert.ok(failing!==6);model[kind].set(res.savedId,name.trim());}
    else if(op<90){const id=one?.id||'missing';note('remove '+kind+' '+id);store.remove(kind,id);assert.ok(one&&failing!==6,'must not remove');model[kind].delete(id);}
    else {note('reopen');d.fail(0);store=new GarageStore(file);assert.equal(store.error,'');}
   }catch(e){if(e.code==='ERR_ASSERTION')throw e;assert.equal(JSON.stringify(store.data),before,'a failed action changes nothing: '+e.message);}
   d.fail(0);check();
  });
 }
});

// The setup library is kept by the page: it reads the file, applies a rule from LibraryModel and writes the result.
// This runs that same round trip through the real data files.
test('setup library: random saves, renames, copies, stars, removes, imports, the 500 limit and a failing disk',t=>{
 for(const seed of SEEDS){
  const dir=folder(t),files=new DataFiles(dir);let n=0,clock=Date.UTC(2026,0,1);const model=new Map();
  const read=()=>{const text=files.get('library');return text===null?[]:L.decode(text);};
  const now=()=>new Date(clock+=60000).toISOString(),newId=()=>'s'+(n++);
  const check=()=>{
   const list=read();assert.deepEqual(new Map(list.map(e=>[e.id,[e.setup.name,e.notes,!!e.favourite]])),model);
   assert.ok(list.length<=L.LIMIT);assert.equal(L.encode(list),files.get('library')??L.encode([]),'the file is exactly what encode writes');
   assert.deepEqual(tempsIn(dir),[]);
  };
  sequence(t,seed,Math.ceil(STEPS/3),(r,d,note)=>{
   const list=read(),before=files.get('library'),one=list.length?r.pick(list):null,failing=r.chance(.06)?6:r.chance(.06)?2:0,op=r.int(100);
   const write=(next,apply)=>{d.fail(failing);files.set('library',L.encode(next));d.fail(0);assert.ok(failing!==6,'a failing disk must fail the save');apply();};
   try{
    if(op<30||!one){const name=r.chance(.05)?'':'Setup '+r.int(99),notes=r.chance(.05)?'x'.repeat(2001):r.chance(.3)?'notes '.repeat(r.int(40)):'',id=newId();note('save new '+JSON.stringify(name));
     write(L.save(list,{setup:{...C.EXAMPLE,name,pinion:String(8+r.int(4))},notes,now:now(),newId:id}),()=>model.set(id,[name.trim(),notes,false]));}
    else if(op<45){const name='Edited '+r.int(99);note('edit '+one.id);write(L.save(list,{id:one.id,setup:{...one.setup,name},notes:one.notes,now:now()}),()=>model.set(one.id,[name,one.notes,!!one.favourite]));}
    else if(op<55){const name=r.chance(.1)?' '.repeat(3):'Renamed '+r.int(99);note('rename '+one.id);write(L.rename(list,one.id,name,now()),()=>model.set(one.id,[name.trim(),one.notes,!!one.favourite]));}
    else if(op<65){const id=newId();note('copy '+one.id);write(L.duplicate(list,one.id,id,now()),()=>model.set(id,[one.setup.name.slice(0,93)+' (copy)',one.notes,false]));}
    else if(op<75){const on=r.chance(.5);note('star '+one.id+' '+on);write(L.star(list,one.id,on),()=>model.set(one.id,[one.setup.name,one.notes,on]));}
    else if(op<88){const gone=r.chance(.1);note('remove '+(gone?'a removed setup':one.id));write(L.remove(list,gone?'missing':one.id),()=>{assert.ok(!gone);model.delete(one.id);});}
    else {const take=list.slice(0,r.int(Math.min(list.length,60))+1),ids=[];note('import '+take.length+' setups');
     write(L.merge(list,take,()=>{const id=newId();ids.push(id);return id;}),()=>take.forEach((e,i)=>model.set(ids[i],[e.setup.name,e.notes,!!e.favourite])));}
   }catch(e){if(e.code==='ERR_ASSERTION')throw e;d.fail(0);assert.equal(files.get('library'),before,'a failed action changes nothing: '+e.message);}
   check();
  });
 }
});

test('run notes: random notes and tags round-trip through the file, empty ones disappear',t=>{
 for(const seed of SEEDS){
  const dir=folder(t),files=new DataFiles(dir),model=new Map();
  sequence(t,seed,STEPS,(r,d,note)=>{
   const data=N.decode(files.get('runnotes')),id='run-'+r.int(30),change=r.chance(.5)?{note:r.pick(['','  ','fast','x'.repeat(2100)])}:{tag:r.pick(['',...N.TAGS,'bogus'])};note('set '+id+' '+JSON.stringify(change).slice(0,40));
   const next=N.set(data,id,change),failing=r.chance(.06)?6:0;d.fail(failing);
   try{files.set('runnotes',JSON.stringify(next));assert.ok(!failing);
    const m={...(model.get(id)||{}),...change},noteText=typeof m.note==='string'?m.note.slice(0,N.MAX_NOTE):'',tag=N.TAGS.includes(m.tag)?m.tag:'';
    if(noteText.trim()||tag)model.set(id,{...(noteText.trim()?{note:noteText}:{}),...(tag?{tag}:{})});else model.delete(id);}
   catch(e){if(e.code==='ERR_ASSERTION')throw e;}
   d.fail(0);assert.deepEqual(new Map(Object.entries(N.decode(files.get('runnotes')).runs)),model);
  });
 }
});
