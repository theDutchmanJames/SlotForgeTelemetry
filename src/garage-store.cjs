'use strict';
// Telemetry's own garage: cars that are not in Paddock, and tracks with their lanes.
// Paddock remains the owner of its cars; those are cached separately by paddock-local.cjs.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const ID=/^[A-Za-z0-9_-]{1,100}$/,MAX_CARS=500,MAX_TRACKS=200,MAX_BYTES=4*1024*1024;
function check(ok,message){if(!ok)throw Error(message);}
function text(v,name,max,required=true){check(typeof v==='string'&&v.length<=max,`${name} must be text of at most ${max} characters.`);const s=v.trim();check(!required||s,`Enter a ${name.toLowerCase()}.`);return s;}
const key=s=>s.trim().toLowerCase();
function car(input){
 check(input&&typeof input==='object','Enter a car.');
 return {name:text(input.name,'Car name',200),maker:text(input.maker??'','Maker',200,false),raceClass:text(input.raceClass??'','Class',100,false),notes:text(input.notes??'','Notes',2000,false)};
}
function track(input){
 check(input&&typeof input==='object','Enter a track.');
 check(Array.isArray(input.lanes)&&input.lanes.length>=1&&input.lanes.length<=64,'A track needs 1 to 64 lanes.');
 const seen=new Set(),lanes=input.lanes.map(l=>{check(Number.isInteger(l?.lane)&&l.lane>=1&&l.lane<=64&&!seen.has(l.lane),'Lanes must be distinct numbers from 1 to 64.');seen.add(l.lane);check(l.lengthM===null||Number.isFinite(l.lengthM)&&l.lengthM>0&&l.lengthM<=100000,'Lane length must be positive metres, or left blank.');return {lane:l.lane,lengthM:l.lengthM};}).sort((a,b)=>a.lane-b.lane);
 return {name:text(input.name,'Track name',200),lanes,notes:text(input.notes??'','Notes',2000,false)};
}
function validate(data){
 check(data?.version===1&&Array.isArray(data.cars)&&Array.isArray(data.tracks),'Invalid garage file.');
 check(data.cars.length<=MAX_CARS&&data.tracks.length<=MAX_TRACKS,'Garage limit reached.');
 for(const [list,clean,label] of [[data.cars,car,'car'],[data.tracks,track,'track']]){
  const ids=new Set(),names=new Set();
  for(const r of list){check(ID.test(r?.id)&&!ids.has(r.id)&&Number.isFinite(Date.parse(r.createdAt))&&Number.isFinite(Date.parse(r.updatedAt)),'Invalid '+label+' record.');ids.add(r.id);
   const v=clean(r);check(!names.has(key(v.name)),'Two '+label+'s share the name “'+v.name+'”.');names.add(key(v.name));Object.assign(r,v);}
 }
 return data;
}
class GarageStore{
 constructor(file){this.file=file;this.data={version:1,cars:[],tracks:[]};this.error='';
  try{if(fs.existsSync(file)){check(fs.statSync(file).size<=MAX_BYTES,'Garage file too large.');this.data=validate(JSON.parse(fs.readFileSync(file,'utf8')));}}
  catch{this.error='The garage file could not be read. It is kept untouched; export it before choosing Reset garage.';}
 }
 view(){return {data:this.data,error:this.error};}
 upsert(kind,input,clean){
  check(!this.error,this.error);const value=clean(input),now=new Date().toISOString(),list=this.data[kind],old=input.id?list.find(r=>r.id===input.id):null;
  check(!input.id||old,'This entry was removed. Reopen the garage.');
  check(!list.some(r=>r.id!==old?.id&&key(r.name)===key(value.name)),`“${value.name}” already exists.`);
  const record={id:old?.id||crypto.randomUUID(),createdAt:old?.createdAt||now,updatedAt:now,...value};
  this.persist({...this.data,[kind]:[...list.filter(r=>r.id!==record.id),record].sort((a,b)=>a.name.localeCompare(b.name))});
  return {...this.view(),savedId:record.id};
 }
 saveCar(input){return this.upsert('cars',input,car);}
 saveTrack(input){return this.upsert('tracks',input,track);}
 remove(kind,id){check(!this.error,this.error);check(['cars','tracks'].includes(kind)&&this.data[kind].some(r=>r.id===id),'Entry not found.');this.persist({...this.data,[kind]:this.data[kind].filter(r=>r.id!==id)});return this.view();}
 reset(){const backup=this.file+'.unreadable-'+Date.now();if(fs.existsSync(this.file))fs.renameSync(this.file,backup);this.data={version:1,cars:[],tracks:[]};this.error='';return {...this.view(),backup};}
 persist(next){
  validate(structuredClone(next));const text=JSON.stringify(next);check(Buffer.byteLength(text)<=MAX_BYTES,'Garage file too large.');
  fs.mkdirSync(path.dirname(this.file),{recursive:true});const temp=this.file+'.'+crypto.randomUUID()+'.tmp';let fd;
  try{fd=fs.openSync(temp,'wx');fs.writeFileSync(fd,text);fs.fsyncSync(fd);fs.closeSync(fd);fd=undefined;fs.renameSync(temp,this.file);}
  catch(e){if(fd!==undefined)fs.closeSync(fd);try{fs.unlinkSync(temp);}catch{}throw Error('Could not save the garage. Nothing was changed. '+e.message);}
  this.data=next;
 }
}
module.exports={GarageStore,validate,car,track};
