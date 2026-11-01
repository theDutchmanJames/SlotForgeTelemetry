(function(root){
  const node=typeof module==='object'&&module.exports;
  const C=node?require('./calculator-model.js'):root.CalculatorModel;
  const T=node?require('./telemetry-model.js'):root.TelemetryModel;
  const metrics=[['speedKmh','No-load speed','km/h',2],['forceN','Ideal force at rated torque (before losses)','N',2],['rollout','Rollout','mm/motor rev',2],['ratio','Gear ratio',':1',3],['peakPowerW','Estimated peak mechanical power','W',2],['powerToWeight','Estimated peak motor power / mass','W/kg',2],['massG','Car weight','g',1],['lapSpeed','Measured average speed','km/h',2]];
  function compare(a,b,goal='speed'){
    const av=T.calculate(C.inputOf(a)),bv=T.calculate(C.inputOf(b));
    const rpmBasis=a.motorType===b.motorType&&Number(a.ratedVoltage)>0&&Number(a.ratedVoltage)===Number(b.ratedVoltage);
    const torqueBasis=a.motorType===b.motorType&&a.torqueType===b.torqueType&&Number(a.torqueVoltage)>0&&Number(a.torqueVoltage)===Number(b.torqueVoltage);
    const allBasis=rpmBasis&&torqueBasis;
    return metrics.map(([key,label,unit,digits])=>{
      const x=av.motor[key]??av[key]??null,y=bv.motor[key]??bv[key]??null;
      const supported=x!==null&&y!==null;
      const sameBasis=key==='speedKmh'?rpmBasis:key==='forceN'?torqueBasis:['peakPowerW','powerToWeight'].includes(key)?allBasis:true;
      const delta=supported?y-x:null,percent=supported&&x!==0?delta/x*100:null;
      const judged=goal==='speed'?['speedKmh','forceN']:goal==='force'?['forceN','speedKmh']:goal==='power'?['powerToWeight']:[];
      const tone=sameBasis&&supported&&judged.includes(key)&&Math.abs(delta)>1e-9?(delta>0?'good':'bad'):'neutral';
      return {key,label,unit,digits,a:x,b:y,delta,percent,sameBasis,tone};
    });
  }
  const api={metrics,compare};if(node)module.exports=api;else root.CompareModel=api;
})(globalThis);
