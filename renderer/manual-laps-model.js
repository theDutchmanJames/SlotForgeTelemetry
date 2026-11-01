(function(root){
 const MAX_LAPS=10000,MAX_TEXT=1024*1024;
 function check(ok,message){if(!ok)throw Error(message);}
 function text(value,name,max=200,required=true){check(typeof value==='string'&&value.length<=max,`${name} must be text of at most ${max} characters.`);const result=value.trim();check(!required||result,`Enter ${name.toLowerCase()}.`);return result;}
 function duration(value,unit='seconds'){
  const s=String(value).trim();let ms;
  if(unit==='milliseconds'){check(/^\d+$/.test(s),'Use whole milliseconds, for example 10235.');ms=Number(s);}
  else{check(unit==='seconds','Choose seconds or milliseconds.');const match=/^(?:(\d+):)?(\d+)(?:[.,](\d{1,3}))?$/.exec(s);check(match,'Use seconds (10.235) or minutes:seconds (1:02.345), with at most three decimals.');check(!match[1]||Number(match[2])<60,'Seconds after a colon must be below 60.');ms=(Number(match[1]||0)*60+Number(match[2]))*1000+Number((match[3]||'').padEnd(3,'0'));}
  check(Number.isSafeInteger(ms)&&ms>0&&ms<=86400000,'A lap must be greater than zero and at most 24 hours.');return ms;
 }
 function parse(raw,{unit='seconds',format='times'}={}){
  check(typeof raw==='string'&&raw.length<=MAX_TEXT,'Paste no more than 1 MiB of lap text.');check(['times','numbered'].includes(format),'Choose a supported column format.');
  const laps=[];let previous=0,total=0;
  for(const [index,line]of raw.replace(/^\uFEFF/,'').split(/\r?\n/).entries()){
   const s=line.trim();if(!s)continue;
   try{let number=laps.length+1,value=s;
    if(format==='numbered'){const columns=s.split(/[\t;]/).map(v=>v.trim());if(!laps.length&&columns.length===2&&/^lap(?: number)?$/i.test(columns[0])&&/^(?:time|lap time)$/i.test(columns[1]))continue;check(columns.length===2,'Use two columns separated by a tab or semicolon: lap number;time.');check(/^\d+$/.test(columns[0]),'Lap numbers must be positive whole numbers.');number=Number(columns[0]);value=columns[1];}
    else if(!laps.length&&/^(?:time|lap time)$/i.test(s))continue;
    check(Number.isSafeInteger(number)&&number>previous&&number<=1000000,'Lap numbers must increase, without duplicates (maximum 1,000,000).');
    const durationMs=duration(value,unit);total+=durationMs;check(total<=604800000,'The sum of lap durations cannot exceed seven days.');check(laps.length<MAX_LAPS,'Maximum 10,000 laps per manual session.');
    laps.push({number,durationMs,valid:true,pit:false});previous=number;
   }catch(error){throw Error(`Line ${index+1}: ${error.message}`);}
  }
  check(laps.length>0,'Enter at least one lap time.');return laps;
 }
 function normalize(input){
  check(input&&typeof input==='object','Enter a manual session.');
  const startedAt=text(input.startedAt,'Session date',24);check(Number.isFinite(Date.parse(startedAt))&&new Date(startedAt).toISOString()===startedAt,'Choose a valid session date and time.');
  check(['practice','qualifying','race','endurance'].includes(input.type),'Choose a session type.');check(Number.isInteger(input.lane)&&input.lane>=1&&input.lane<=64,'Lane must be between 1 and 64.');
  check(input.lengthM===null||Number.isFinite(input.lengthM)&&input.lengthM>0&&input.lengthM<=100000,'Track lane length must be positive, or left blank.');check(typeof input.sequenceConfirmed==='boolean','Specify whether the lap sequence is confirmed.');
  check(Array.isArray(input.laps)&&input.laps.length>0&&input.laps.length<=MAX_LAPS,'Enter between 1 and 10,000 laps.');
  let previous=0,total=0;const laps=input.laps.map(l=>{check(l&&Number.isSafeInteger(l.number)&&l.number>previous&&l.number<=1000000,'Lap numbers must increase without duplicates.');check(Number.isSafeInteger(l.durationMs)&&l.durationMs>0&&l.durationMs<=86400000,'Invalid lap duration.');check(typeof l.valid==='boolean'&&typeof l.pit==='boolean','Invalid lap inclusion flags.');total+=l.durationMs;previous=l.number;return {number:l.number,durationMs:l.durationMs,valid:l.valid,pit:l.pit};});check(total<=604800000,'Total lap duration cannot exceed seven days.');
  const technical={};for(const key of ['pinion','gear','rearDiameter','weight','ratedRpm']){const value=input.technical?.[key]??'';technical[key]=text(value,key,100,false);if(technical[key]){const n=Number(technical[key]);check(/^(?:\d+(?:\.\d+)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(technical[key])&&Number.isFinite(n)&&n>0,`${key} must be a positive number, or left blank.`);if(key==='pinion'||key==='gear')check(Number.isInteger(n)&&n<=999999,`${key} must be a whole tooth count from 1 to 999999.`);}}
  return {name:text(input.name,'Session name'),car:text(input.car,'Car name'),track:text(input.track,'Track name'),driver:text(input.driver||'Unknown driver','Driver'),source:text(input.source||'Manual entry','Data source'),notes:text(input.notes||'','Notes',2000,false),startedAt,type:input.type,lane:input.lane,lengthM:input.lengthM,sequenceConfirmed:input.sequenceConfirmed,technical,laps};
 }
 function runs(library){
  return (library?.sessions||[]).map(record=>{
   const v=record.values,id=JSON.stringify(['manual',library.id,record.id]);let elapsed=0;
   const laps=v.laps.map((l,i)=>({...l,id:'lap-'+i,stintId:'entered',heatId:'entered',endedAtMs:elapsed+=l.durationMs,recordEligible:l.valid&&!l.pit,reason:l.pit?'Marked as pit by user':l.valid?'':'Excluded by user',sequenceKnown:v.sequenceConfirmed}));
   return {id,entryKind:'manual',manualId:record.id,hostId:'manual-'+library.id,hostName:'Manual lap library',sourceId:'manual',sourceName:v.source,sessionId:record.id,sessionName:v.name,participantId:'entered',carId:record.carId,car:v.car,trackId:record.trackId,track:v.track,lane:v.lane,laneLengthM:v.lengthM,driverId:'entered',driver:v.driver,type:v.type,startedAt:v.startedAt,syncedAt:record.updatedAt,revision:record.revision,contentHash:record.contentHash,sequenceConfirmed:v.sequenceConfirmed,notes:v.notes,configuration:{capturedAt:record.updatedAt,technical:v.technical,components:[]},adjustments:[],standing:null,stints:[{id:'entered',heatId:'entered',heatName:'Entered sequence',startedAtMs:0,endedAtMs:elapsed}],laps};
  }).sort((a,b)=>b.startedAt.localeCompare(a.startedAt));
 }
 const api={parse,duration,normalize,runs,MAX_LAPS};if(typeof module==='object'&&module.exports)module.exports=api;else root.ManualLapsModel=api;
})(typeof globalThis!=='undefined'?globalThis:this);
