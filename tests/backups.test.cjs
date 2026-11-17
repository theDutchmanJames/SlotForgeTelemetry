const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {DataFiles}=require('../src/data-files.cjs'),{Backups,KEEP}=require('../src/backups.cjs');
const Library=require('../renderer/library-model.js'),Calculator=require('../renderer/calculator-model.js');
function profile(t){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'telemetry-backup-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));return dir;}
// A clock that moves forward one minute per backup, so file names and times stay distinct.
function clock(){let t=Date.parse('2026-11-17T10:00:00Z');return ()=>new Date(t+=60000);}
function seed(dir){
 const files=new DataFiles(dir);
 files.set('library',Library.encode(Library.save([],{setup:Calculator.EXAMPLE,notes:'',now:new Date().toISOString(),newId:'entry-1'})));
 files.set('workspace',Calculator.encode(Calculator.EXAMPLE,null));files.set('active','entry-1');
 fs.writeFileSync(path.join(dir,'garage-v1.json'),JSON.stringify({version:1,cars:[],tracks:[]}));
 return files;
}
test('data files store text atomically, refuse oversized data and report missing files as null',t=>{
 const dir=profile(t),f=new DataFiles(dir);assert.equal(f.get('library'),null);
 f.set('library','{"x":1}');assert.equal(f.get('library'),'{"x":1}');assert.ok(fs.existsSync(path.join(dir,'setups-library-v1.json')));
 assert.throws(()=>f.set('library','x'.repeat(5*1024*1024)),/4 MiB/);assert.equal(f.get('library'),'{"x":1}');
 assert.throws(()=>f.get('../secret'),/Unknown data file/);f.remove('library');assert.equal(f.get('library'),null);
});
test('automatic backups happen only when data changed, keep the newest ten and copy to an extra folder',t=>{
 const dir=profile(t),files=seed(dir),b=new Backups(dir,{now:clock()});
 const first=b.auto();assert.ok(first.file);assert.equal(b.auto().skipped,'unchanged');
 files.set('active','');assert.equal(b.auto({minHours:12}).skipped,'recent','a minimum gap can be honoured');
 for(let i=0;i<12;i++){files.set('active','entry-'+i);b.auto();}
 assert.equal(b.list().filter(x=>x.kind==='auto').length,KEEP);
 const extra=path.join(dir,'usb');fs.mkdirSync(extra);b.settings.extraFolder=extra;files.set('active','copied');b.auto();
 assert.equal(fs.readdirSync(extra).filter(n=>n.startsWith('SlotForge-Telemetry-auto-')).length,1);
 b.settings.extraFolder=path.join(dir,'unplugged');files.set('active','unplugged');const r=b.auto();assert.ok(r.file,'the local backup is still made');assert.match(b.status().lastError,/not available/);
});
test('a backup is checked completely before anything is restored',t=>{
 const dir=profile(t);seed(dir);const b=new Backups(dir,{now:clock()}),text=b.bundle('test').text;
 const ok=b.read(text);assert.deepEqual(ok.contents.map(c=>c.label).sort(),['Active setup','Garage cars and tracks','Saved setups','Workbench draft']);
 const tamper=f=>{const x=JSON.parse(text);f(x);return JSON.stringify(x);};
 assert.throws(()=>b.read('{"format":"other"}'),/not a SlotForge Telemetry backup/);
 assert.throws(()=>b.read(tamper(x=>{x.files['garage-v1.json'].text='{"version":1,"cars":[],"tracks":[{}]}';})),/Garage cars and tracks in this backup is damaged/);
 assert.throws(()=>b.read(tamper(x=>{const t='{"version":2}';x.files['garage-v1.json']={text:t,size:t.length,sha256:require('node:crypto').createHash('sha256').update(t).digest('hex')};})),/cannot be read/);
 assert.throws(()=>b.read(tamper(x=>{x.files['../../evil.txt']=x.files['garage-v1.json'];})),/unknown file/);
});
test('restore replaces all data after a safety backup; files missing from the backup are removed',t=>{
 const dir=profile(t),files=seed(dir),b=new Backups(dir,{now:clock()});
 const older=b.read(b.bundle('older').text);
 files.set('active','changed-later');fs.writeFileSync(path.join(dir,'paddock-local-v1.json'),JSON.stringify({version:1,databaseId:'x',name:'n'}));
 const r=b.restore(older);
 assert.equal(files.get('active'),'entry-1');assert.equal(fs.existsSync(path.join(dir,'paddock-local-v1.json')),false);
 const safety=b.readFile(r.safety);assert.ok(safety.contents.some(c=>c.name==='paddock-local-v1.json'),'the safety backup holds what was replaced');
 assert.equal(b.list()[0].kind,'before-restore');
});
