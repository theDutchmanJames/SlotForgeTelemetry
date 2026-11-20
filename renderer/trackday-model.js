// Track day: the change → drive → enter laps → compare loop. Pure logic; runs in the app and in Node tests.
// Runs are saved as ordinary manual lap sessions, so Lap analysis, Progress and Compare runs see them too.
(function(root){
 const node=typeof module==='object'&&module.exports;
 const RM=node?require('./race-model.js'):root.RaceModel,ML=node?require('./manual-laps-model.js'):root.ManualLapsModel,C=node?require('./calculator-model.js'):root.CalculatorModel;
 const SOURCE='Track day';
 const key=s=>String(s||'').trim().toLowerCase();
 const localDay=iso=>{const d=new Date(iso);return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();};
 // A run belongs to the session when car, track and lane match (names compared without case).
 const sameContext=(run,ctx)=>key(run.car)===key(ctx.car)&&key(run.track)===key(ctx.track)&&run.lane===ctx.lane;
 // Newest first; runs saved in the same instant fall back to when they were saved.
 const newest=(a,b)=>b.startedAt.localeCompare(a.startedAt)||String(b.syncedAt||'').localeCompare(String(a.syncedAt||''));
 function previous(runs,ctx,excludeId=null){return runs.filter(r=>sameContext(r,ctx)&&r.id!==excludeId).sort(newest)[0]||null;}
 function today(runs,ctx,now=new Date()){const d=localDay(now.toISOString());return runs.filter(r=>sameContext(r,ctx)&&localDay(r.startedAt)===d).sort(newest);}
 // Typed laps → the same lap shape a saved manual session has, for a live preview.
 function preview(laps,sequenceConfirmed){let elapsed=0;return {laps:laps.map((l,i)=>({...l,id:'preview-'+i,stintId:'entered',heatId:'entered',endedAtMs:elapsed+=l.durationMs,recordEligible:l.valid&&!l.pit,sequenceKnown:sequenceConfirmed}))};}
 // Lower lap times are better. Differences under 0.5% of the earlier value read as "about the same".
 function compare(current,prior){
  const a=RM.statistics(prior),b=RM.statistics(current);
  const row=(key,label,x,y,lowerIsBetter=true)=>{const delta=x!==null&&y!==null?y-x:null,small=delta!==null&&Math.abs(delta)<=Math.abs(x)*0.005;
   return {key,label,before:x,after:y,delta,verdict:delta===null?'unavailable':small?'same':(delta<0)===lowerIsBetter?'better':'worse'};};
  return [row('best','Best lap',a.best,b.best),row('median','Typical lap (median)',a.median,b.median),row('spread','Consistency (spread)',a.spread,b.spread),{key:'count',label:'Laps counted',before:a.count,after:b.count,delta:b.count-a.count,verdict:'info'}];
 }
 // One sentence a tired racer can read between runs.
 function verdict(rows){
  const m=rows.find(r=>r.key==='median'),b=rows.find(r=>r.key==='best');
  if(!m||m.verdict==='unavailable')return 'Enter laps to compare with your last run.';
  const words={better:'faster',worse:'slower',same:'about the same'};
  return `Typical pace ${words[m.verdict]}${m.verdict==='same'?'':' by '+(Math.abs(m.delta)/1000).toFixed(3)+' s'}; best lap ${words[b.verdict]||'not comparable'}${b.verdict==='better'||b.verdict==='worse'?' by '+(Math.abs(b.delta)/1000).toFixed(3)+' s':''}.`;
 }
 const positive=v=>{const n=Number(v);return v!==''&&v!=null&&Number.isFinite(n)&&n>0;};
 // A manual session for ManualLapsModel.normalize: context, change note and a snapshot of the current setup.
 // laneLengthM: from the garage track when known; otherwise the setup's lap distance, if any.
 function session({ctx,setup,note='',laps,sequenceConfirmed,now=new Date(),runNumber=1,laneLengthM=null}){
  const s=setup||{},change=String(note).trim().slice(0,150),diameter=s.pinion!==undefined?C.diameter(s):null;
  const technical={pinion:/^\d+$/.test(String(s.pinion||''))?String(s.pinion):'',gear:/^\d+$/.test(String(s.gear||''))?String(s.gear):'',rearDiameter:diameter?String(Number(diameter.toPrecision(7))):'',weight:positive(s.totalWeight)?String(s.totalWeight):'',ratedRpm:positive(s.ratedRpm)?String(s.ratedRpm):''};
  return ML.normalize({name:`Run ${runNumber}${change?' · '+change:' · no change'}`.slice(0,200),car:ctx.car,track:ctx.track,driver:ctx.driver||'Unknown driver',source:SOURCE,
   notes:[change?'Changed: '+change:'No change noted.',s.name?'Setup: '+s.name:''].filter(Boolean).join('\n').slice(0,2000),
   startedAt:now.toISOString(),type:'practice',lane:ctx.lane,lengthM:positive(laneLengthM)?Number(laneLengthM):positive(s.trackLength)?Number(s.trackLength):null,sequenceConfirmed,technical,laps});
 }
 // "Changed: …" from a saved Track day run, for the run list and comparisons.
 const changeOf=run=>/^Changed: (.*)$/m.exec(run?.notes||'')?.[1]||(run?.notes?.startsWith('No change')?'No change':'');
 // SlotForge Remake (Pit Board): the change is read from the setup, not typed. Fields Track day records, as people say them.
 const FIELDS=[['pinion','pinion',''],['gear','gear',''],['rearDiameter','rear tyre',' mm'],['weight','weight',' g'],['ratedRpm','motor',' rpm']];
 const technicalOf=setup=>session({ctx:{car:'x',track:'x',lane:1},setup,laps:[{number:1,durationMs:1,valid:true,pit:false}],sequenceConfirmed:false}).technical;
 // What changed between the last run and the setup on the workbench now: ["pinion 9 → 10", …].
 function autoChanges(prior,setup){
  if(!prior)return [];const before=prior.configuration?.technical||{},after=technicalOf(setup);
  return FIELDS.filter(([k])=>before[k]&&after[k]&&Number(before[k])!==Number(after[k])).map(([k,label,unit])=>({field:k,label,from:before[k],to:after[k],unit}));
 }
 // As saved with the run (metric, as recorded): "pinion 9 → 10", "weight 80 → 72 g".
 const autoChange=(prior,setup)=>autoChanges(prior,setup).map(c=>`${c.label} ${c.from} → ${c.to}${c.unit}`);
 // The quickest run by typical lap (median), when at least two runs can be compared.
 function quickest(runs){
  const rated=runs.map(r=>({run:r,median:RM.statistics(r).median})).filter(x=>x.median!==null);
  if(rated.length<2)return null;return rated.reduce((a,b)=>b.median<a.median?b:a).run;
 }
 // The setup values of a run that differ from the workbench now, to write back with "Keep this change".
 function keepable(run,setup){
  if(!run)return [];const t=run.configuration?.technical||{},now=technicalOf(setup);
  return FIELDS.filter(([k])=>t[k]&&Number(t[k])!==Number(now[k])).map(([k,label,unit])=>({field:k,label,from:now[k]||'—',to:t[k],unit}));
 }
 function validContext(ctx){return !!(ctx&&key(ctx.car)&&key(ctx.track)&&Number.isInteger(ctx.lane)&&ctx.lane>=1&&ctx.lane<=64);}
 const api={SOURCE,sameContext,previous,today,preview,compare,verdict,session,changeOf,validContext,autoChange,autoChanges,quickest,keepable,technicalOf};
 if(node)module.exports=api;else root.TrackdayModel=api;
})(globalThis);
