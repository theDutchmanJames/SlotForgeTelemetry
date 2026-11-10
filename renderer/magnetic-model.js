(function(root){
  const P=typeof module==='object'&&module.exports?require('./performance-model.js'):root.PerformanceModel;
  const GF_TO_N=0.00980665;
  const numeric={magneticClearance:1000,magneticWornClearance:1000,magneticLimit:100000};
  const text={magneticReadings:2000,magneticCurve:4000,magneticTester:200,magneticRails:200,magneticOrientation:200};
  const choices={magneticExtra:['unknown','none','fitted'],magneticCondition:['unknown','off','running'],magneticWearMode:['measured','axle']};
  const defaults=()=>({...Object.fromEntries([...Object.keys(numeric),...Object.keys(text)].map(k=>[k,''])),...Object.fromEntries(Object.entries(choices).map(([k,v])=>[k,v[0]]))});
  function readings(raw){
    if(!raw.trim())return [];
    const parts=raw.trim().split(/[\s,;]+/);
    if(parts.length>100)throw Error('Use at most 100 magnetic pull readings.');
    return parts.map(v=>{const n=P.number(v,100000,true);if(n===null)throw Error('Magnetic readings must be non-negative gf values, using decimal points.');return n;});
  }
  function curve(raw){
    if(!raw.trim())return [];
    const lines=raw.trim().split(/\r?\n/).filter(v=>v.trim());
    if(lines.length>50)throw Error('Use at most 50 clearance curve points.');
    const points=lines.map((line,i)=>{
      const parts=line.trim().split(/[\s,;]+/),h=P.number(parts[0],1000,true),f=P.number(parts[1],100000,true);
      if(parts.length!==2||h===null||f===null)throw Error('Curve row '+(i+1)+': enter clearance (mm), pull (gf), using decimal points.');
      return {height:h,pull:f};
    }).sort((a,b)=>a.height-b.height);
    if(points.some((p,i)=>i&&p.height===points[i-1].height))throw Error('Use one curve point per clearance; average repeated readings first.');
    if(points.some((p,i)=>i&&!Number.isFinite((p.pull-points[i-1].pull)/(p.height-points[i-1].height))))throw Error('Curve clearances are too close together to calculate sensitivity.');
    return points;
  }
  function clean(input){
    const out=defaults();
    for(const [key,max] of Object.entries(numeric)){
      const value=input[key]===undefined?out[key]:input[key];
      if(typeof value!=='string'||value.length>32||(value!==''&&P.number(value,max,true)===null))throw Error('Check '+({magneticClearance:'motor clearance',magneticWornClearance:'worn motor clearance',magneticLimit:'magnetic pull limit'}[key])+'.');
      out[key]=value===''?'':String(P.number(value,max,true));
    }
    for(const [key,max] of Object.entries(text)){
      const value=input[key]===undefined?out[key]:input[key];
      if(typeof value!=='string'||value.length>max)throw Error('Magnetic measurement text is too long or invalid.');
      out[key]=value;
    }
    for(const [key,values] of Object.entries(choices)){
      const value=input[key]===undefined?out[key]:input[key];
      if(!values.includes(value))throw Error('Choose a valid magnetic measurement condition.');
      out[key]=value;
    }
    readings(out.magneticReadings);curve(out.magneticCurve);return out;
  }
  function interpolate(points,height){
    if(height===null||!Number.isFinite(height)||!points.length||height<0)return null;
    // Rear-axle arithmetic can land a few binary floating-point units beyond
    // a measured endpoint. Allow roundoff only, never a meaningful extension.
    const tolerance=8*Number.EPSILON*Math.max(1,Math.abs(height));
    if(height<points[0].height&&points[0].height-height<=tolerance)height=points[0].height;
    if(height>points.at(-1).height&&height-points.at(-1).height<=tolerance)height=points.at(-1).height;
    if(height<points[0].height||height>points.at(-1).height)return null;
    const exact=points.find(p=>p.height===height);if(exact)return exact.pull;
    const i=points.findIndex(p=>p.height>height),a=points[i-1],b=points[i];
    return a.pull+(b.pull-a.pull)*(height-a.height)/(b.height-a.height);
  }
  function calculate(input,massG=null,rideHeightChange=null){
    let c;try{c=clean(input);}catch(e){return {error:e.message};}
    const values=readings(c.magneticReadings),points=curve(c.magneticCurve),count=values.length;
    const mean=count?values.reduce((a,b)=>a+b,0)/count:null,min=count?Math.min(...values):null,max=count?Math.max(...values):null;
    const height=P.number(c.magneticClearance,1000,true),limit=P.number(c.magneticLimit,100000,true);
    const rawWornHeight=c.magneticWearMode==='axle'?(height!==null&&rideHeightChange!==null?height+rideHeightChange:null):P.number(c.magneticWornClearance,1000,true);
    const wornContact=rawWornHeight!==null&&rawWornHeight<0,wornHeight=wornContact?null:rawWornHeight;
    const estimate=interpolate(points,height),wornEstimate=interpolate(points,wornHeight);
    const hasMass=Number.isFinite(massG)&&massG>0;
    return {error:'',count,mean,min,max,range:count?max-min:null,forceN:mean===null?null:mean*GF_TO_N,
      loadPercent:mean!==null&&hasMass?mean/massG*100:null,supportN:mean!==null&&hasMass?(massG+mean)*GF_TO_N:null,
      supportGf:mean!==null&&hasMass?massG+mean:null,massG:hasMass?massG:null,height,wornHeight,wornContact,estimate,wornEstimate,
      estimateChange:estimate!==null&&wornEstimate!==null?wornEstimate-estimate:null,
      limit,margin:mean!==null&&limit!==null?limit-mean:null,minMargin:max!==null&&limit!==null?limit-max:null,
      points,segments:points.slice(1).map((p,i)=>({from:points[i].height,to:p.height,slope:(p.pull-points[i].pull)/(p.height-points[i].height)})),
      increasing:points.some((p,i)=>i&&p.pull>points[i-1].pull),approximate:c.magneticWearMode==='axle'};
  }
  function sameConditions(a,b){
    const fields=['magneticTester','magneticRails','magneticOrientation'];
    return fields.every(k=>typeof a[k]==='string'&&a[k].trim()&&a[k].trim()===b[k]?.trim())&&
      ['magneticExtra','magneticCondition'].every(k=>a[k]&&a[k]!=='unknown'&&a[k]===b[k]);
  }
  const api={GF_TO_N,defaults,clean,readings,curve,interpolate,calculate,sameConditions};
  if(typeof module==='object'&&module.exports)module.exports=api;else root.MagneticModel=api;
})(globalThis);
