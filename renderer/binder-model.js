// SlotForge Remake (Setup Binder): the Library as one list of every setup, in a section per car.
// Pure functions: grouping by car, the best lap driven with a setup's gearing, and the filters.
(function(root){
 const norm=s=>String(s??'').trim().replace(/\s+/g,' ').toLowerCase();
 const eligible=l=>l.valid&&!l.pit&&!!(l.trackRecordEligible??l.recordEligible);
 // Sections: cars with setups (most recently saved first), then cars without setups, then setups without a known car.
 function groups(entries,cars){
  const byRef=new Map(cars.map(c=>[c.ref,c])),map=new Map();
  for(const e of entries){const car=byRef.get(e.setup.carRef)||null,key=car?car.ref:'';if(!map.has(key))map.set(key,{car,entries:[]});map.get(key).entries.push(e);}
  const latest=g=>Math.max(...g.entries.map(e=>Date.parse(e.updatedAt)||0));
  const withSetups=[...map.entries()].filter(([k])=>k).map(([,g])=>g).sort((a,b)=>latest(b)-latest(a)||a.car.name.localeCompare(b.car.name));
  const empty=cars.filter(c=>!map.has(c.ref)&&!c.archived).map(car=>({car,entries:[]})).sort((a,b)=>a.car.name.localeCompare(b.car.name));
  const loose=map.has('')?[{car:null,entries:map.get('').entries}]:[];
  return [...withSetups,...empty,...loose];
 }
 // The best lap of runs driven with this car and this setup's pinion and gear (as the run recorded them).
 function driven(setup,carName,runs){
  if(!carName||!setup.pinion||!setup.gear)return null;
  let best=null,count=0;
  for(const r of runs){
   const t=r.configuration?.technical||{};
   if(norm(r.car)!==norm(carName)||String(t.pinion??'').trim()!==String(setup.pinion).trim()||String(t.gear??'').trim()!==String(setup.gear).trim())continue;
   count++;for(const lap of r.laps)if(eligible(lap)&&(!best||lap.durationMs<best.ms))best={ms:lap.durationMs,run:r};
  }
  return count?{...best,count}:null;
 }
 function filter(entries,mode,isDriven){
  if(mode==='favourites')return entries.filter(e=>e.favourite);
  if(mode==='driven')return entries.filter(e=>isDriven(e));
  if(mode==='new')return entries.filter(e=>!isDriven(e));
  return entries;
 }
 const api={groups,driven,filter};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.BinderModel=api;
})(typeof globalThis!=='undefined'?globalThis:this);
