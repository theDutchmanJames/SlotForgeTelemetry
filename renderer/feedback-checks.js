(function(root){
  'use strict';
  const definitions=[
    {id:'guide',label:'Guide & front contact',text:'With power off, check that the guide turns without wires pulling it, the blade clears the slot bottom and the braids make contact. Check whether the front tyres lift the guide.'},
    {id:'tyres',label:'Tyre condition & seating',text:'Check both rear tyres are seated, clean and round, and the wheels are secure. Check for body rubbing. Use only preparation allowed for your tyres and track.'},
    {id:'axles',label:'Axles & drivetrain',text:'Check wheel security, axle play, alignment and gear mesh for rubbing or tight spots. Keep the motor secured; do not assume all resistance from a geared motor is a fault.'},
    {id:'body',label:'Body & pod movement',text:'Check the intended movement is free without tyre, gear or cockpit contact. Keep screws secure and follow the car maker’s adjustment range.'},
    {id:'pickup',label:'Pickup & connections',text:'With power off, inspect braid seating, cleanliness, wires and connectors. Compare another lane or controller under otherwise similar conditions if practical.'},
    {id:'track',label:'The troublesome corner or joint',text:'Inspect the slot, rails, bumps and clearances at that location. Compare another corner before changing the whole car.'}
  ];
  const excluded=new Set(['name','adviceStep','adviceMeasurement','adviceResultContext','chassisRunSnapshots','adviceCheckLog','adviceChecks','adviceOutcome','adviceTestChange','adviceTestObservations','adviceTestId','adviceTestAction']);
  const dependencies={
    guide:/^(chassis(GuideSpan|Mode|SupportReference|SupportSpan|Front)|frontWeight|wheelbase|rearDiameter|tyreMode|rimDiameter|tyreThickness|adviceTrack|adviceSystem|adviceFrontContact)$/,
    tyres:/^(tyre(Set|Left|Right|Samples|Mode|Thickness)|rearDiameter|rimDiameter|gearDiameter|adviceTyres|adviceTrued|adviceShoulder|adviceDriveSlip)$/,
    axles:/^(pinion|gear|gearDiameter|motorType|motorTorque|torqueType|ratedRpm|ratedVoltage|rearDiameter|rimDiameter|tyreThickness)$/,
    body:/^(adviceBody|adviceBodyMass|adviceComponents|adviceMountChange|adviceMovement|rearDiameter|rimDiameter|tyreThickness|tyreLeft|tyreRight|gearDiameter)$/,
    pickup:/^(electricalMode|electricalRows|adviceController|adviceSystem|adviceTrack|adviceCutoutWhere|adviceSharedPower)$/,
    track:/^(adviceTrack|adviceDirection|adviceOtherCar|adviceOtherCorner|adviceSystem)$/
  };
  const canonical=v=>/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(v.trim())&&Number.isFinite(Number(v))?String(Number(v)):v;
  function checkScope(input,id){return JSON.stringify(Object.fromEntries(Object.keys(input).sort().filter(k=>dependencies[id].test(k)&&typeof input[k]==='string'&&input[k]!==''&&input[k]!=='unknown'&&!['chassisRunSnapshots'].includes(k)).map(k=>[k,canonical(input[k])])));}
  function scope(input){return JSON.stringify(Object.fromEntries(Object.keys(input).sort().filter(k=>!excluded.has(k)&&typeof input[k]==='string').map(k=>{const v=input[k];return [k,/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(v.trim())&&Number.isFinite(Number(v))?String(Number(v)):v];})));}
  function legacyScope(raw,id){try{const old=JSON.parse(raw);return old&&typeof old==='object'&&!Array.isArray(old)?checkScope(old,id):null;}catch{return null;}}
  function parse(raw=''){
    if(raw==='')return {version:2,items:[]};
    if(typeof raw!=='string'||raw.length>26000)throw Error('The check list is too large. Save this investigation and start a new check list.');
    let data;try{data=JSON.parse(raw);}catch{throw Error('The saved check list could not be read.');}
    if(![1,2].includes(data?.version)||(data.version===1&&(typeof data.scope!=='string'||data.scope.length>24000))||!Array.isArray(data.items)||data.items.length>definitions.length)throw Error('Invalid check list.');
    const ids=new Set();
    const items=data.items.map(r=>{if(!r||!definitions.some(d=>d.id===r.id)||ids.has(r.id)||!['clear','issue','unknown'].includes(r.status)||(data.version===2&&(typeof r.scope!=='string'||r.scope.length>24000)))throw Error('Invalid recorded check.');ids.add(r.id);return {id:r.id,status:r.status,...(data.version===2?{scope:r.scope}:{})};});
    return {version:data.version,...(data.version===1?{scope:data.scope}:{}),items};
  }
  function state(input){try{const log=parse(input.adviceCheckLog||''),staleIds=log.items.filter(r=>(log.version===1?legacyScope(log.scope,r.id):r.scope)!==checkScope(input,r.id)).map(r=>r.id);return {log,current:!staleIds.length,stale:!!staleIds.length,staleIds,statuses:Object.fromEntries(log.items.filter(r=>!staleIds.includes(r.id)).map(r=>[r.id,r.status]))};}catch(e){return {log:{items:[]},current:false,stale:false,staleIds:[],statuses:{},error:e.message};}}
  function mark(input,id,status){
    if(!definitions.some(d=>d.id===id)||!['clear','issue','unknown'].includes(status))throw Error('Choose a valid check result.');
    const previous=state(input);if(previous.error)throw Error('Start a new check list before recording another check.');
    const data={version:2,items:previous.log.items.filter(r=>r.id!==id).map(r=>({...r,scope:previous.log.version===1?(previous.staleIds.includes(r.id)?'legacy-recheck':checkScope(input,r.id)):r.scope}))};
    data.items.push({id,status,scope:checkScope(input,id)});const raw=JSON.stringify(data);parse(raw);return raw;
  }
  function reconfirm(input){const log=parse(input.adviceCheckLog||'');const raw=JSON.stringify({version:2,items:log.items.map(r=>({...r,scope:checkScope(input,r.id)}))});parse(raw);return raw;}
  const api={definitions,scope,checkScope,parse,state,mark,reconfirm};if(typeof module==='object'&&module.exports)module.exports=api;else root.FeedbackChecks=api;
})(globalThis);
