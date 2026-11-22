'use strict';
// One backup file holds every Telemetry data file: setups, draft, manual laps, garage, imported races and caches.
// Automatic backups are taken when something changed; every restore is validated first and preceded by a safety backup.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {atomicWrite,writeTemp,renameRetry,sweepTemps}=require('./data-files.cjs');
const FORMAT='slotforge-telemetry-backup',KEEP=10,MAX_FILE=200*1024*1024,MAX_BUNDLE=600*1024*1024;
const sha=t=>crypto.createHash('sha256').update(t).digest('hex');
const json=t=>JSON.parse(t);
// Every file a backup may contain, with the check its own store applies when reading it.
function knownFiles(){
 const Library=require('../renderer/library-model.js'),Calculator=require('../renderer/calculator-model.js');
 const manual=require('./manual-laps-store.cjs'),garage=require('./garage-store.cjs'),network=require('./paddock-client.cjs'),local=require('./paddock-local.cjs');
 const version1=t=>{if(json(t)?.version!==1)throw Error('Unsupported file version.');};
 return {
  'setups-library-v1.json':t=>Library.decode(t),
  'workbench-draft-v1.json':t=>Calculator.decode(t),
  'setups-active-v1.txt':t=>{if(t!==''&&!/^[A-Za-z0-9_-]{1,100}$/.test(t))throw Error('Invalid active setup.');},
  'manual-laps-v1.json':t=>manual.validate(json(t)),
  'run-notes-v1.json':t=>{require('../renderer/run-notes-model.js').decode(t);},
  'garage-v1.json':t=>garage.validate(json(t)),
  'paddock-results-v1.json':t=>network.checkCache(json(t)),
  'paddock-shared-history-v1.json':t=>local.checkCache(json(t)),
  'paddock-cars-v1.json':t=>local.checkCars(json(t)),
  'paddock-connection-v1.json':version1,
  'paddock-local-v1.json':version1
 };
}
const LABELS={'setups-library-v1.json':'Saved setups','workbench-draft-v1.json':'Workbench draft','setups-active-v1.txt':'Active setup','manual-laps-v1.json':'Manual and Track day laps','run-notes-v1.json':'Notes and tags on runs','garage-v1.json':'Garage cars and tracks','paddock-results-v1.json':'Races imported over the network','paddock-shared-history-v1.json':'Races from Paddock on this computer','paddock-cars-v1.json':'Paddock car catalogue','paddock-connection-v1.json':'Last network Paddock','paddock-local-v1.json':'Selected local Paddock'};
const stamp=d=>d.toISOString().replace(/[:.]/g,'-');
class Backups{
 constructor(profile,{version='0.0.0',now=()=>new Date()}={}){
  this.profile=profile;this.dir=path.join(profile,'backups');this.settingsFile=path.join(profile,'backups-settings.json');this.version=version;this.now=now;this.validators=knownFiles();
  this.settings={version:1,extraFolder:null,lastHash:null,lastAt:null,lastError:''};
  try{const s=json(fs.readFileSync(this.settingsFile,'utf8'));if(s?.version===1)this.settings={...this.settings,extraFolder:typeof s.extraFolder==='string'?s.extraFolder:null,lastHash:typeof s.lastHash==='string'?s.lastHash:null,lastAt:typeof s.lastAt==='string'?s.lastAt:null};}catch{/* Defaults. */}
 }
 saveSettings(){try{atomicWrite(this.settingsFile,JSON.stringify(this.settings));}catch{/* Backups still work this session. */}}
 // The current data files, read as text. Unreadable files are included as they are: a backup must never drop data.
 snapshot(){
  const files={};
  for(const name of Object.keys(this.validators)){const file=path.join(this.profile,name);try{const st=fs.statSync(file);if(st.size>MAX_FILE)throw Error(name+' is too large to back up.');const text=fs.readFileSync(file,'utf8');files[name]={sha256:sha(text),size:Buffer.byteLength(text),text};}catch(e){if(e.code!=='ENOENT')throw e;}}
  return {files,hash:sha(JSON.stringify(Object.entries(files).map(([n,f])=>[n,f.sha256])))};
 }
 bundle(reason){const s=this.snapshot();return {text:JSON.stringify({format:FORMAT,version:1,createdAt:this.now().toISOString(),reason,app:{name:'SlotForge Telemetry',version:this.version},files:s.files}),hash:s.hash};}
 write(dir,prefix,reason){const b=this.bundle(reason),file=path.join(dir,`${prefix}-${stamp(this.now())}.json`);fs.mkdirSync(dir,{recursive:true});atomicWrite(file,b.text);return {file,hash:b.hash};}
 // Automatic backup: only when something changed since the last one. force=false honours a minimum gap.
 auto({minHours=0}={}){
  try{
   const now=this.now(),current=this.snapshot().hash;
   if(current===this.settings.lastHash)return {skipped:'unchanged'};
   if(minHours&&this.settings.lastAt&&now-new Date(this.settings.lastAt)<minHours*3600000)return {skipped:'recent'};
   const {file}=this.write(this.dir,'auto','automatic');
   let copied=null;if(this.settings.extraFolder){try{if(!fs.statSync(this.settings.extraFolder).isDirectory())throw Error();fs.copyFileSync(file,path.join(this.settings.extraFolder,path.basename(file).replace(/^auto/,'SlotForge-Telemetry-auto')));copied=this.settings.extraFolder;}catch{this.settings.lastError='The extra backup folder is not available. Backups are still kept on this computer.';}}
   if(copied)this.settings.lastError='';
   this.settings.lastHash=current;this.settings.lastAt=now.toISOString();this.saveSettings();this.prune();
   return {file,copied};
  }catch(e){this.settings.lastError='Automatic backup failed: '+e.message;this.saveSettings();return {error:this.settings.lastError};}
 }
 prune(){const autos=this.list().filter(b=>b.kind==='auto');for(const b of autos.slice(KEEP))fs.rmSync(path.join(this.dir,b.name),{force:true});}
 list(){
  let names=[];try{names=fs.readdirSync(this.dir).filter(n=>/^(auto|manual|before-restore)-[\dTZ-]+\.json$/.test(n));}catch{return [];}
  return names.map(name=>{const st=fs.statSync(path.join(this.dir,name));return {name,kind:name.split('-')[0]==='before'?'before-restore':name.split('-')[0],size:st.size,createdAt:st.mtime.toISOString()};}).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)||b.name.localeCompare(a.name));
 }
 status(){return {folder:this.dir,extraFolder:this.settings.extraFolder,lastAt:this.settings.lastAt,lastError:this.settings.lastError,backups:this.list(),keep:KEEP};}
 // Reads and fully validates a backup. Returns what it contains; throws with a plain reason otherwise.
 read(text){
  if(typeof text!=='string'||Buffer.byteLength(text)>MAX_BUNDLE)throw Error('This backup is too large or empty.');
  let b;try{b=json(text);}catch{throw Error('This is not a SlotForge Telemetry backup.');}
  if(b?.format!==FORMAT||b.version!==1||!b.files||typeof b.files!=='object'||Array.isArray(b.files)||!Number.isFinite(Date.parse(b.createdAt)))throw Error('This is not a SlotForge Telemetry backup.');
  const contents=[];
  for(const [name,f] of Object.entries(b.files)){
   if(!this.validators[name])throw Error('The backup contains an unknown file: '+String(name).slice(0,80));
   if(typeof f?.text!=='string'||sha(f.text)!==f.sha256||Buffer.byteLength(f.text)!==f.size)throw Error(`${LABELS[name]} in this backup is damaged.`);
   // A file that was already unreadable when the backup was made is restored as it was (the app then offers its
   // recovery), so it never blocks restoring everything else.
   let unreadable=false;try{this.validators[name](f.text);}catch{unreadable=true;}
   contents.push({name,label:LABELS[name]+(unreadable?' (unreadable, restored as it was)':''),size:f.size,unreadable});
  }
  return {bundle:b,createdAt:b.createdAt,appVersion:String(b.app?.version||'').slice(0,40),contents};
 }
 readFile(file){return this.read(fs.readFileSync(file,'utf8'));}
 // Replace all data with the backup's. A safety backup of the current data is written first; files the backup lacks are removed.
 // Every new file is written in full first, then a journal lists them, then they are swapped in. If Telemetry is stopped
 // during the swap (killed, power loss, a locked file), the journal lets the next start finish it: never a mix of old and new.
 restore(checked){
  const safety=this.write(this.dir,'before-restore','before restore'),names=Object.keys(this.validators),temps=new Map();
  try{for(const name of names){const f=checked.bundle.files[name];if(f)temps.set(name,writeTemp(path.join(this.profile,name),f.text));}
   atomicWrite(journalFile(this.profile),JSON.stringify({version:1,safety:path.basename(safety.file),files:Object.fromEntries(names.map(n=>[n,temps.has(n)?path.basename(temps.get(n)):null]))}));}
  catch(e){for(const t of temps.values())try{fs.unlinkSync(t);}catch{}throw Error('Nothing was restored: '+e.message);}
  try{finishRestore(this.profile);}
  catch(e){const error=Error(`The restore stopped part-way (${e.message}). Telemetry restarts and finishes it; your previous data is in the backup ${path.basename(safety.file)}.`);error.partial=true;error.safety=safety.file;throw error;}
  finally{this.settings.lastHash=null;this.saveSettings();}
  return {safety:safety.file};
 }
}
const JOURNAL='restore-in-progress.json';
const journalFile=profile=>path.join(profile,JOURNAL);
// Completes a restore that was stopped during its swap. Safe to run again at any point: a file already swapped in
// has no temporary file left. Returns true when there was one to finish.
function finishRestore(profile){
 const file=journalFile(profile);let j;
 try{j=json(fs.readFileSync(file,'utf8'));}catch(e){if(e.code==='ENOENT')return false;fs.rmSync(file,{force:true});return false;}
 const known=new Set(Object.keys(LABELS));
 if(j?.version!==1||!j.files||typeof j.files!=='object'){fs.rmSync(file,{force:true});return false;}
 for(const [name,temp] of Object.entries(j.files)){
  if(!known.has(name)||temp!==null&&(typeof temp!=='string'||path.basename(temp)!==temp||!temp.startsWith(name+'.')||!temp.endsWith('.tmp')))continue;
  const target=path.join(profile,name);
  if(temp===null)fs.rmSync(target,{force:true});else if(fs.existsSync(path.join(profile,temp)))renameRetry(path.join(profile,temp),target);
 }
 fs.rmSync(file,{force:true});return true;
}
// At start, before any store opens its file: finish an interrupted restore, then clear leftovers of interrupted saves.
function recover(profile){let finished=false;try{finished=finishRestore(profile);}catch{/* Left for the next start; the safety backup holds the old data. */}if(!fs.existsSync(journalFile(profile)))sweepTemps(profile);return {finished};}
module.exports={Backups,knownFiles,finishRestore,recover,LABELS,FORMAT,KEEP,JOURNAL};
