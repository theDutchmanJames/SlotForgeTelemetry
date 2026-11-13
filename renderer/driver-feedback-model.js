(function(root){
  'use strict';
  const node=typeof module==='object'&&module.exports;
  const A=node?require('./prediction-model.js'):root.PredictionModel;
  const P=node?require('./performance-model.js'):root.PerformanceModel;
  const M=node?require('./magnetic-model.js'):root.MagneticModel;
  const H=node?require('./chassis-model.js'):root.ChassisModel;
  const T=node?require('./telemetry-model.js'):root.TelemetryModel;
  const Engine=node?require('./feedback-engine.js'):root.FeedbackEngine;
  const steps=[['experience','Your experience','No measurements'],['checks','First checks','Something to try'],['setup','Your setup','Use what you know'],['measure','Look deeper','Optional measurements'],['test','Try & learn','Keep what works']];
  const descriptions={unknown:'Watch one familiar corner at a comfortable speed. Notice which part of the car moves first.',tip:'The car lifts onto its outside wheels or rolls onto its side.',slide:'The rear steps out more than you want while the guide stays in the slot.',snap:'The rear slides, then suddenly grips or snaps back.',guide:'The front leaves the slot or goes straight on without first rolling over.',hop:'The car bounces, shakes or chatters instead of running smoothly.',slow:'It feels weak or struggles to accelerate. Note whether the tyres spin.',brake:'It slows too abruptly, too little or turns sideways while braking.',fade:'The behaviour gets worse as the run continues.',consistent:'You want repeatable laps and fewer incidents, not just one fast lap.'};
  function context(input){
    // Preserve the recorded experiment's scope without recursive outcome records.
    const omitted=new Set(['name','adviceStep','adviceMeasurement','adviceResultContext','chassisRunSnapshots','adviceCheckLog']);
    const values={...A.defaults(),...input};
    return JSON.stringify(Object.fromEntries(Object.keys(values).sort().filter(k=>!omitted.has(k)&&typeof values[k]==='string').map(k=>[k,values[k]])));
  }
  function matchesRecorded(raw,input){try{return context(JSON.parse(raw))===context(input);}catch{return false;}}
  function record(input){
    if(!['better','same','worse','clear'].includes(input.adviceOutcome))throw Error('Choose an observed result before recording it.');
    if(!input.adviceTestChange?.trim())throw Error('Describe the one check or change you tested first.');
    const value=context(input);if(value.length>30000)throw Error('This investigation is too large to record. Export it and start a separate test setup.');
    return value;
  }
  function analyze(input={}){
    const r=A.analyze(input),use=input.adviceUseSetup==='yes',mass=use?T.calculate(input).massG:null;
    const body=P.positive(input.adviceBodyMass,100000),issues=[];
    const bodyShare=mass!==null&&body!==null&&body<mass?body/mass*100:null;
    if(body!==null&&mass!==null&&body>=mass)issues.push('Body assembly mass must be less than the ready-to-drive car mass. Check both weighings.');
    const magnetic=use?M.calculate(input,mass):{},chassis=use?H.calculate(input):{};
    const net=use&&input.advicePullMethod==='net'&&input.adviceRails==='yes'&&!magnetic.error;
    const resultState=input.adviceOutcome&&input.adviceOutcome!=='unknown'?(input.adviceResultContext?(matchesRecorded(input.adviceResultContext,input)?'recorded':'changed'):'draft'):'none';
    const d={base:r,usingSetup:use,mass,body,bodyShare,issues:[...r.issues,...issues],magnetic,net,chassis,resultState};
    const result=Engine.interpret(input,d);
    return {...d,...result,next:result.questions};
  }
  const api={steps,descriptions,context,record,analyze};
  if(node)module.exports=api;else root.DriverFeedbackModel=api;
})(globalThis);
