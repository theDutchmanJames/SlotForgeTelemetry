(function(root){
  'use strict';
  // Supported 1:32 road/track-car calculation envelope, not class regulations.
  // Keep stored measurements intact; reject an unusable calculation, never clamp a dimension.
  const MIN_DIAMETER=8,MAX_DIAMETER=30,MAX_GEAR_GAP=3;
  const diameter=v=>Number.isFinite(v)&&v>=MIN_DIAMETER&&v<=MAX_DIAMETER?v:null;
  const gearDiameter=v=>Number.isFinite(v)&&v>0&&v<=MAX_DIAMETER?v:null;
  function clearance(tyre,gear){
    tyre=diameter(tyre);gear=gearDiameter(gear);
    if(tyre===null||gear===null)return {gap:null,interference:null,state:'missing'};
    const difference=(tyre-gear)/2;
    return {gap:difference>=0?difference:null,interference:difference<0?-difference:0,state:difference<0?'interference':difference===0?'touching':'clear'};
  }
  function tyrePlan({fitted,gear,requiredGap,minimum,targetDiameter}){
    fitted=diameter(fitted);gear=gearDiameter(gear);
    const current=clearance(fitted,gear),invalidGap=requiredGap!==null&&(!Number.isFinite(requiredGap)||requiredGap<0||requiredGap>MAX_GEAR_GAP),invalidMinimum=minimum!==null&&diameter(minimum)===null;
    const proposedMinimum=!invalidGap&&requiredGap!==null&&gear!==null?gear+2*requiredGap:null;
    const invalidTarget=proposedMinimum!==null&&diameter(proposedMinimum)===null;
    const gearMinimum=!invalidTarget?proposedMinimum:null;
    // An unresolvable stated constraint cannot silently become an absent constraint.
    const missingGear=requiredGap!==null&&gear===null;
    const limit=invalidGap||invalidMinimum||invalidTarget||missingGear?null:minimum===null?gearMinimum:gearMinimum===null?minimum:Math.max(minimum,gearMinimum);
    const difference=fitted!==null&&limit!==null?fitted-limit:null;
    return {current,gearMinimum,limit,remaining: difference===null?null:Math.max(0,difference),shortfall:difference===null?null:Math.max(0,-difference),targetDiameter:diameter(targetDiameter),invalidGap,invalidMinimum,invalidTarget,missingGear};
  }
  // Cap automatic additions at existing car mass and respect a tighter explicit
  // mass budget, rather than presenting near-singular kilogram-scale solutions.
  function additionFits(added,current,maximum=null){return Number.isFinite(added)&&added>=0&&Number.isFinite(current)&&current>0&&added<=current&&(maximum===null||current+added<=maximum+1e-9);}
  const api={MIN_DIAMETER,MAX_DIAMETER,MAX_GEAR_GAP,diameter,gearDiameter,clearance,tyrePlan,additionFits};
  if(typeof module==='object'&&module.exports)module.exports=api;else root.FitModel=api;
})(globalThis);
