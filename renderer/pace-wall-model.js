// The Laps page (Pace Wall): every run of one car on one track and lane, its record, the pace now, what was gained,
// and which setup change moved the pace. Pure functions over the runs RaceModel and ManualLapsModel build; nothing is stored.
(function(root){
 const RM=root.RaceModel||(typeof require==='function'?require('./race-model.js'):null);
 const norm=s=>String(s??'').trim().replace(/\s+/g,' ').toLowerCase();
 // A line is what lap times can be compared on: the same car, track and lane. Paddock races and typed-in runs share it.
 const carKey=run=>norm(run.car);
 const lineKey=run=>JSON.stringify([carKey(run),norm(run.track),Number(run.lane)||0]);
 const eligible=lap=>lap.valid&&!lap.pit&&!!(lap.trackRecordEligible??lap.recordEligible);
 const LABELS={pinion:'pinion',gear:'gear',rearDiameter:'rear tyre',rearTyreDiameter:'rear tyre',weight:'weight',totalWeight:'weight',ratedRpm:'motor',motor:'motor'};
 const UNITS={rearDiameter:' mm',rearTyreDiameter:' mm',weight:' g',totalWeight:' g'};
 function cars(runs){
  const map=new Map();
  for(const run of runs){const k=carKey(run);if(!map.has(k))map.set(k,{key:k,name:run.car,runs:0,lines:new Set(),latest:run.startedAt});const c=map.get(k);c.runs++;c.lines.add(lineKey(run));if(run.startedAt>c.latest){c.latest=run.startedAt;c.name=run.car;}}
  return [...map.values()].map(c=>({...c,lines:c.lines.size})).sort((a,b)=>b.latest.localeCompare(a.latest)||a.name.localeCompare(b.name));
 }
 function lines(runs,car){
  const map=new Map();
  for(const run of runs){if(car&&carKey(run)!==car)continue;const k=lineKey(run);if(!map.has(k))map.set(k,{key:k,car:run.car,track:run.track,lane:run.lane,runs:[]});map.get(k).runs.push(run);}
  for(const l of map.values())l.runs.sort((a,b)=>b.startedAt.localeCompare(a.startedAt)||a.id.localeCompare(b.id));
  return [...map.values()].sort((a,b)=>b.runs[0].startedAt.localeCompare(a.runs[0].startedAt)||a.track.localeCompare(b.track)||a.lane-b.lane);
 }
 // What changed between a run and the one before it, from the specifications each run carries.
 function changes(before,after){
  if(!before||!after)return [];
  const seen=new Set();
  return RM.configurationChanges(before,after).technical.filter(c=>c.before&&c.after).map(c=>{const name=LABELS[c.field]||c.field,unit=UNITS[c.field]||'';return {field:c.field,label:`${name} ${c.before}${unit} → ${c.after}${unit}`,name,before:c.before,after:c.after,unit:unit.trim()};}).filter(c=>!seen.has(c.name)&&seen.add(c.name));
 }
 const medianOf=laps=>RM.quantile(laps.filter(l=>l.valid&&!l.pit).map(l=>l.durationMs),.5);
 // The scoreboard of a line. Runs are newest first.
 function summary(line,stats=RM.statistics){
  const runs=line.runs;let record=null;
  for(const run of runs)for(const lap of run.laps)if(eligible(lap)&&(!record||lap.durationMs<record.lap.durationMs))record={lap,run};
  const last=runs.slice(0,3),paceNow=medianOf(last.flatMap(r=>r.laps));
  const first=stats(runs.at(-1)),latest=stats(runs[0]),previous=runs[1]?stats(runs[1]):null;
  const gained=runs.length>1&&first.median!==null&&latest.median!==null?latest.median-first.median:null;
  return {record,paceNow,paceRuns:last.length,gained,since:runs.length>1?runs.at(-1):null,spread:latest.spread,previousSpread:previous?.spread??null};
 }
 // Every setup change on the line with the typical lap before and after it, oldest first.
 function ledger(line,stats=RM.statistics){
  const out=[],runs=[...line.runs].reverse();
  for(let i=1;i<runs.length;i++){const list=changes(runs[i-1],runs[i]);if(!list.length)continue;const a=stats(runs[i-1]).median,b=stats(runs[i]).median;out.push({run:runs[i],before:runs[i-1],changes:list,from:a,to:b,delta:a!==null&&b!==null?b-a:null});}
  return out;
 }
 // How a lap reads on the wall: 0 at the reference, 1 at the end of the scale. The scale is 6% of the reference lap
 // (0.6 s on a 10 s lap) so short and long tracks read alike.
 function shade(ms,reference){if(!Number.isFinite(ms)||!Number.isFinite(reference)||reference<=0)return null;return Math.max(0,Math.min(1,(ms-reference)/(reference*.06)));}
 const scaleMs=reference=>reference*.06;
 // Tags: what kind of run it was. Chosen by you, or read from the session.
 const TAGS={practice:'Practice',test:'Test',club:'Club night',qualifying:'Qualifying',race:'Race',endurance:'Endurance'};
 function defaultTag(run){return run.entryKind==='manual'&&/track day/i.test(run.sourceName||'')?'test':TAGS[run.type]?run.type:'practice';}
 const api={carKey,lineKey,cars,lines,changes,summary,ledger,shade,scaleMs,TAGS,defaultTag,eligible};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.PaceWallModel=api;
})(typeof globalThis!=='undefined'?globalThis:this);
