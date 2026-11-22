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
 // A file that was already unreadable is restored as it was; it does not block restoring the rest.
 const odd=b.read(tamper(x=>{const t='{"version":2}';x.files['garage-v1.json']={text:t,size:t.length,sha256:require('node:crypto').createHash('sha256').update(t).digest('hex')};}));
 assert.equal(odd.contents.find(c=>c.name==='garage-v1.json').unreadable,true);assert.match(odd.contents.find(c=>c.name==='garage-v1.json').label,/unreadable, restored as it was/);
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

test('a backup made while one file was unreadable can still be restored',t=>{
 const dir=profile(t);seed(dir);fs.writeFileSync(path.join(dir,'garage-v1.json'),'{broken');
 const b=new Backups(dir,{now:clock()}),saved=b.write(b.dir,'manual','manual');
 fs.writeFileSync(path.join(dir,'setups-active-v1.txt'),'changed-later');
 const r=b.restore(b.readFile(saved.file));assert.ok(fs.existsSync(r.safety));
 assert.equal(fs.readFileSync(path.join(dir,'setups-active-v1.txt'),'utf8'),'entry-1');assert.equal(fs.readFileSync(path.join(dir,'garage-v1.json'),'utf8'),'{broken','kept as it was');
});
test('a restore writes every file first: a failure while writing changes nothing',t=>{
 const dir=profile(t);seed(dir);const b=new Backups(dir,{now:clock()}),checked=b.readFile(b.write(b.dir,'manual','manual').file);
 fs.writeFileSync(path.join(dir,'setups-active-v1.txt'),'changed-later');
 const df=require('../src/data-files.cjs'),original=df.writeTemp;let n=0;
 // The second file cannot be written (a full disk, say).
 require.cache[require.resolve('../src/data-files.cjs')].exports.writeTemp=(...a)=>{if(++n===2)throw Error('disk full');return original(...a);};
 const fresh=(()=>{delete require.cache[require.resolve('../src/backups.cjs')];return require('../src/backups.cjs');})();
 const b2=new fresh.Backups(dir,{now:clock()});
 try{assert.throws(()=>b2.restore(checked),/Nothing was restored: disk full/);}finally{df.writeTemp=original;delete require.cache[require.resolve('../src/backups.cjs')];}
 assert.equal(fs.readFileSync(path.join(dir,'setups-active-v1.txt'),'utf8'),'changed-later','nothing was swapped in');
 assert.deepEqual(fs.readdirSync(dir).filter(f=>f.endsWith('.tmp')),[],'no temporary files are left behind');
});
test('a save retries when Windows briefly holds the file, then gives up',t=>{
 const dir=profile(t),{atomicWrite}=require('../src/data-files.cjs'),file=path.join(dir,'x.json'),rename=fs.renameSync;let fails=2;
 fs.renameSync=(a,b)=>{if(fails-->0){const e=Error('busy');e.code='EBUSY';throw e;}return rename(a,b);};
 try{atomicWrite(file,'one');assert.equal(fs.readFileSync(file,'utf8'),'one');fails=99;assert.throws(()=>atomicWrite(file,'two'),/busy/);assert.equal(fs.readFileSync(file,'utf8'),'one');}
 finally{fs.renameSync=rename;}
 assert.deepEqual(fs.readdirSync(dir).filter(f=>f.endsWith('.tmp')),[]);
});
test('a restore stopped part-way by a locked file is finished at the next start, never left as a mix',t=>{
 const {recover,finishRestore,JOURNAL}=require('../src/backups.cjs'),{retry}=require('../src/data-files.cjs');
 const dir=profile(t),files=seed(dir),b=new Backups(dir,{now:clock()});const backup=b.readFile(b.write(b.dir,'manual','manual').file);
 files.set('active','');files.set('runnotes','{"version":1,"runs":{"r":{"note":"after the backup"}}}');
 const real=fs.renameSync;let renames=0;retry.ms=0;
 fs.renameSync=(...a)=>{if(String(a[1]).endsWith('.json')&&!String(a[1]).includes('backups')&&!String(a[1]).includes(JOURNAL)&&++renames>1)throw Object.assign(Error('EBUSY: resource busy (test)'),{code:'EBUSY'});return real(...a);};
 let error;try{b.restore(backup);}catch(e){error=e;}finally{fs.renameSync=real;retry.ms=25;}
 assert.equal(error?.partial,true);assert.match(error.message,/finishes it/);assert.ok(fs.existsSync(path.join(dir,JOURNAL)),'the journal stays for the next start');
 assert.deepEqual(recover(dir),{finished:true});assert.equal(fs.existsSync(path.join(dir,JOURNAL)),false);
 for(const [name,f] of Object.entries(backup.bundle.files))assert.equal(fs.readFileSync(path.join(dir,name),'utf8'),f.text,name+' is the backup\'s');
 assert.equal(fs.existsSync(path.join(dir,'run-notes-v1.json')),false,'a file the backup did not have is removed');
 assert.deepEqual(fs.readdirSync(dir).filter(n=>n.endsWith('.tmp')),[]);assert.equal(finishRestore(dir),false,'running it again does nothing');
});
test('start-up clears leftovers of cut-off saves, ignores a damaged journal and leaves other files alone',t=>{
 const {recover,JOURNAL}=require('../src/backups.cjs'),dir=profile(t);seed(dir);fs.mkdirSync(path.join(dir,'backups'));
 const left=[path.join(dir,'garage-v1.json.0f8fad5b-d9cb-469f-a165-70867728950e.tmp'),path.join(dir,'backups','auto-x.json.7c9e6679-7425-40de-944b-e07fc1f90ae7.tmp')];
 for(const f of left)fs.writeFileSync(f,'{"half":');fs.writeFileSync(path.join(dir,'notes.tmp'),'mine');fs.writeFileSync(path.join(dir,JOURNAL),'{"version":1,"files":{"../outside.json":"x.tmp","garage-v1.json":"../../evil.tmp"}}');
 recover(dir);for(const f of left)assert.equal(fs.existsSync(f),false);assert.equal(fs.readFileSync(path.join(dir,'notes.tmp'),'utf8'),'mine','only Telemetry\'s own temporary files');
 assert.equal(fs.existsSync(path.join(dir,JOURNAL)),false);assert.doesNotThrow(()=>JSON.parse(fs.readFileSync(path.join(dir,'garage-v1.json'),'utf8')),'the journal could not touch the garage');
 fs.writeFileSync(path.join(dir,JOURNAL),'{"vers');recover(dir);assert.equal(fs.existsSync(path.join(dir,JOURNAL)),false,'a half-written journal (killed before the swap began) is dropped');
});
test('a briefly locked file is retried; a file that stays locked fails the save and changes nothing',t=>{
 const {retry,atomicWrite}=require('../src/data-files.cjs'),dir=profile(t),f=new DataFiles(dir);f.set('active','one');
 const real=fs.renameSync;let fail=0;retry.ms=0;fs.renameSync=(...a)=>{if(fail>0){fail--;throw Object.assign(Error('EPERM (test)'),{code:'EPERM'});}return real(...a);};
 try{fail=3;f.set('active','two');assert.equal(f.get('active'),'two');
  fail=99;assert.throws(()=>f.set('active','three'),/Nothing was changed/);assert.equal(f.get('active'),'two');
  fail=0;fs.renameSync=()=>{throw Object.assign(Error('ENOSPC (test)'),{code:'ENOSPC'});};assert.throws(()=>atomicWrite(path.join(dir,'x.json'),'{}'),/ENOSPC/);
 }finally{fs.renameSync=real;retry.ms=25;}
 assert.deepEqual(fs.readdirSync(dir).filter(n=>n.endsWith('.tmp')),[]);
 assert.throws(()=>f.set('active',5),/4 MiB/);assert.throws(()=>f.file('nope'),/Unknown/);
 fs.writeFileSync(f.file('library'),'x'.repeat(4*1024*1024+1));assert.throws(()=>f.get('library'),/too large/);
});
test('automatic backups: an unavailable extra folder is reported and cleared once it works again',t=>{
 const dir=profile(t);seed(dir);const b=new Backups(dir,{now:clock()}),extra=path.join(dir,'usb');
 b.settings.extraFolder=extra;assert.ok(b.auto().file);assert.match(b.status().lastError,/extra backup folder is not available/);
 fs.mkdirSync(extra);new DataFiles(dir).set('active','');const r=b.auto();assert.equal(r.copied,extra);assert.equal(b.status().lastError,'');assert.equal(fs.readdirSync(extra).length,1);
 assert.equal(b.auto().skipped,'unchanged');const again=new Backups(dir,{now:clock()});assert.equal(again.settings.extraFolder,extra,'the folder is remembered');
});
