// Crash and interruption tests: a separate process saves, backs up, restores or imports in a loop, and is killed at a
// random moment (like a crash or pulling the plug on the app). Then, as Telemetry does at start, the profile is
// recovered and every file must open cleanly: nothing half-written, nothing reported saved lost, no restore left as a
// mix of old and new files, and no temporary files left behind.
// SLOTFORGE_CRASH_ROUNDS (default 6) sets the number of kills per kind (`npm run test:long` uses more).
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{spawn}=require('node:child_process');
const {Backups,recover,JOURNAL}=require('../src/backups.cjs'),{DataFiles}=require('../src/data-files.cjs');
const {ManualLapsStore}=require('../src/manual-laps-store.cjs'),{GarageStore}=require('../src/garage-store.cjs');
const L=require('../renderer/library-model.js'),C=require('../renderer/calculator-model.js'),N=require('../renderer/run-notes-model.js');
const ROUNDS=Number(process.env.SLOTFORGE_CRASH_ROUNDS)||6,WORKER=path.join(__dirname,'support/crash-worker.cjs');
const folder=t=>{const dir=fs.mkdtempSync(path.join(os.tmpdir(),'slotforge-crash-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));return dir;};
// Starts the worker, lets it complete at least one round, waits a random moment and kills it. Returns the last round it reported.
function crash(mode,profile,round,wait){
 fs.writeFileSync(path.join(profile,'round.txt'),String(round));
 return new Promise((resolve,reject)=>{
  const child=spawn(process.execPath,[WORKER,mode,profile],{stdio:['ignore','pipe','pipe']});let out='',err='',timer=null,killed=false;
  child.stdout.on('data',d=>{out+=d;if(!timer&&/ok \d+/.test(out))timer=setTimeout(()=>{killed=true;child.kill('SIGKILL');},wait);});
  child.stderr.on('data',d=>err+=d);
  const guard=setTimeout(()=>{child.kill('SIGKILL');reject(Error(mode+': no round finished in time. '+err));},20000);
  child.on('exit',()=>{clearTimeout(guard);clearTimeout(timer);if(!killed)return reject(Error(mode+' stopped by itself: '+err.slice(0,800)));const acks=[...out.matchAll(/ok (\d+)/g)].map(m=>Number(m[1]));resolve(acks.at(-1));});
 });
}
const temps=profile=>{const out=[];for(const dir of [profile,path.join(profile,'backups')]){try{for(const n of fs.readdirSync(dir))if(n.endsWith('.tmp'))out.push(n);}catch{}}return out;};
// What the app does at start, then: every data file present passes its own store's check.
function reopen(profile){
 recover(profile);
 assert.deepEqual(temps(profile),[],'no temporary files left after start');assert.equal(fs.existsSync(path.join(profile,JOURNAL)),false,'no restore left unfinished');
 const b=new Backups(profile);
 for(const [name,check] of Object.entries(b.validators)){const file=path.join(profile,name);if(fs.existsSync(file))assert.doesNotThrow(()=>check(fs.readFileSync(file,'utf8')),name+' is readable');}
 const manual=new ManualLapsStore(path.join(profile,'manual-laps-v1.json')),garage=new GarageStore(path.join(profile,'garage-v1.json'));
 assert.equal(manual.error,'');assert.equal(garage.error,'');
 for(const f of b.list())assert.doesNotThrow(()=>b.readFile(path.join(b.dir,f.name)),'backup '+f.name+' is readable');
 return {b,manual,garage,files:new DataFiles(profile)};
}
const waits=i=>[0,3,8,15,30,60,120,250][i%8];

test('killed while saving setups, notes, laps and garage cars: everything opens, and what was reported saved is there',async t=>{
 const profile=folder(t);let round=1;
 for(let i=0;i<ROUNDS;i++){
  const last=await crash('saves',profile,round,waits(i)),{manual,garage,files}=reopen(profile);
  const list=L.decode(files.get('library'));
  assert.ok(list.some(e=>e.id==='s'+last),'setup of round '+last+' was reported saved');
  assert.ok(Number(files.get('active').slice(1))>=last);
  assert.ok(manual.data.sessions.some(s=>s.values.name==='Run '+last),'lap session of round '+last);
  assert.ok(garage.data.cars.some(c=>c.name==='Car '+last),'garage car of round '+last);
  assert.equal(N.decode(files.get('runnotes')).runs['run-'+(last%25)]?.note!==undefined,true);
  round=last+2;
 }
});

test('killed while writing backups: every backup in the folder can still be read and restored',async t=>{
 const profile=folder(t),files=new DataFiles(profile);
 files.set('library',L.encode(Array.from({length:30},(_,i)=>({id:'s'+i,setup:{...C.EXAMPLE,name:'Setup '+i},notes:'n'.repeat(500),createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}))));
 let round=1;for(let i=0;i<ROUNDS;i++){const last=await crash('backups',profile,round,waits(i)),{b}=reopen(profile);assert.ok(b.list().length>=1);round=last+1;}
});

test('killed during a restore: the next start finishes it, so the data is all one backup or all the other, never a mix',async t=>{
 const profile=folder(t),files=new DataFiles(profile),b=new Backups(profile);
 const make=(n,extra)=>{for(const name of Object.keys(b.validators))fs.rmSync(path.join(profile,name),{force:true});
  files.set('library',L.encode(Array.from({length:n},(_,i)=>({id:'s'+i,setup:{...C.EXAMPLE,name:'Setup '+n+'-'+i},notes:'',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}))));
  files.set('active','s0');extra();return b.bundle('test').text;};
 const A=make(3,()=>{new GarageStore(path.join(profile,'garage-v1.json')).saveCar({name:'Only in A',maker:'',notes:''});files.set('workspace',C.encode({...C.EXAMPLE,name:'Draft A'}));});
 const B=make(7,()=>{files.set('runnotes',JSON.stringify(N.set(N.empty(),'run-1',{note:'only in B'})));const m=new ManualLapsStore(path.join(profile,'manual-laps-v1.json'));m.save({values:{name:'Run B',car:'GT',track:'Home',driver:'',source:'',notes:'',startedAt:'2026-01-01T00:00:00.000Z',type:'practice',lane:1,lengthM:null,sequenceConfirmed:true,laps:[{number:1,durationMs:9000,valid:true,pit:false}]}});});
 fs.writeFileSync(path.join(profile,'bundle-a.json'),A);fs.writeFileSync(path.join(profile,'bundle-b.json'),B);
 const contents=text=>Object.fromEntries(Object.entries(JSON.parse(text).files).map(([n,f])=>[n,f.text]));
 const now=()=>Object.fromEntries(Object.keys(b.validators).filter(n=>fs.existsSync(path.join(profile,n))).map(n=>[n,fs.readFileSync(path.join(profile,n),'utf8')]));
 let round=1;
 for(let i=0;i<ROUNDS*2;i++){
  const last=await crash('restore',profile,round,waits(i));reopen(profile);
  const data=now(),isA=JSON.stringify(data)===JSON.stringify(contents(A)),isB=JSON.stringify(data)===JSON.stringify(contents(B));
  assert.ok(isA||isB,'after round '+last+' the data is one whole backup; files: '+Object.keys(data).join(', '));
  round=last+1;
 }
});

test('killed while importing a lap backup: the lap library opens, with the import either done or not',async t=>{
 const profile=folder(t),m=new ManualLapsStore(path.join(profile,'manual-laps-v1.json'));
 for(let i=0;i<12;i++)m.save({values:{name:'Run '+i,car:'GT '+(i%3),track:'Home',driver:'',source:'',notes:'',startedAt:'2026-01-01T00:00:00.000Z',type:'practice',lane:1,lengthM:null,sequenceConfirmed:true,laps:Array.from({length:50},(_,n)=>({number:n+1,durationMs:9000+n,valid:true,pit:false}))}});
 fs.writeFileSync(path.join(profile,'manual-export.json'),JSON.stringify(m.view().data));
 let round=1;for(let i=0;i<ROUNDS;i++){const last=await crash('import',profile,round,waits(i)),{manual}=reopen(profile);assert.ok(manual.data.sessions.length<=12);round=last+1;}
});
