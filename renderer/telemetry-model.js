(function(root) {
  const Fit=typeof module==='object'&&module.exports?require('./fit-model.js'):root.FitModel;
  const P = typeof module === 'object' && module.exports ? require('./performance-model.js') : root.PerformanceModel;
  // Label, upper bound, zero allowed, default. Units are explicit in labels.
  const fields = {
    totalWeight:['Total car weight (g)',100000,false,''], ballast:['Added ballast (g)',100000,true,'0'],
    frontWeight:['Front scale reading (g)',100000,true,''], rearWeight:['Rear scale reading (g)',100000,true,''],
    wheelbase:['Wheelbase (mm)',1000,false,''], ballastPosition:['Ballast distance behind front axle (mm)',1000,true,''],
    gearDiameter:['Driven gear outside diameter (mm)',1000,false,''],
    efficiency:['Drivetrain efficiency (%)',100,true,'100'], motorPercent:['Motor speed (% of no-load RPM)',100,true,'50'],
    wornDiameter:['Worn tyre diameter (mm)',1000,false,''], targetRollout:['Target rollout (mm / motor rev)',10000,false,''],
    pinionMin:['Pinion range · from',100,false,'8'], pinionMax:['Pinion range · to',100,false,'12'],
    gearMin:['Driven gear range · from',200,false,'24'], gearMax:['Driven gear range · to',200,false,'36'],
    trackLength:['Lap distance (m)',100000,false,''], lapTime:['Lap time (s)',100000,false,''], scaleFactor:['Scale denominator (e.g. 32)',1000,false,'']
  };
  const defaults = () => Object.fromEntries(Object.entries(fields).map(([k,s])=>[k,s[3]]));
  const number=P.number;
  function clean(input) {
    const out={};
    for(const [key,[label,max,zero,fallback]] of Object.entries(fields)) {
      const value=input[key]===undefined?fallback:input[key],n=number(value,max,zero);
      if(typeof value!=='string'||value.length>32||(value!==''&&(n===null||(/^(pinion|gear)(Min|Max)$/.test(key)&&!Number.isInteger(n)))))throw Error('Check '+label+'.');
      out[key]=value===''?'':String(n);
    }
    for(const key of ['pinion','gear'])if(out[key+'Min']&&out[key+'Max']&&+out[key+'Min']>+out[key+'Max'])throw Error(key+' range must run from low to high.');
    if(out.wheelbase&&out.ballastPosition!==''&&+out.ballastPosition>+out.wheelbase)throw Error('Ballast position must be between the front and rear axles (0 to wheelbase).');
    return out;
  }
  function calculate(input) {
    const n=Object.fromEntries(Object.entries(fields).map(([k,[,max,zero]])=>[k,number(input[k],max,zero)]));
    const motor=P.calculate(input),point=P.point(input,n.motorPercent);
    const axleTotal=n.frontWeight!==null&&n.rearWeight!==null&&n.frontWeight+n.rearWeight>0?n.frontWeight+n.rearWeight:null;
    const massG=n.totalWeight??axleTotal,loadedG=massG!==null&&n.ballast!==null?massG+n.ballast:null;
    const force=point?.forceN!=null&&n.efficiency!==null?point.forceN*n.efficiency/100:null;
    const perMass=(v,g)=>v!==null&&g>0?v/(g/1000):null;
    const worn=Fit.diameter(n.wornDiameter)!==null&&motor.rearDiameter!==null&&n.wornDiameter<=motor.rearDiameter?P.calculate({...input,rearDiameter:String(n.wornDiameter)}):null;
    const lapSpeed=n.trackLength!==null&&n.lapTime!==null?n.trackLength/n.lapTime*3.6:null;
    // Static two-support balance: x is measured behind the front axle.
    const positionValid=n.wheelbase!==null&&n.ballastPosition!==null&&n.ballastPosition<=n.wheelbase;
    const cg=axleTotal!==null&&n.wheelbase!==null?n.wheelbase*n.rearWeight/axleTotal:null;
    const placementReady=cg!==null&&n.ballast!==null&&(n.ballast===0||positionValid);
    const rearAdded=placementReady?(n.ballast===0?0:n.ballast*n.ballastPosition/n.wheelbase):null;
    const ballastFront=placementReady?n.frontWeight+n.ballast-rearAdded:null,ballastRear=placementReady?n.rearWeight+rearAdded:null;
    const balanceMass=placementReady?axleTotal+n.ballast:null;
    const gearFit=Fit.clearance(motor.rearDiameter,n.gearDiameter),wornGearFit=Fit.clearance(worn?.rearDiameter,n.gearDiameter);
    const clearance=gearFit.gap,wornClearance=wornGearFit.gap;
    return {...n,motor,point,massG,loadedG,axleTotal,massMismatch:axleTotal!==null&&n.totalWeight!==null&&Math.abs(axleTotal-n.totalWeight)>0.01,
      cg,ballastFront,ballastRear,ballastFrontPercent:placementReady?ballastFront/balanceMass*100:null,ballastRearPercent:placementReady?ballastRear/balanceMass*100:null,
      ballastCg:placementReady?n.wheelbase*ballastRear/balanceMass:null,positionInvalid:n.wheelbase!==null&&n.ballastPosition!==null&&!positionValid,
      clearance,wornClearance,gearFit,wornGearFit,wheelForce:force,wheelPower:point?.powerW!=null&&n.efficiency!==null?point.powerW*n.efficiency/100:null,
      frontPercent:axleTotal!==null?n.frontWeight/axleTotal*100:null,rearPercent:axleTotal!==null?n.rearWeight/axleTotal*100:null,
      powerToWeight:perMass(motor.peakPowerW,massG),loadedPowerToWeight:perMass(motor.peakPowerW,loadedG),
      acceleration:perMass(force,massG),loadedAcceleration:perMass(force,loadedG),worn,rideHeightChange:worn?(n.wornDiameter-motor.rearDiameter)/2:null,
      lapSpeed,scaleSpeed:lapSpeed!==null&&n.scaleFactor!==null?lapSpeed*n.scaleFactor:null};
  }
  function gears(input) {
    const m=calculate(input),target=m.targetRollout??m.motor.rollout;
    if(![m.pinionMin,m.pinionMax,m.gearMin,m.gearMax].every(Number.isInteger)||m.pinionMin>m.pinionMax||m.gearMin>m.gearMax)return {rows:[],count:0,target};
    const rows=[];
    for(let p=m.pinionMin;p<=m.pinionMax;p++)for(let g=m.gearMin;g<=m.gearMax;g++) {
      const result=P.calculate({...input,pinion:String(p),gear:String(g)});
      rows.push({pinion:p,gear:g,...result,error:target!==null&&result.rollout!==null?result.rollout-target:null});
    }
    rows.sort((a,b)=>(a.error!==null&&b.error!==null?Math.abs(a.error)-Math.abs(b.error):a.ratio-b.ratio)||a.pinion-b.pinion||a.gear-b.gear);
    return {rows:rows.slice(0,20),count:rows.length,target};
  }
  const api={fields,defaults,number,clean,calculate,gears};
  if(typeof module==='object'&&module.exports)module.exports=api;else root.TelemetryModel=api;
})(globalThis);
