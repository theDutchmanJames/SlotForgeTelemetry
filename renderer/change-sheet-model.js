// SlotForge Remake (Change Sheet): what a setup change does. A base setup and up to two more (or the workbench as it is
// now): the inputs that differ, a plain verdict, only the results that moved, and one line each for the results that did
// not change and the ones that cannot be compared. Built on CompareModel, so the "same basis" rules stay exactly as they were.
(function(root){
 const node=typeof module==='object'&&module.exports;
 const CM=node?require('./compare-model.js'):root.CompareModel;
 // Which way is better. 0: neutral (ratio, rollout, weight and lap speed depend on the track and the test).
 const BETTER={speedKmh:1,forceN:1,peakPowerW:1,powerToWeight:1,pullPerKg:1};
 const SKIP=new Set(['name','notes','chassisChanges','workshopTests','feedback','updatedAt']);
 const same=(x,y)=>String(x??'').trim()===String(y??'').trim();
 // The inputs that differ between two setups, in the order of the base setup's fields.
 function inputChanges(base,other){
  const keys=[...new Set([...Object.keys(base),...Object.keys(other)])].filter(k=>!SKIP.has(k)&&typeof (base[k]??other[k])!=='object');
  return keys.filter(k=>!same(base[k],other[k])).map(k=>({key:k,from:base[k]??'',to:other[k]??''}));
 }
 // Results of one pair, plus pull per kg: how hard the car accelerates its own weight.
 function rows(base,other){
  const list=CM.compare(base,other,'neutral');
  const f=list.find(r=>r.key==='forceN'),m=list.find(r=>r.key==='massG');
  const pa=f?.a!==null&&m?.a>0?f.a/m.a*1000:null,pb=f?.b!==null&&m?.b>0?f.b/m.b*1000:null,supported=pa!==null&&pb!==null,basis=!!f?.sameBasis;
  const delta=supported&&basis?pb-pa:null;
  list.splice(list.indexOf(f)+1,0,{key:'pullPerKg',label:'Pull per kg',unit:'N/kg',deltaUnit:'N/kg',digits:1,a:pa,b:pb,delta,percent:delta!==null&&pa?delta/pa*100:null,sameBasis:!supported||basis,tone:'neutral'});
  return list.map(r=>{const dir=BETTER[r.key]||0,moved=r.delta!==null&&Math.abs(r.delta)>1e-9;return {...r,moved,tone:moved&&dir?(r.delta*dir>0?'good':'bad'):'neutral'};});
 }
 // The whole sheet: base, then each other setup.
 function sheet(base,others){
  const pairs=others.map(o=>({changes:inputChanges(base,o),rows:rows(base,o)}));
  const keys=(pairs[0]?.rows||rows(base,base)).map(r=>r.key);
  const moved=[],unchanged=[],missing=[];
  for(const key of keys){
   const cells=pairs.map(p=>p.rows.find(r=>r.key===key)),first=cells[0];
   if(cells.some(c=>c.moved))moved.push({key,label:first.label,unit:first.unit,digits:first.digits,base:first.a,better:BETTER[key]||0,cells});
   else if(cells.every(c=>c.delta!==null))unchanged.push({key,label:first.label});
   else missing.push({key,label:first.label,reason:cells.some(c=>!c.sameBasis)?'basis':'missing'});
  }
  const changed=[...new Set(pairs.flatMap(p=>p.changes.map(c=>c.key)))];
  return {pairs,moved,unchanged,missing,changed};
 }
 // A plain verdict for one pair, as parts {text,tone} the page can colour. Percentages are unit-free.
 function verdict(pair){
  const r=k=>pair.rows.find(x=>x.key===k),pct=x=>Math.abs(x.percent??0)<0.05?null:Math.round(Math.abs(x.percent)*10)/10;
  const parts=[],speed=r('speedKmh'),force=r('forceN'),mass=r('massG'),pw=r('powerToWeight'),pull=r('pullPerKg');
  if(speed?.moved)parts.push({text:speed.delta>0?'quicker on the straight':'slower on the straight',tone:speed.tone,key:'speedKmh',detail:pct(speed)!==null?`${speed.delta>0?'+':'−'}${pct(speed)}% no-load speed`:''});
  if(force?.moved)parts.push({text:force.delta>0?'pulls harder out of a corner':'pulls less out of a corner',tone:force.tone,key:'forceN',detail:pct(force)!==null?`${force.delta>0?'+':'−'}${pct(force)}%`:''});
  if(mass?.moved)parts.push({text:mass.delta<0?'lighter':'heavier',tone:'neutral',key:'massG',grams:Math.abs(mass.delta)});
  if(pull?.moved&&mass?.moved)parts.push({text:pull.delta>0?'accelerates its weight harder':'accelerates its weight less',tone:pull.tone,key:'pullPerKg',detail:pct(pull)!==null?`${pull.delta>0?'+':'−'}${pct(pull)}% pull per kg`:''});
  else if(pw?.moved)parts.push({text:pw.delta>0?'more power for its weight':'less power for its weight',tone:pw.tone,key:'powerToWeight',detail:pct(pw)!==null?`${pw.delta>0?'+':'−'}${pct(pw)}%`:''});
  return {parts,inputs:pair.changes.length,quiet:!parts.length};
 }
 const api={sheet,rows,inputChanges,verdict,BETTER};
 if(node)module.exports=api;else root.ChangeSheetModel=api;
})(typeof globalThis!=='undefined'?globalThis:this);
