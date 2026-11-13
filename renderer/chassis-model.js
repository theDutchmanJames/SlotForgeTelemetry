(function(root){
  'use strict';
  const Fit=typeof module==='object'&&module.exports?require('./fit-model.js'):root.FitModel;
  const number=(label,min=0,max=1000)=>({label,type:'number',min,max});
  const select=(label,options)=>({label,type:'select',options});
  const text=(label,max=1000)=>({label,type:'text',max});
  const readings=label=>({label,type:'textarea',max:1000});
  const fields={
    chassisGuideSpan:number('Guide pivot to rear axle · mm',0.001),
    chassisTrackMethod:select('Rear width measurement',['centres|Tyre contact centres','outside|Outside width and individual tyre widths']),
    chassisTrack:number('Rear tyre contact centre spacing · mm',0.001),
    chassisOutside:number('Overall outside rear tyre width · mm',0.001),
    chassisLeftWidth:number('Left rear tyre width · mm',0.001),chassisRightWidth:number('Right rear tyre width · mm',0.001),
    chassisMode:select('Weighing supports',['none|Geometry only','axle|Front axle + rear axle; guide clear','guide|Guide support + rear axle; front wheels clear','tripod|Guide support + separate rear tyres; front wheels clear','mixed|Guide and front wheels both carry load']),
    chassisSupportReference:select('Front weighing support position',['pivot|Assume centred at guide pivot','measured|Use measured support-to-rear-axle distance']),
    chassisSupportSpan:number('Actual front support to rear axle · mm',0.001),
    chassisConfirmed:select('Weighing conditions',['no|Not confirmed','yes|Level, non-magnetic, only selected supports loaded']),
    chassisFront:readings('Front support readings · g'),chassisRear:readings('Combined rear axle readings · g'),
    chassisLeft:readings('Left rear readings · g'),chassisRight:readings('Right rear readings · g'),
    chassisBound:number('Absolute bound for each support reading · ± g',0,100000),
    chassisCheckMass:number('Independent total mass measurement · g',0.001,100000),
    chassisCheckBound:number('Independent mass measurement bound · ± g',0,100000),
    chassisNotes:text('Fixture, support position, scale and measurement notes',1500),
    chassisChanges:{...text('Ballast changes',10000),type:'hidden',default:'[]'},
    chassisMap:{...text('Chassis drawing references',500),type:'hidden',default:''},
    chassisTarget:number('Desired rear support share · %',0,100),
    chassisTargetX:number('Target ballast behind front support · mm',-1000),
    chassisTargetY:number('Target ballast right of centreline · mm',-1000),
    chassisMaxMass:number('Maximum total mass for this plan · g',0.001,100000)
  };
  const defaults=()=>Object.fromEntries(Object.entries(fields).map(([k,f])=>[k,f.default??(f.type==='select'?f.options[0].split('|')[0]:'')]));
  function numeric(raw,min=0,max=100000){
    if(typeof raw!=='string'||raw.length>32||! /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(raw.trim()))throw Error('Use finite numbers with decimal points.');
    const n=Number(raw);if(!Number.isFinite(n)||n<min||n>max)throw Error(`Value must be between ${min} and ${max}.`);return n;
  }
  function samples(raw){
    if(!raw.trim())return null;
    const parts=raw.trim().split(/[\s,;]+/);if(parts.length>20)throw Error('Use at most 20 repeat readings per support.');
    const values=parts.map(s=>numeric(s));
    return {values,count:values.length,mean:values.reduce((a,b)=>a+b,0)/values.length,min:Math.min(...values),max:Math.max(...values)};
  }
  function changes(raw){
    const rows=JSON.parse(raw);if(!Array.isArray(rows)||rows.length>30)throw Error('Use at most 30 ballast changes.');
    return rows.map((r,i)=>{
      if(!r||typeof r!=='object'||!['add','remove','move'].includes(r.action)||typeof r.name!=='string'||!r.name.trim()||r.name.length>100)throw Error(`Ballast row ${i+1}: choose an action and a name of 1–100 characters.`);
      const out={action:r.action,name:r.name.trim(),mass:numeric(r.mass,0.001)};
      if(r.space!==undefined&&r.space!=='drawing')throw Error('Unknown ballast position reference.');
      if(r.space==='drawing')out.space='drawing';
      for(const k of ['x','y',...(r.action==='move'?['toX','toY']:[])])out[k]=numeric(r[k],-1000,1000);
      if(out.space==='drawing'&&['x','y',...(r.action==='move'?['toX','toY']:[])].some(k=>Math.abs(out[k])>10))throw Error('Check the ballast position on the drawing.');
      return out;
    });
  }
  function clean(input){
    const out=defaults();
    for(const [k,f] of Object.entries(fields)){
      const v=input[k]===undefined?out[k]:input[k];if(typeof v!=='string')throw Error('Check '+f.label+'.');
      if(f.type==='number'){if(v!=='')numeric(v,f.min,f.max);}
      else if(f.type==='select'){if(!f.options.some(o=>o.split('|')[0]===v))throw Error('Check '+f.label+'.');}
      else if(v.length>f.max)throw Error(f.label+' is too long.');
      if(f.type==='textarea')samples(v);
      out[k]=v;
    }
    changes(out.chassisChanges);mapReferences(out.chassisMap);return out;
  }
  // Drawing coordinates only; never replace measured dimensions with SVG pixels.
  function mapReferences(raw=''){
    const r=raw===''?{guide:87,rear:580,centre:187,right:40,left:334}:JSON.parse(raw);
    if(!r||!['guide','rear','centre','right','left'].every(k=>Number.isFinite(r[k]))||
      r.guide<0||r.rear>687||r.rear-r.guide<100||r.right<0||r.left>376.4||r.centre-r.right<20||r.left-r.centre<20)
      throw Error('Check the chassis drawing references: guide ahead of rear axle, with left and right contacts on opposite sides of the centreline.');
    return Object.fromEntries(['guide','rear','centre','right','left'].map(k=>[k,r[k]]));
  }
  const n=(c,k)=>c[k]===''?null:Number(c[k]);
  const summarize=(loads,span,track,tripod)=>{
    const mass=loads.reduce((a,b)=>a+b,0),rear=loads.slice(1).reduce((a,b)=>a+b,0);
    if(!(mass>0)||loads.some(v=>v < -1e-8))throw Error('This plan has non-positive total mass or a negative final support load. Check removals and positions.');
    loads=loads.map(v=>Math.max(0,v));
    return {loads,mass,rear,frontShare:loads[0]/mass*100,rearShare:rear/mass*100,x:span===null?null:span*rear/mass,
      y:tripod&&track!==null?track*(loads[2]-loads[1])/(2*mass):null,
      rearLeftShare:tripod&&rear>0?loads[1]/rear*100:null,rearRightShare:tripod&&rear>0?loads[2]/rear*100:null};
  };
  function effect(m,x,y,span,track,tripod){
    const rear=m*x/span;return tripod?[m-rear,rear/2-m*y/track,rear/2+m*y/track]:[m-rear,rear];
  }
  function calculate(input){
    const r={error:'',notes:[],geometry:null,baseline:null,planned:null,target:null,bounds:null,repeats:[],changes:[],span:null,track:null,mode:'none'};
    try{
      const c=clean(input),L=n(c,'chassisGuideSpan');r.mode=c.chassisMode;
      const tripod=r.mode==='tripod';
      let T=n(c,'chassisTrack');
      if(c.chassisTrackMethod==='outside'){
        const a=['chassisOutside','chassisLeftWidth','chassisRightWidth'].map(k=>n(c,k));
        T=a.every(v=>v!==null)?a[0]-(a[1]+a[2])/2:null;
        if(T!==null&&a[0]<a[1]+a[2])throw Error('Outside width is smaller than the two tyre widths combined. Check the measurements.');
        if(T!==null)r.notes.push('Rear contact centres are estimated from tyre widths; actual contact patches may differ.');
      }
      r.track=T;
      if(L!==null&&T!==null){
        const wb=input.wheelbase===''||input.wheelbase==null?null:numeric(input.wheelbase,0.001,1000);
        r.geometry={length:L,track:T,angle:2*Math.atan(T/(2*L))*180/Math.PI,ratio:L/T,side:Math.hypot(L,T/2),frontOffset:wb===null?null:L-wb};
      }
      r.changes=changes(c.chassisChanges);
      if(r.mode==='none'||r.mode==='mixed'){
        if(r.mode==='mixed')r.notes.push('Guide and front wheels both carry load: tripod balance cannot be inferred. Geometry and notes remain available.');
        else if(r.changes.length)r.notes.push('Ballast rows are recorded. Select a weighing method and enter its readings to calculate the plan.');
        return r;
      }
      r.span=r.mode==='axle'?(input.wheelbase===''||input.wheelbase==null?null:numeric(input.wheelbase,0.001,1000)):
        c.chassisSupportReference==='pivot'?L:n(c,'chassisSupportSpan');
      if(r.mode!=='axle'&&c.chassisSupportReference==='pivot')r.notes.push('Balance assumes the front support is centred at the guide pivot. The braid contact position may differ.');
      const keys=tripod?['chassisFront','chassisLeft','chassisRight']:['chassisFront','chassisRear'];
      r.repeats=keys.map(k=>samples(c[k]));
      if(c.chassisConfirmed!=='yes'){r.notes.push('Confirm level, non-magnetic weighing with only the selected supports loaded before calculating balance.');return r;}
      if(r.repeats.some(s=>s===null)){r.notes.push('Enter all selected support readings. Blank means unmeasured, not zero.');return r;}
      r.baseline=summarize(r.repeats.map(s=>s.mean),r.span,T,tripod);
      if(r.span===null)r.notes.push('The support span is missing: longitudinal CG is unavailable.');
      if(tripod&&T===null)r.notes.push('Rear contact centre spacing is missing: lateral CG is unavailable.');
      const check=n(c,'chassisCheckMass'),bound=n(c,'chassisBound'),checkBound=n(c,'chassisCheckBound');
      r.massDifference=check===null?null:r.baseline.mass-check;
      r.massTolerance=bound!==null&&checkBound!==null?keys.length*bound+checkBound:null;
      if(r.massDifference!==null)r.notes.push(r.massTolerance===null?'Mass difference is descriptive: enter both absolute measurement bounds to assess agreement.':Math.abs(r.massDifference)>r.massTolerance?'Support total and independent mass differ by more than the entered bounds. Check tare, support heights and unwanted contacts.':'Support total and independent mass agree within the entered bounds; this does not validate the weighing method.');
      if(bound!==null){
        const corners=[];
        for(let mask=0;mask<2**keys.length;mask++){
          const v=r.baseline.loads.map((q,i)=>Math.max(0,q+((mask>>i)&1?bound:-bound)));
          if(v.reduce((a,b)=>a+b,0)>0)corners.push(summarize(v,r.span,T,tripod));
        }
        if(r.baseline.mass-keys.length*bound<=0)r.notes.push('Entered bounds include zero total load; percentage and CG bounds are unavailable.');
        else r.bounds=Object.fromEntries(['mass','frontShare','rearShare','x','y'].map(k=>[k,corners[0][k]===null?null:[Math.min(...corners.map(v=>v[k])),Math.max(...corners.map(v=>v[k]))]]));
      }
      if(r.span===null||(tripod&&T===null)){r.notes.push('Add the support span and, for three-point planning, rear contact centre spacing to calculate CG and ballast changes.');return r;}
      if(r.changes.some(row=>row.space==='drawing')&&(L===null||T===null)){r.notes.push('Drawing placements are saved. Add guide-to-rear-axle distance and rear contact spacing to calculate this plan in millimetres.');return r;}
      let loads=[...r.baseline.loads];
      for(const source of r.changes){
        const row=resolveChange(source,L,r.span,T);
        if(row.action!=='add'&&row.mass>loads.reduce((a,b)=>a+b,0)+1e-9)throw Error('The part being moved or removed exceeds the car mass at this step.');
        if(!tripod&&source.space!=='drawing'&&(row.y!==0||(row.action==='move'&&row.toY!==0)))throw Error('Two-support planning uses y = 0. Select three-point weighing for lateral changes.');
        if(!tripod&&source.space==='drawing'&&(row.y!==0||(row.action==='move'&&row.toY!==0))&&!r.notes.includes('Two-support weighing calculates front/rear loads only; lateral drawing positions are retained but no left/right load split is inferred.'))r.notes.push('Two-support weighing calculates front/rear loads only; lateral drawing positions are retained but no left/right load split is inferred.');
        const parts=row.action==='move'?[[-row.mass,row.x,row.y],[row.mass,row.toX,row.toY]]:[[row.action==='remove'?-row.mass:row.mass,row.x,row.y]];
        for(const [m,x,y] of parts){const d=effect(m,x,y,r.span,T,tripod);loads=loads.map((v,i)=>v+d[i]);}
      }
      r.planned=summarize(loads,r.span,T,tripod);
      const max=n(c,'chassisMaxMass');r.massMargin=max===null?null:max-r.planned.mass;
      if(r.massMargin!==null&&r.massMargin<0)r.notes.push('Planned mass exceeds your entered maximum.');
      if(r.planned.loads.some(v=>v<=1e-8))r.notes.push('A final support has zero load: this is the boundary of the assumed support arrangement.');
      const target=n(c,'chassisTarget'),x=n(c,'chassisTargetX'),y=tripod?n(c,'chassisTargetY'):0;
      if(target!==null&&x!==null&&y!==null){
        const numerator=target/100*r.planned.mass-r.planned.rear,denominator=x/r.span-target/100;
        const mass=Math.abs(numerator)<1e-8?0:Math.abs(denominator)<1e-12?null:numerator/denominator;
        if(!Fit.additionFits(mass,r.planned.mass,max))r.notes.push('No ballast addition within this plan’s mass budget reaches the target. Move existing mass or choose another position.');
        else {
          const delta=effect(mass,x,y,r.span,T,tripod),next=loads.map((v,i)=>v+delta[i]);
          if(next.some(v=>v < -1e-8))r.notes.push('The target would unload a support below zero; it is not feasible in this arrangement.');
          else {
            r.target={addedMass:mass,...summarize(next,r.span,T,tripod),massMargin:max===null?null:max-r.planned.mass-mass};
            if(r.target.massMargin!==null&&r.target.massMargin<0)r.notes.push('The target suggestion exceeds your entered maximum mass.');
          }
        }
      }
      return r;
    }catch(e){r.error=e.message;return r;}
  }
  function snapshot(input){
    const cleanInput=clean(input),result=calculate(input);if(result.error)throw Error(result.error);
    return {...cleanInput,wheelbase:input.wheelbase??'',totalWeight:input.totalWeight??''};
  }
  function resolveChange(row,length,span,track){
    if(row.space!=='drawing')return row;
    if(!(length>0&&span>0&&track>0))throw Error('Dimensions are needed to convert drawing placements to millimetres.');
    const out={...row,x:row.x*length-(length-span),y:row.y*track/2};
    if(row.action==='move'){out.toX=row.toX*length-(length-span);out.toY=row.toY*track/2;}
    return out;
  }
  const api={fields,defaults,numeric,samples,changes,clean,calculate,snapshot,mapReferences,resolveChange};
  if(typeof module==='object'&&module.exports)module.exports=api;else root.ChassisModel=api;
})(globalThis);
