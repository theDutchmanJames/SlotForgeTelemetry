'use strict';
// Maps verified shared-history sessions into the timing-v1-shaped payload the analysis screens use.
// Nothing is invented: unknown history-v1 values stay unknown and such laps never count towards pace or records.
const ID=/^[A-Za-z0-9_-]{1,100}$/;
const fail=m=>{throw Error('Unsupported history-v1 session: '+m+'.');};
const str=(v,max,nullable=false)=>(nullable&&v===null)||(typeof v==='string'&&v.length<=max);
const num=(v,max,nullable=false)=>(nullable&&v===null)||(typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=max);
const int=(v,max,nullable=false)=>(nullable&&v===null)||(Number.isSafeInteger(v)&&v>=0&&v<=max);
const bool=(v,nullable=false)=>(nullable&&v===null)||typeof v==='boolean';
const id=(v,nullable=false)=>(nullable&&v===null)||(typeof v==='string'&&ID.test(v));
const list=(v,max)=>Array.isArray(v)&&v.length<=max;
const object=v=>v&&typeof v==='object'&&!Array.isArray(v);
function checkTechnical(t){if(!object(t)||Object.keys(t).length>100||Object.entries(t).some(([k,v])=>k.length>100||!str(v,20000)))fail('technical specification');}
// Structural checks for every field Telemetry reads. Paddock validated the full schema on acceptance,
// and the content hash proves this is that accepted bundle; this guards the renderer against surprises.
function checkBundle(b){
 if(!object(b)||b.format!=='history-v1'||!object(b.provenance)||!['measured','historical'].includes(b.provenance.kind)||!str(b.provenance.evidence,2000)||!list(b.provenance.missing,7))fail('provenance');
 const r=b.race,c=b.context;if(!object(r)||!object(c))fail('race');
 if(!str(r.name,200)||!['practice','qualifying','race','endurance'].includes(r.type)||!str(r.startedAt,40,true)||!str(r.endedAt,40,true))fail('race details');
 if(!object(r.track)||!id(r.track.id,true)||!str(r.track.name,200)||!list(r.track.lanes,64)||r.track.lanes.some(l=>!int(l?.lane,64)||!num(l.lengthM,100000,true)))fail('track');
 if(!list(r.heats,1000)||r.heats.some(h=>!id(h?.id)||!str(h.name,200)))fail('heats');
 if(!list(r.participants,256))fail('participants');
 for(const p of r.participants){
  if(!object(p)||!id(p.id)||!['physical','virtual'].includes(p.kind)||!id(p.carId,true)||!str(p.displayName,200)||!list(p.drivers,100)||!list(p.stints,2000)||!list(p.laps,50000))fail('participant');
  if(p.drivers.some(d=>!id(d?.id)||!str(d.name,200)))fail('drivers');
  if(p.stints.some(s=>!id(s?.id)||!id(s.heatId)||!id(s.driverId)||!int(s.lane,64)||!num(s.startedAtMs,604800000,true)||!num(s.endedAtMs,604800000,true)))fail('stints');
  if(p.configuration!==null){if(!object(p.configuration))fail('configuration');checkTechnical(p.configuration.technical);if(p.configuration.components!==undefined&&(!list(p.configuration.components,1000)||p.configuration.components.some(x=>!object(x)||!str(x.name,200)||!str(x.field,100)||!str(x.position,160)||!int(x.quantity,1000000))))fail('components');}
  for(const l of p.laps)if(!object(l)||!id(l.id)||!id(l.stintId,true)||!id(l.heatId,true)||!id(l.driverId,true)||!int(l.lane,64,true)||!int(l.number,1000000)||!num(l.durationMs,86400000,true)||!num(l.endedAtMs,604800000,true)||!bool(l.valid,true)||!bool(l.pit,true)||!bool(l.personalRecordEligible,true)||!bool(l.trackRecordEligible,true)||!bool(l.countsForDistance)||!num(l.distanceM,100000,true)||!str(l.reason,500)||!list(l.flags,4))fail('lap');
 }
 if(!str(c.savedAt,40,true)||!str(c.notes,4000)||!list(c.classes,256)||!list(c.teams,256)||!list(c.classification,10000))fail('context');
 for(const x of c.classification)if(!object(x)||!id(x.participantId)||!['overall','class','heat','final','championship-award'].includes(x.scope)||!int(x.position,1000,true)||!str(x.status,20)||!num(x.laps,1000000,true)||!num(x.elapsedMs,604800000,true)||!num(x.points,1000000,true)||!list(x.effects,2000)||x.effects.some(e=>!object(e)||!['time','laps','points','other'].includes(e.kind)||typeof e.amount!=='number'||!str(e.reason,2000)))fail('classification');
 return b;
}
// history-v1 → timing-v1-shaped payload for RaceModel.
function project(e,databaseId){
 const b=e.body,r=b.race,c=b.context,overall=c.classification.filter(x=>x.scope==='overall');
 const participants=r.participants.map(p=>{
  const stints=[...p.stints],drivers=[...p.drivers],known=new Set(stints.map(s=>s.id));
  const laps=p.laps.map(l=>{
   let stintId=l.stintId;
   // Historical laps may lack a stint: group them by the lane/driver/heat recorded on the lap itself.
   if(!stintId||!known.has(stintId)){
    stintId='unassigned-'+[l.heatId||'h',l.lane??'x',l.driverId||'d'].join('-').replace(/[^A-Za-z0-9_-]/g,'');
    if(!known.has(stintId)){known.add(stintId);stints.push({id:stintId,heatId:l.heatId||'unknown-heat',driverId:l.driverId||'unknown-driver',lane:l.lane??0,startedAtMs:null,endedAtMs:null});}
    if(!l.driverId&&!drivers.some(d=>d.id==='unknown-driver'))drivers.push({id:'unknown-driver',name:'Unknown driver'});
   }
   const timed=Number.isFinite(l.durationMs);
   return {id:l.id,stintId,number:l.number,durationMs:timed?l.durationMs:null,endedAtMs:Number.isFinite(l.endedAtMs)?l.endedAtMs:null,
    valid:l.valid===true&&timed,pit:l.pit===true,recordEligible:l.personalRecordEligible===true,trackRecordEligible:l.trackRecordEligible===true,
    countsForDistance:l.countsForDistance,distanceM:l.distanceM,reason:timed?l.reason:(l.reason||'Lap time not recorded'),
    ...(Number.isFinite(l.endedAtMs)?{}:{sequenceKnown:false}),flags:l.flags};
  });
  return {id:p.id,kind:p.kind,carId:p.carId,configuration:p.configuration,displayName:p.displayName,drivers,stints,laps};
 });
 return {integrationVersion:1,databaseId,source:{id:e.sourceId,name:'SlotForge Timing',application:'SlotForge Timing'},sessionId:e.sessionId,revision:e.accepted.revision,state:'active',
  name:r.name,type:r.type,startedAt:r.startedAt||c.savedAt||'',endedAt:r.endedAt||'',dateUnknown:!r.startedAt,track:{id:r.track.id,name:r.track.name,lanes:r.track.lanes},
  heats:r.heats.map(h=>({id:h.id,name:h.name,startedAtMs:h.startedAtMs,endedAtMs:h.endedAtMs})),participants,
  standings:overall.map(x=>({participantId:x.participantId,position:x.position,status:x.status,classifiedLaps:x.laps,classifiedElapsedMs:x.elapsedMs,points:x.points})),
  adjustments:overall.flatMap(x=>x.effects.map(v=>({participantId:x.participantId,kind:v.kind,amount:v.amount,reason:v.reason}))),
  notes:c.notes,format:'history-v1',provenance:b.provenance.kind,classes:c.classes};
}
// One cache entry → the {payload,receipt} result shape RaceModel.runs expects.
function result(e,databaseId){
 if(e.accepted.state==='withdrawn'||e.body===null)return {payload:{databaseId,source:{id:e.sourceId},sessionId:e.sessionId,revision:e.accepted.revision,state:'withdrawn'},receipt:null,format:e.format};
 if(e.format==='timing-v1')return {payload:e.body,receipt:{contentHash:e.accepted.contentHash,warnings:[],summaries:[]},format:'timing-v1'};
 return {payload:project(e,databaseId),receipt:{contentHash:e.accepted.contentHash,warnings:[],summaries:[]},format:'history-v1'};
}
module.exports={checkBundle,project,result};
