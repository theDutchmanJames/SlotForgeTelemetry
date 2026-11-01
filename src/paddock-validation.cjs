// Adapted from Paddock 96e215d; see SOURCE-NOTICES.txt. No writes or signature verification.
const contract=require('./paddock-schema.cjs'),results=require('./paddock-statistics.cjs');
const MAX_BYTES=8*1024*1024,MAX_LAPS=50000;
function fault(code,message,status=400){const e=Error(message);e.apiCode=code;e.httpStatus=status;return e;}
function check(ok,message){if(!ok)throw fault('INVALID_PAYLOAD',message);}
function unique(rows,key,label){const map=new Map();for(const row of rows){check(!map.has(row[key]),'Duplicate '+label+': '+row[key]);map.set(row[key],row);}return map;}
function validatePayload(payload,{stored=false}={}){
  if(payload?.integrationVersion!==1)throw fault('UNSUPPORTED_VERSION','Supported Timing integration versions: 1.',422);
  contract.validate(payload,contract.schema.$defs[payload.state==='withdrawn'?'withdrawal':'active']);
  check(Buffer.byteLength(JSON.stringify(payload))<=MAX_BYTES,'Session exceeds the 8 MiB limit.');
  if(payload.state==='withdrawn')return;
  const duration=Date.parse(payload.endedAt)-Date.parse(payload.startedAt);
  check(duration>=0&&duration<=604800000,'Session must last between zero and seven days.');
  const lanes=unique(payload.track.lanes,'lane','track lane'),heats=unique(payload.heats,'id','heat'),participants=unique(payload.participants,'id','participant');
  for(const h of heats.values())check(h.startedAtMs<=h.endedAtMs&&h.endedAtMs<=duration,'Heat times fall outside the session.');
  let lapCount=0;const cars=new Set(),lapIds=new Set();
  for(const p of participants.values()){
    check((p.carId===null)===(p.configuration===null),'Car identity and configuration must both be present or both be null.');
    check(p.kind!=='virtual'||p.carId===null,'Virtual participants must not reference physical cars.');
    if(p.carId){check(!cars.has(p.carId),'A physical car must use one participant across all heats and driver changes.');cars.add(p.carId);}
    const drivers=unique(p.drivers,'id','driver'),stints=unique(p.stints,'id','stint'),sequences=new Set(),lastLap=new Map();
    let previousEnd=-1,previousLapEnd=-1;
    for(const s of [...stints.values()].sort((a,b)=>a.startedAtMs-b.startedAtMs)){
      const h=heats.get(s.heatId);check(h&&drivers.has(s.driverId)&&lanes.has(s.lane),'Unknown heat, driver or lane in stint.');
      check(s.startedAtMs<=s.endedAtMs&&s.startedAtMs>=h.startedAtMs&&s.endedAtMs<=h.endedAtMs,'Stint times fall outside its heat.');
      check(s.startedAtMs>=previousEnd,'A participant cannot drive overlapping stints.');previousEnd=s.endedAtMs;
    }
    lapCount+=p.laps.length;check(lapCount<=MAX_LAPS,'Maximum 50,000 laps per session.');
    for(const l of [...p.laps].sort((a,b)=>a.endedAtMs-b.endedAtMs)){
      const s=stints.get(l.stintId);check(s,'Unknown lap stint.');
      check(!lapIds.has(l.id),'Duplicate lap ID.');lapIds.add(l.id);
      const sequence=s.heatId+':'+l.number;check(!sequences.has(sequence),'Duplicate lap number for participant and heat.');sequences.add(sequence);
      check(l.endedAtMs>=s.startedAtMs&&l.endedAtMs<=s.endedAtMs&&l.durationMs<=l.endedAtMs-heats.get(s.heatId).startedAtMs,'Lap times fall outside the heat/stint.');
      if(!stored)check(l.endedAtMs-l.durationMs>=previousLapEnd,'Overlapping measured laps for one participant, including across heats.');previousLapEnd=l.endedAtMs;
      const last=lastLap.get(s.heatId);check(!last||l.number>last.number&&l.endedAtMs-l.durationMs>=last.endedAtMs,'Overlapping or out-of-order measured laps.');lastLap.set(s.heatId,l);
      check(!l.recordEligible||l.valid&&!l.pit,'Invalid and pit laps cannot be record eligible.');
    }
  }
  unique(payload.standings,'participantId','standing');
  for(const s of payload.standings){check(participants.has(s.participantId),'Unknown participant in final standings.');check(s.status==='finished'||s.position!==1,'Only a finished participant can be the winner.');}
  for(const a of payload.adjustments)check(participants.has(a.participantId),'Unknown adjustment participant.');
  // Previously accepted cross-heat overlaps remain readable, but are quarantined
  // by the derived-statistics model until Timing sends a valid higher revision.
  if(!(stored&&results.requiresCorrection(payload)))for(const p of participants.values())if(p.summary){const expected=results.statistics(payload,p,true);for(const key of Object.keys(expected))if(typeof expected[key]==='number'&&typeof p.summary[key]==='number'?Math.abs(expected[key]-p.summary[key])>0.000001:expected[key]!==p.summary[key])throw fault('SUMMARY_MISMATCH','Participant '+p.id+' summary disagrees with measured laps: '+key);}
}

module.exports={validatePayload};
