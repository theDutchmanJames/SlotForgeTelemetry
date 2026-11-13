(function(root){
  'use strict';
  const node=typeof module==='object'&&module.exports;
  const A=node?require('./prediction-model.js'):root.PredictionModel;
  const P=node?require('./performance-model.js'):root.PerformanceModel;
  const M=node?require('./magnetic-model.js'):root.MagneticModel;
  const H=node?require('./chassis-model.js'):root.ChassisModel;
  const T=node?require('./telemetry-model.js'):root.TelemetryModel;
  const steps=[['experience','Your experience','No measurements'],['checks','First checks','Something to try'],['setup','Your setup','Use what you know'],['measure','Look deeper','Optional measurements'],['test','Try & learn','Keep what works']];
  const descriptions={unknown:'Watch one familiar corner at a comfortable speed. Notice which part of the car moves first.',tip:'The car lifts onto its outside wheels or rolls onto its side.',slide:'The rear steps out more than you want while the guide stays in the slot.',snap:'The rear slides, then suddenly grips or snaps back.',guide:'The front leaves the slot or goes straight on without first rolling over.',hop:'The car bounces, shakes or chatters instead of running smoothly.',slow:'It feels weak or struggles to accelerate. Note whether the tyres spin.',brake:'It slows too abruptly, too little or turns sideways while braking.',fade:'The behaviour gets worse as the run continues.',consistent:'You want repeatable laps and fewer incidents, not just one fast lap.'};
  const recommended={tip:['body','chassis','height','proposal'],slide:['tyres','drive','magnetic','proposal'],snap:['tyres','magnetic','yaw'],guide:['chassis','tyres','height'],hop:['tyres','drive'],slow:['drive','power'],brake:['power','drive'],fade:['tyres','power','laps'],consistent:['laps','tyres'],unknown:['tyres','body']};
  const sources={proxy:{title:'Same car, different corners',url:'https://slotracer.online/community/printthread.php?page=12&tid=4745',text:'Viking proxy feedback distinguishes flowing-corner behaviour from braking and acceleration through tight corners. Lane and driver effects overlap; it does not prove a universal setup rule.'},maserati:{title:'Fastest lap versus easier driving',url:'https://www.franceslotforum.com/forum/little-test-de-la-maserati-mc-gt3-de-slot-it-1532346.html?page=1',text:'One Slot.it Maserati owner preferred the more stable ballast configuration despite a slightly faster best lap with less ballast. Several adjustments overlap; this is a test idea, not a prescribed weight.'},assembly:{title:'Check movement before changing parts',url:'https://www.franceslotforum.com/forum/little-test-de-la-maserati-mc-gt3-de-slot-it-1532346.html',text:'A build diary found gear/cockpit interference during pod movement. It supports inspecting clearances; it does not establish that your car has the same fault.'}};
  function context(input){
    // Preserve the recorded experiment's scope without recursive outcome records.
    const omitted=new Set(['name','adviceStep','adviceMeasurement','adviceResultContext','chassisRunSnapshots']);
    return JSON.stringify(Object.fromEntries(Object.keys(input).sort().filter(k=>!omitted.has(k)&&typeof input[k]==='string').map(k=>[k,input[k]])));
  }
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
    const area={slow:'drive',hop:'tyres',brake:'control',fade:'control',consistent:'race'}[input.adviceSymptom]||'handling';
    const priority=r.suggestions.filter(s=>['Resolve gear clearance','Check unequal rear tyre diameters','The tyre has reached its usable minimum'].includes(s.title));
    let suggestions=[...priority,...r.suggestions.filter(s=>!priority.includes(s)&&(s.area===area||s.area==='checks'))].slice(0,3);
    const resultState=input.adviceOutcome&&input.adviceOutcome!=='unknown'?(input.adviceResultContext?(input.adviceResultContext===context(input)?'recorded':'changed'):'draft'):'none';
    // Only link an unchanged suggested check, never infer intent from free text.
    const tried=resultState==='recorded'&&['same','clear'].includes(input.adviceOutcome)?suggestions.find(s=>s.action===input.adviceTestChange&&!priority.includes(s)):null;
    if(tried&&suggestions.length>1)suggestions=suggestions.filter(s=>s!==tried);
    return {base:r,usingSetup:use,mass,body,bodyShare,issues:[...r.issues,...issues],magnetic,net,chassis,suggestions,
      recommended:recommended[input.adviceSymptom]||recommended.unknown,
      source:['slide','snap'].includes(input.adviceSymptom)?sources.proxy:['tip','consistent'].includes(input.adviceSymptom)?sources.maserati:sources.assembly,
      next:r.guidance[area]||[],resultState};
  }
  const api={steps,descriptions,recommended,sources,context,record,analyze};
  if(node)module.exports=api;else root.DriverFeedbackModel=api;
})(globalThis);
