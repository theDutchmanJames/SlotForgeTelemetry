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
  function scope(input){return JSON.stringify(Object.fromEntries(Object.keys(input).sort().filter(k=>!excluded.has(k)&&typeof input[k]==='string').map(k=>{const v=input[k];return [k,/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(v.trim())&&Number.isFinite(Number(v))?String(Number(v)):v];})));}
  function parse(raw=''){
    if(raw==='')return {version:1,scope:'',items:[]};
    if(typeof raw!=='string'||raw.length>26000)throw Error('The check list is too large. Save this investigation and start a new check list.');
    let data;try{data=JSON.parse(raw);}catch{throw Error('The saved check list could not be read.');}
    if(data?.version!==1||typeof data.scope!=='string'||data.scope.length>24000||!Array.isArray(data.items)||data.items.length>definitions.length)throw Error('Invalid check list.');
    const ids=new Set();
    const items=data.items.map(r=>{if(!r||!definitions.some(d=>d.id===r.id)||ids.has(r.id)||!['clear','issue','unknown'].includes(r.status))throw Error('Invalid recorded check.');ids.add(r.id);return {id:r.id,status:r.status};});
    return {version:1,scope:data.scope,items};
  }
  function state(input){try{const log=parse(input.adviceCheckLog||''),current=log.scope===scope(input);return {log,current,stale:log.items.length>0&&!current,statuses:Object.fromEntries(current?log.items.map(r=>[r.id,r.status]):[])};}catch(e){return {log:{items:[]},current:false,stale:false,statuses:{},error:e.message};}}
  function mark(input,id,status){
    if(!definitions.some(d=>d.id===id)||!['clear','issue','unknown'].includes(status))throw Error('Choose a valid check result.');
    const previous=state(input);if(previous.stale||previous.error)throw Error('Start a new check list for this setup before recording another check.');
    const data={version:1,scope:scope(input),items:previous.log.items.filter(r=>r.id!==id)};
    data.items.push({id,status});const raw=JSON.stringify(data);parse(raw);return raw;
  }
  function reconfirm(input){const log=parse(input.adviceCheckLog||'');const raw=JSON.stringify({...log,scope:scope(input)});parse(raw);return raw;}
  const api={definitions,scope,parse,state,mark,reconfirm};if(typeof module==='object'&&module.exports)module.exports=api;else root.FeedbackChecks=api;
})(globalThis);
