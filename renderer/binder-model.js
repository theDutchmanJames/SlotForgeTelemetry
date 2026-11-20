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
 // One pass over the runs: the best lap and the number of runs per car, pinion and gear. A list of hundreds of setups
 // then looks each one up instead of scanning every run again.
 const keyOf=(car,pinion,gear)=>JSON.stringify([norm(car),String(pinion??'').trim(),String(gear??'').trim()]);
 function index(runs){
  const map=new Map();
  for(const r of runs){const t=r.configuration?.technical||{};if(!t.pinion||!t.gear)continue;const k=keyOf(r.car,t.pinion,t.gear);let e=map.get(k);if(!e)map.set(k,e={best:null,count:0});e.count++;
   for(const lap of r.laps)if(eligible(lap)&&(!e.best||lap.durationMs<e.best.ms))e.best={ms:lap.durationMs,run:r};}
  return map;
 }
 function lookup(map,setup,carName){if(!carName||!setup.pinion||!setup.gear)return null;const e=map.get(keyOf(carName,setup.pinion,setup.gear));return e&&e.best?{...e.best,count:e.count}:null;}
 const driven=(setup,carName,runs)=>lookup(index(runs),setup,carName);
 function filter(entries,mode,isDriven){
  if(mode==='favourites')return entries.filter(e=>e.favourite);
  if(mode==='driven')return entries.filter(e=>isDriven(e));
  if(mode==='new')return entries.filter(e=>!isDriven(e));
  return entries;
 }
 const api={groups,driven,index,lookup,filter};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.BinderModel=api;
})(typeof globalThis!=='undefined'?globalThis:this);
