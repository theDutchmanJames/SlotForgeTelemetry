const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),model=require('../renderer/manual-laps-model.js');
const MAX_BYTES=50*1024*1024,MAX_SESSIONS=1000,id=x=>typeof x==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(x),hash=value=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
function readBackup(input){if(typeof input!=='string'||Buffer.byteLength(input)>MAX_BYTES)throw Error('Choose a manual lap backup smaller than 50 MiB.');return validate(JSON.parse(input));}
function validate(data){
 if(data?.format!=='slotforge-manual-laps'||data.version!==1||!id(data.id)||!Array.isArray(data.sessions)||data.sessions.length>MAX_SESSIONS)throw Error('Invalid manual lap library.');
 const names=s=>s.normalize('NFKC').trim().toLowerCase(),identities={car:new Map(),track:new Map()};const seen=new Set();const sessions=data.sessions.map(r=>{
  if(!r||!id(r.id)||seen.has(r.id)||!id(r.carId)||!id(r.trackId)||!Number.isSafeInteger(r.revision)||r.revision<1||!Number.isFinite(Date.parse(r.createdAt))||!Number.isFinite(Date.parse(r.updatedAt)))throw Error('Invalid or duplicate manual session.');seen.add(r.id);
  const values=model.normalize(r.values);for(const key of ['car','track']){const previous=identities[key].get(r[key+'Id']);if(previous&&previous!==names(values[key]))throw Error('Conflicting car or track identities.');identities[key].set(r[key+'Id'],names(values[key]));}if(r.contentHash!==hash(values))throw Error('Manual session content check failed.');return {id:r.id,carId:r.carId,trackId:r.trackId,revision:r.revision,createdAt:r.createdAt,updatedAt:r.updatedAt,contentHash:r.contentHash,values};
 });return {format:'slotforge-manual-laps',version:1,id:data.id,sessions};
}
class ManualLapsStore{
 constructor(file){this.file=file;this.error='';this.data={format:'slotforge-manual-laps',version:1,id:crypto.randomUUID(),sessions:[]};try{if(fs.existsSync(file)){if(fs.statSync(file).size>MAX_BYTES)throw Error('Too large');this.data=validate(JSON.parse(fs.readFileSync(file,'utf8')));}}catch{this.error='The manual lap library is unreadable and has been preserved. Export it for recovery; no manual sessions will be overwritten.';}}
 view(){return {data:this.data,error:this.error};}
 persist(next){if(this.error)throw Error(this.error);next=validate(next);const json=JSON.stringify(next);if(Buffer.byteLength(json)>MAX_BYTES)throw Error('Manual library exceeds 50 MiB.');if(next.sessions.length>MAX_SESSIONS)throw Error('Manual library limit is 1,000 sessions.');fs.mkdirSync(path.dirname(this.file),{recursive:true});const temp=this.file+'.'+crypto.randomUUID()+'.tmp';let fd;try{fd=fs.openSync(temp,'wx');fs.writeFileSync(fd,json);fs.fsyncSync(fd);fs.closeSync(fd);fd=undefined;fs.renameSync(temp,this.file);}catch(e){if(fd!==undefined)fs.closeSync(fd);try{fs.unlinkSync(temp);}catch{}throw Error('Could not save manual laps. Existing data is unchanged. '+e.message);}this.data=next;return this.view();}
 save(input){
  if(this.error)throw Error(this.error);const old=input?.id?this.data.sessions.find(r=>r.id===input.id):null;if(input?.id&&(!old||old.revision!==input.revision))throw Error('This session changed or was deleted. Reopen it before saving.');
  const values=model.normalize(input?.values),now=new Date().toISOString(),canonical=s=>s.normalize('NFKC').trim().toLowerCase();
  const identity=key=>this.data.sessions.find(r=>canonical(r.values[key])===canonical(values[key]))?.[key+'Id']||crypto.randomUUID();
  const record={id:old?.id||crypto.randomUUID(),carId:identity('car'),trackId:identity('track'),revision:(old?.revision||0)+1,createdAt:old?.createdAt||now,updatedAt:now,contentHash:hash(values),values};
  const result=this.persist({...this.data,sessions:[...this.data.sessions.filter(r=>r.id!==record.id),record]});return {...result,savedId:record.id};
 }
 delete(input){const record=this.data.sessions.find(r=>r.id===input?.id);if(!record||record.revision!==input.revision)throw Error('This session changed or was deleted. Reopen it before deleting.');return this.persist({...this.data,sessions:this.data.sessions.filter(r=>r.id!==record.id)});}
 importBackup(input){
  const incoming=readBackup(input),next=[...this.data.sessions];let added=0;
  for(const record of incoming.sessions){const old=next.find(r=>r.id===record.id);if(old){if(old.contentHash!==record.contentHash||old.revision!==record.revision||old.createdAt!==record.createdAt||old.updatedAt!==record.updatedAt)throw Error('The backup contains a different revision of an existing session. Nothing was imported.');continue;}next.push(record);added++;}
  // Reuse local name identities; allocate fresh identities for new imported names.
  const names=s=>s.normalize('NFKC').trim().toLowerCase();for(const key of ['car','track']){const ids=new Map();for(const r of next){const name=names(r.values[key]);if(!ids.has(name))ids.set(name,this.data.sessions.some(v=>v.id===r.id)?r[key+'Id']:crypto.randomUUID());}for(let i=0;i<next.length;i++)next[i]={...next[i],[key+'Id']:ids.get(names(next[i].values[key]))};}
  return {...this.persist({...this.data,sessions:next}),added};
 }
 recoverBackup(input){
  if(!this.error)throw Error('The library is readable. Use Restore backup to merge sessions.');
  const next=readBackup(input),backup=this.file+'.unreadable-'+crypto.randomUUID();
  // Keep the damaged original even if writing the replacement fails.
  fs.copyFileSync(this.file,backup,fs.constants.COPYFILE_EXCL);const previousError=this.error;this.error='';
  try{return {...this.persist(next),backup};}catch(error){this.error=previousError;throw error;}
 }
}
module.exports={ManualLapsStore,validate,readBackup};
