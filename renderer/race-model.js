(function(root){
 const key=(...parts)=>JSON.stringify(parts);
 const quantile=(values,p)=>{if(!values.length)return null;const a=[...values].sort((a,b)=>a-b),i=(a.length-1)*p,l=Math.floor(i);return a[l]+(a[Math.ceil(i)]-a[l])*(i-l);};
 function unsafe(p){if(p.state!=='active')return false;return p.participants.some(entry=>{let end=-1;return [...entry.laps].sort((a,b)=>a.endedAtMs-b.endedAtMs).some(l=>{const overlap=l.endedAtMs-l.durationMs<end;end=l.endedAtMs;return overlap;});});}
 function quarantined(result){return result.payload.state==='active'&&(unsafe(result.payload)||result.receipt?.warnings.some(w=>w.code==='SESSION_REQUIRES_CORRECTION'));}
 function runs(data){const output=[];for(const host of data.hosts)for(const result of host.results){const p=result.payload;if(p.state!=='active'||quarantined(result))continue;for(const entry of p.participants){if(entry.kind!=='physical'||!entry.carId||result.receipt?.summaries.find(s=>s.participantId===entry.id)?.included===false)continue;const groups=new Map(),stints=new Map(entry.stints.map(s=>[s.id,s])),drivers=new Map(entry.drivers.map(d=>[d.id,d.name]));for(const lap of entry.laps){const stint=stints.get(lap.stintId);if(!stint)continue;const groupKey=key(stint.lane,stint.driverId);if(!groups.has(groupKey))groups.set(groupKey,{participantId:entry.id,lane:stint.lane,driverId:stint.driverId,driver:drivers.get(stint.driverId)||'Unknown driver',laps:[]});groups.get(groupKey).laps.push({...lap,heatId:stint.heatId});}
  for(const g of groups.values())output.push({...g,stints:entry.stints.filter(s=>s.lane===g.lane&&s.driverId===g.driverId).map(s=>({...s,heatName:p.heats.find(h=>h.id===s.heatId)?.name||s.heatId})),id:key(host.id,p.source.id,p.sessionId,entry.id,g.lane,g.driverId),hostId:host.id,hostName:host.name,syncedAt:host.syncedAt,sourceId:p.source.id,sourceName:p.source.name,sessionId:p.sessionId,sessionName:p.name,startedAt:p.startedAt,type:p.type,revision:p.revision,contentHash:result.receipt?.contentHash,laneLengthM:p.track.lanes.find(l=>l.lane===g.lane)?.lengthM??null,trackId:p.track.id,track:p.track.name,carId:entry.carId,car:entry.displayName,configuration:entry.configuration,adjustments:p.adjustments.filter(a=>a.participantId===entry.id),standing:p.standings.find(s=>s.participantId===entry.id)||null,laps:g.laps.sort((a,b)=>a.endedAtMs-b.endedAtMs)});
 }}return output.sort((a,b)=>b.startedAt.localeCompare(a.startedAt));}
 function statistics(run){const all=run.laps,valid=all.filter(l=>l.valid&&!l.pit),eligible=valid.filter(l=>l.recordEligible),times=valid.map(l=>l.durationMs);let bestRun=null;
  for(let i=0;i<=all.length-5;i++){const set=all.slice(i,i+5);if(set.some((l,j)=>l.sequenceKnown===false||!l.valid||l.pit||l.stintId!==set[0].stintId||l.heatId!==set[0].heatId||j&&l.number!==set[j-1].number+1))continue;const mean=set.reduce((s,l)=>s+l.durationMs,0)/5;if(!bestRun||mean<bestRun.mean)bestRun={mean,laps:set};}
  return {count:valid.length,excluded:all.length-valid.length,best:eligible.length?Math.min(...eligible.map(l=>l.durationMs)):null,median:quantile(times,.5),mean:times.length?times.reduce((a,b)=>a+b,0)/times.length:null,q1:quantile(times,.25),q3:quantile(times,.75),spread:times.length>1?quantile(times,.75)-quantile(times,.25):null,bestRun};
 }
 function records(allRuns){const groups=new Map();for(const run of allRuns)for(const lap of run.laps){if(!lap.valid||lap.pit||!lap.recordEligible)continue;const id=key(run.hostId,run.sourceId,run.trackId,run.lane,run.carId);const current=groups.get(id);if(!current||lap.durationMs<current.lap.durationMs)groups.set(id,{run,lap,ties:1});else if(lap.durationMs===current.lap.durationMs)current.ties++;}return [...groups.values()].sort((a,b)=>a.run.track.localeCompare(b.run.track)||a.run.lane-b.run.lane||a.lap.durationMs-b.lap.durationMs);}
 function comparable(a,b){return a&&b&&a.id!==b.id&&a.hostId===b.hostId&&a.sourceId===b.sourceId&&a.trackId===b.trackId&&a.lane===b.lane;}
 function sameDriver(a,b){return !!(a&&b&&a.hostId===b.hostId&&a.sourceId===b.sourceId&&a.sessionId===b.sessionId&&a.participantId===b.participantId&&a.driverId===b.driverId);}
 function chartPoints(rows,selected,showExcluded){
  const valid=l=>l.valid&&!l.pit,continuous=(a,b)=>a&&a.sequenceKnown!==false&&b.sequenceKnown!==false&&valid(a)&&valid(b)&&a.stintId===b.stintId&&a.heatId===b.heatId&&b.number===a.number+1;
  let segment=0,medianSegment=0,previousMedian=false;
  const points=rows.map((lap,index)=>{
   if(!continuous(rows[index-1],lap))segment++;
   const group=rows.slice(Math.max(0,index-4),index+1),ready=group.length===5&&group.every((l,j)=>valid(l)&&(!j||continuous(group[j-1],l)));
   if(!ready||!previousMedian||!continuous(rows[index-1],lap))medianSegment++;
   previousMedian=ready;return {index,lap,segment,medianSegment,median:ready?quantile(group.map(l=>l.durationMs),.5):null};
  });
  const keep=new Set([0,rows.length-1,rows.findIndex(l=>l.id===selected)]),step=Math.max(1,Math.ceil(rows.length/250));
  for(let start=0;start<rows.length;start+=step){const bin=points.slice(start,start+step);for(const eligible of [true,false]){const subset=bin.filter(p=>valid(p.lap)===eligible&&(eligible||showExcluded));if(!subset.length)continue;let low=subset[0],high=subset[0];for(const p of subset){if(p.lap.durationMs<low.lap.durationMs)low=p;if(p.lap.durationMs>high.lap.durationMs)high=p;}keep.add(subset[0].index);keep.add(low.index);keep.add(high.index);}}
  return [...keep].filter(i=>i>=0&&(showExcluded||valid(rows[i]))).sort((a,b)=>a-b).map(i=>points[i]);
 }
 // Keep pauses and excluded/missing laps as boundaries, rather than compressing them away.
 function continuousSections(laps){
  const sections=[];let current=null,previous=null;
  for(const lap of laps){
   if(!lap.valid||lap.pit){current=null;previous=null;continue;}
   if(!current||lap.sequenceKnown===false||previous.sequenceKnown===false||previous.stintId!==lap.stintId||previous.heatId!==lap.heatId||lap.number!==previous.number+1){current=[];sections.push(current);}
   current.push(lap);previous=lap;
  }
  return sections;
 }
 function stintAnalysis(run){
  const groups=new Map((run.stints||[]).map(s=>[s.id,{...s,laps:[]}]));
  for(const lap of run.laps){if(!groups.has(lap.stintId))groups.set(lap.stintId,{id:lap.stintId,heatId:lap.heatId,heatName:lap.heatId,laps:[]});groups.get(lap.stintId).laps.push(lap);}
  return [...groups.values()].map(stint=>{
   const laps=[...stint.laps].sort((a,b)=>a.endedAtMs-b.endedAtMs),sections=continuousSections(laps);
   const longest=sections.reduce((best,section)=>section.length>best.length?section:best,[]);
   // Five laps at each end, without overlap, within ONE uninterrupted sequence.
   const pace=longest.length>=10?{first:quantile(longest.slice(0,5).map(l=>l.durationMs),.5),last:quantile(longest.slice(-5).map(l=>l.durationMs),.5),count:longest.length,from:longest[0].number,to:longest.at(-1).number}:null;
   if(pace)pace.change=pace.last-pace.first;
   return {...stint,laps,statistics:statistics({laps}),sections:sections.length,longest:longest.length,pit: laps.filter(l=>l.pit).length,invalid:laps.filter(l=>!l.valid&&!l.pit).length,pace};
  }).sort((a,b)=>(a.startedAtMs??a.laps[0]?.endedAtMs??0)-(b.startedAtMs??b.laps[0]?.endedAtMs??0));
 }
 function progressKey(run){return key(run.hostId,run.sourceId,run.carId,run.trackId,run.lane,run.type,run.laneLengthM??null);}
 function progressGroups(runs){
  const groups=new Map();
  for(const run of runs){const id=progressKey(run);if(!groups.has(id))groups.set(id,{id,run,runs:[]});const group=groups.get(id);group.runs.push(run);if(run.startedAt>group.run.startedAt)group.run=run;}
  return [...groups.values()].sort((a,b)=>a.run.car.localeCompare(b.run.car)||b.run.startedAt.localeCompare(a.run.startedAt)||a.id.localeCompare(b.id));
 }
 function progressEntries(runs,minimum=5,readStatistics=statistics){
  return runs.map(run=>({run,statistics:readStatistics(run)})).filter(e=>e.statistics.count>=minimum).sort((a,b)=>a.run.startedAt.localeCompare(b.run.startedAt)||a.run.id.localeCompare(b.run.id));
 }
 function configurationChanges(a,b){
  const before=a?.configuration?.technical||{},after=b?.configuration?.technical||{};
  const technical=[...new Set([...Object.keys(before),...Object.keys(after)])].sort().filter(k=>(before[k]||'')!==(after[k]||'')).map(field=>({field,before:before[field]||null,after:after[field]||null}));
  const components=r=>(r?.configuration?.components||[]).map(c=>JSON.stringify([c.partId,c.name,c.quantity,c.field,c.position,c.assemblyId])).sort();
  return {technical,componentsChanged:JSON.stringify(components(a))!==JSON.stringify(components(b))};
 }
 const api={runs,statistics,records,comparable,sameDriver,quantile,unsafe,quarantined,chartPoints,continuousSections,stintAnalysis,progressKey,progressGroups,progressEntries,configurationChanges};if(typeof module==='object'&&module.exports)module.exports=api;else root.RaceModel=api;
})(typeof globalThis!=='undefined'?globalThis:this);
