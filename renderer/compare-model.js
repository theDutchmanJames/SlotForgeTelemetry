(function(root){
  const node=typeof module==='object'&&module.exports;
  const C=node?require('./calculator-model.js'):root.CalculatorModel;
  const T=node?require('./telemetry-model.js'):root.TelemetryModel;
  const M=node?require('./magnetic-model.js'):root.MagneticModel;
  const H=node?require('./chassis-model.js'):root.ChassisModel;
  const metrics=[['speedKmh','No-load speed','km/h',2],['forceN','Ideal force at rated torque (before losses)','N',2],['rollout','Rollout','mm/motor rev',2],['ratio','Gear ratio',':1',3],['peakPowerW','Estimated peak mechanical power','W',2],['powerToWeight','Estimated peak motor power / mass','W/kg',2],['massG','Car weight','g',1],['lapSpeed','Measured average speed','km/h',2],['magneticMean','Measured magnetic pull','gf',2],['magneticPercent','Magnetic pull / car weight','%',2],['magneticClearance','Motor-to-rail clearance','mm',3]];
  function compare(a,b,goal='speed'){
    const av=T.calculate(C.inputOf(a)),bv=T.calculate(C.inputOf(b));
    for(const [v,s] of [[av,a],[bv,b]]){const m=M.calculate(s,v.massG,v.rideHeightChange);v.magneticMean=m.mean??null;v.magneticPercent=m.loadPercent??null;v.magneticClearance=m.height??null;}
    const rpmBasis=a.motorType===b.motorType&&Number(a.ratedVoltage)>0&&Number(a.ratedVoltage)===Number(b.ratedVoltage);
    const torqueBasis=a.motorType===b.motorType&&a.torqueType===b.torqueType&&Number(a.torqueVoltage)>0&&Number(a.torqueVoltage)===Number(b.torqueVoltage);
    const allBasis=rpmBasis&&torqueBasis;
    const base=metrics.map(([key,label,unit,digits])=>{
      const x=av.motor[key]??av[key]??null,y=bv.motor[key]??bv[key]??null;
      const supported=x!==null&&y!==null;
      const sameBasis=['magneticMean','magneticPercent'].includes(key)?(!supported||M.sameConditions(a,b)):key==='speedKmh'?rpmBasis:key==='forceN'?torqueBasis:['peakPowerW','powerToWeight'].includes(key)?allBasis:true;
      const delta=supported&&sameBasis?y-x:null,percent=delta!==null&&x!==0?delta/x*100:null;
      const judged=goal==='speed'?['speedKmh']:goal==='force'?['forceN']:goal==='power'?['powerToWeight']:[];
      const tone=sameBasis&&supported&&judged.includes(key)&&Math.abs(delta)>1e-9?(delta>0?'good':'bad'):'neutral';
      return {key,label,unit,deltaUnit:unit==='%'?'percentage points':unit,digits,a:x,b:y,delta,percent,sameBasis,tone};
    });
    const ha=H.calculate(a),hb=H.calculate(b);
    const basis=ha.mode===hb.mode&&ha.span!==null&&ha.span===hb.span&&
      (ha.mode==='axle'||a.chassisSupportReference===b.chassisSupportReference);
    const extra=[
      ['chassisAngle','Guide triangle angle','°',h=>h.geometry?.angle,false],
      ['chassisRatio','Guide span / rear spacing',':1',h=>h.geometry?.ratio,false],
      ['chassisTrack','Rear contact centre spacing','mm',h=>h.track,false],
      ['chassisGuideSpan','Guide pivot to rear axle','mm',h=>h.geometry?.length,false],
      ['chassisFrontShare','Measured front support share','%',h=>h.baseline?.frontShare,true],
      ['chassisRearLeft','Measured left share of rear load','%',h=>h.baseline?.rearLeftShare,true],
      ['chassisCgX','Measured CG behind front support','mm',h=>h.baseline?.x,true],
      ['chassisCgY','Measured CG right of centreline','mm',h=>h.baseline?.y,true],
      ['chassisPlanMass','Planned mass (independent scenario)','g',h=>h.planned?.mass,true]
    ].map(([key,label,unit,get,needsBasis])=>{
      const x=ha.error?null:get(ha)??null,y=hb.error?null:get(hb)??null,supported=x!==null&&y!==null,sameBasis=!supported||!needsBasis||basis;
      const delta=supported&&sameBasis?y-x:null;
      return {key,label,unit,deltaUnit:unit==='%'?'percentage points':unit,digits:2,a:x,b:y,delta,percent:null,sameBasis,tone:'neutral'};
    });
    return base.concat(extra);
  }
  const api={metrics,compare};if(node)module.exports=api;else root.CompareModel=api;
})(globalThis);
