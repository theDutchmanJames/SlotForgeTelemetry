(function(root){
  'use strict';
  const P=typeof module==='object'&&module.exports?require('./performance-model.js'):root.PerformanceModel;
  const Fit=typeof module==='object'&&module.exports?require('./fit-model.js'):root.FitModel;
  const num=(label,max=100000,zero=true)=>({label,type:'number',max,min:zero?0:0.000001});
  const signed=label=>({...num(label),min:-100000});
  const text=(label,max=500)=>({label,type:'text',max});
  const lines=(label,example)=>({label,type:'textarea',max:6000,example});
  const choice=(label,options)=>({label,type:'select',options});
  const fields={
    tyreSet:{...text('Tyre set / compound / track / conditions'),help:'Saved notes only; these words do not change the calculations or assign a grip value.'},
    tyreMinimum:{...num('Minimum usable tyre diameter · mm',1000,false),inputMin:8,inputMax:30,help:'Smallest usable fitted diameter for this tyre and class. Leave blank if unknown. The current gear clearance is calculated separately from your fitted tyre and gear.'},
    tyreRequiredGap:{...num('Minimum permitted gear-to-track gap · mm (optional)',1000),inputMax:3,help:'Only for a class or clearance requirement, usually a fraction of a millimetre. Leave blank to see the actual gap without setting a target. This input accepts 0–3 mm for 1:32 setup planning.'},
    tyreLeft:{...num('Left tyre diameter · mm',1000,false),inputMin:8,inputMax:30},tyreRight:{...num('Right tyre diameter · mm',1000,false),inputMin:8,inputMax:30},
    tyreSamples:{...lines('Diameters measured around one tyre · mm','20.01, 20.02, 20.00'),help:'Measure the same tyre at different positions at one point in time. Two or more readings show diameter spread, not wear over laps.'},
    tyreHistory:{...lines('Wear history · cumulative laps, diameter mm','0, 20.4\n500, 20.2\n1000, 20.0'),help:'One row per measurement: cumulative lap count, then fitted outside diameter in mm. At least two rows at different lap counts are needed for wear rate. Use the same tyre set; start again after truing or replacement. Current left/right diameter readings do not provide a wear history.'},
    electricalMode:choice('Electrical measurement',['unknown|Choose measurement type','dc|Steady DC under load','pulsed|Digital / pulsed / PWM']),
    electricalNotes:text('Load / meter / lane / test conditions'),
    electricalRows:lines('Location | supply V | rail V | measured A','Lane 1 start | 12 | 11.4 | 2\nLane 1 far end | 12 | 11.2 | 2'),
    motorBenchNotes:text('Tester / temperature / measurement conditions'),
    motorBenchElectrical:choice('Motor electrical measurement',['unknown|Not confirmed','dc|Steady DC at the same operating point','pulsed|Pulsed / PWM']),
    motorBenchRows:lines('Motor / date | mode | direction | V | RPM | A | force gf | arm cm','Motor 1 / test 1 | no-load | CW | 12 | 21000 | 0.2 | - | -\nMotor 1 / test 2 | loaded | CW | 12 | 10000 | 1 | 10 | 10'),
    strategyLaps:num('Planned race distance · laps',1000000,false),strategyPace:num('Base mean lap time · s',100000,false),
    strategyIncidents:num('Expected incidents per 100 laps',10000),strategyRecovery:num('Additional loss per incident · s'),
    strategyStops:num('Planned pit stops',10000),strategyPitLoss:num('Additional loss per pit stop · s'),
    strategyGain:num('Alternative setup gain per lap · s'),strategyExtraStop:num('Alternative extra stop cost · s'),
    strategyNotes:text('Race / lane / driver / assumptions'),
    balanceSupport:choice('Front support used for weighing',['axle|Front axle; guide clear','guide|Guide; front wheels clear']),
    balanceSpan:num('Front support to rear axle · mm',1000,false),balanceFront:num('Front support scale reading · g'),balanceRear:num('Rear axle scale reading · g'),
    balanceChanges:lines('Part | added/removed mass g | x behind front support mm','Front ballast | 5 | 10\nRear ballast | 10 | 70\nRemoved part | -2 | 40'),
    balanceTarget:num('Desired rear support share · %',100),balanceTargetX:signed('Target ballast position behind front support · mm'),
    balanceMax:num('Maximum total mass for this plan · g',100000,false),
    experimentConfirmed:choice('Are driver, lane and test conditions comparable?',['no|Not confirmed','yes|Yes, recorded below']),
    experimentConditions:text('Driver / lane / voltage / tyres / conditions / change',1000),
    experimentSources:{...lines('Recorded-lap snapshots used in this test','Copied run identities and dates appear here.'),max:4000},
    experimentRows:lines('Run | A/B | laps in seconds | optional incidents | optional incident loss s','A before | A | 5.1, 5.0, 5.2\nB trial | B | 4.9, 4.8, 5.0\nA after | A | 5.0, 5.1, 5.2'),
    rulesName:text('Class / rules revision / measurement procedure'),
    rulesRows:lines('Measurement / location | value | minimum or - | maximum or - | unit','Mass | 84 | 80 | - | g\nUnder motor | 1.15 | 1 | - | mm\nOverall width | 62 | - | 64 | mm'),
    gearStages:lines('Each compound stage · driving teeth, driven teeth','9, 27\n10, 20'),
    gearPitchMode:choice('Standard external spur gear specification',['module|Module · mm','dp|Diametral pitch · teeth/inch']),
    gearPitch:num('Module or diametral pitch value',1000,false),gearDriver:num('Driving spur teeth',10000,false),gearDriven:num('Driven spur teeth',10000,false),
    inertiaRows:lines('Part | mass g | outer radius mm | inner radius mm | revs per axle rev','Two tyres | 4 | 10 | 8 | 1\nTwo rims | 3 | 8 | 0 | 1'),
    inertiaForce:num('Driving force at this operating point · N',10000),
    brakeMode:choice('Measurement type',['brake|Braking','coast|Coast-down']),
    brakeNotes:text('Controller / track / voltage / measurement method'),
    brakeRows:lines('Time s, measured speed km/h','0, 18\n0.2, 12\n0.4, 6\n0.6, 0'),
    rangeDiameter:num('Tyre diameter measurement bound · ± mm',1000),rangeRpm:num('Motor RPM measurement bound · ± RPM',10000000),rangePull:num('Magnetic pull measurement bound · ± gf',100000)
  };
  const tools={
    tyres:{title:'Tyre preparation & life',category:'tyres',icon:'wheel-tyre-set',keys:['tyreSet','tyreMinimum','tyreRequiredGap','tyreLeft','tyreRight','tyreSamples','tyreHistory'],
      intro:'Uses fitted tyre diameter, gear outside diameter and target rollout from your setup. Record one tyre set under comparable conditions. Start a new history after truing, replacement or a compound change.',
      formula:'Minimum tyre diameter for required gear gap = gear outside diameter + 2 × required gap. Target diameter = target rollout × ratio ÷ π. Wear rate = diameter loss ÷ laps. Remaining laps = (latest diameter − minimum) ÷ measured wear rate. Circumference mismatch = π × |left diameter − right diameter|.',
      limits:'Wear forecasts assume future wear resembles this history. The range uses the slowest and fastest measured intervals, not statistical confidence. Gear clearance alone cannot establish chassis or motor clearance. Diameter spread around a tyre is not dial-indicator radial runout (TIR).',example:'20.4 → 20.2 mm over 500 laps loses 0.04 mm per 100 laps. At 20.2 mm with a 19.8 mm minimum, the same rate suggests 1,000 more laps.'},
    electrical:{title:'Electrical losses',category:'power',icon:'motor-tester',keys:['electricalMode','electricalNotes','electricalRows'],
      intro:'Measure supply and rail voltage under the same steady load, plus actual current. Separate locations with new lines. The power supply current rating is not a current measurement.',
      formula:'Drop = supply V − rail V. Drop % = drop ÷ supply × 100. Effective loop resistance = drop ÷ measured A. Power loss = drop × measured A.',
      limits:'Calculations require confirmed steady DC and comparable measurement conditions. Digital/PWM readings depend on waveform and equipment; mean voltage × mean current need not equal real power. Do not bridge rails or improvise a high-current test load.',example:'12 V supply, 11.4 V rails and 2 A gives 0.6 V / 5% drop, 0.3 Ω resistance and 1.2 W loss.'},
    motor:{title:'Motor test records',category:'motor',icon:'short-can-motor',keys:['motorBenchNotes','motorBenchElectrical','motorBenchRows'],
      intro:'Modes: no-load, stall or loaded. Direction: CW / CCW viewed from the same shaft end. Use - for an unmeasured optional value. Each row is one test, with a motor identifier and date in its label.',
      formula:'Torque gf·cm = force gf × perpendicular arm cm. Torque N·m = gf·cm × 0.0000980665. Mechanical W = torque N·m × RPM × 2π ÷ 60. Steady-DC input W = V × A. Efficiency = mechanical W ÷ input W × 100.',
      limits:'Enter readings from suitable equipment; this is not a stall-testing procedure. Loaded torque and RPM must be measured together, with voltage/current at that same operating point. Efficiency assumes steady DC. No-load and stall rows are kept separate; they never combine into measured running power. Temperature, direction and voltage affect comparisons.',example:'10 gf at a 10 cm arm = 100 gf·cm. At a measured loaded 10,000 RPM this is 10.27 W; at 12 V and 1 A, efficiency is 85.58%.'},
    strategy:{title:'Race strategy',category:'speed',icon:'timer',keys:['strategyNotes','strategyLaps','strategyPace','strategyIncidents','strategyRecovery','strategyStops','strategyPitLoss','strategyGain','strategyExtraStop'],
      intro:'Use a representative mean base lap, excluding losses you enter separately. Explicit zero means no incidents or stops. Blank means unknown. Stop losses include entry/exit time above a normal lap.',
      formula:'Expected incidents = laps × incidents per 100 ÷ 100. Expected duration = laps × base mean + expected incidents × recovery loss + stops × pit loss. Break-even laps = extra stop cost ÷ per-lap gain.',
      limits:'A scenario, not an official race result. Do not add losses already included in the base mean. Slow laps cannot identify incidents automatically. Penalties, track calls, finishing rules and virtual fuel models are excluded. Incident rate describes this scenario, not a guarantee.',example:'0.10 s gained over 50 laps saves 5 s. An extra 6 s stop needs 60 subsequent laps at that gain just to break even.'},
    balance:{title:'Ballast planning',category:'weight',icon:'scales',keys:['balanceSupport','balanceSpan','balanceFront','balanceRear','balanceChanges','balanceTarget','balanceTargetX','balanceMax'],
      intro:'Independent static plan: these changes do not modify the main car weight. Weigh level with no magnetic pull. Choose front axle with guide clear, or guide support with front wheels clear. x = 0 at that front support.',
      formula:'New mass = original front + rear readings + Σ added/removed mass. Rear load = original rear + Σ(m × x ÷ span). Front load = new mass − rear. CG x = span × rear ÷ mass. Target ballast = (target fraction × mass − rear) ÷ (ballast x ÷ span − target fraction).',
      limits:'Two supports only. When front wheels and guide both carry load, this model is insufficient. Negative masses mean removing actual parts at their centres of mass. No lateral/vertical CG or dynamic load transfer is inferred. A mathematically possible target is not an optimal handling recommendation.',example:'32 g front + 48 g rear at 80 mm span: add 20 g at x = 60 mm for 37 g front and 63 g rear.'},
    experiment:{title:'Controlled A–B–A tests',category:'speed',icon:'transfer',keys:['experimentConfirmed','experimentConditions','experimentSources','experimentRows'],
      intro:'Enter runs in chronological order. Alternate A (original) and B (changed), then return to A. Keep valid slow laps; exclude pit/invalid laps deliberately and record incidents separately. Each row accepts up to 100 laps. Optionally append two more | columns: incident count and measured loss in seconds (use - if unknown). These are observations, not added again to lap times.',
      formula:'Per run: mean, median and middle-50% spread (Q3 − Q1). Setup comparison averages run means with equal weight per run. Return-to-A change = last A mean − first A mean.',
      limits:'Descriptive results only: laps in a run are not independent experiments. Different sample sizes, learning, track grip and temperature confound conclusions. No significance or causal claim. A–B–A flags ordering only; comparable conditions must be recorded and confirmed.',example:'A = 5.1 s, B = 4.9 s, returning A = 5.1 s suggests a repeatable direction worth testing again, not proof that the change alone caused it.'},
    rules:{title:'Class limits',category:'weight',icon:'list',keys:['rulesName','rulesRows'],
      intro:'Record the class and revision yourself. Every measurement includes a location, value, unit and at least one limit. Use - for an absent minimum or maximum. Include all measurements needed for your class.',
      formula:'Minimum margin = measured value − minimum. Maximum margin = maximum − measured value. Non-negative margins meet the entered numerical limits; zero is exactly on the boundary.',
      limits:'Checks only the entered values, not all class rules or measurement uncertainty. No automatic certification. Motor, chassis and guide clearances may be separate requirements. Match units and the official measurement procedure.',example:'1.15 mm measured under the motor against a 1.00 mm minimum gives +0.15 mm margin.'},
    gears:{title:'Compound gears & geometry',category:'gearing',icon:'spur-gear',keys:['gearStages','gearPitchMode','gearPitch','gearDriver','gearDriven'],
      intro:'Each row is a true reduction stage; intermediate compound gears share a shaft. Do not add simple idlers as extra reductions. Geometry below is for standard unshifted external spur gears with matching module and pressure angle.',
      formula:'Overall ratio = product of (driven teeth ÷ driving teeth). Compound rollout = π × fitted diameter ÷ overall ratio. Module mm = 25.4 ÷ diametral pitch. Pitch diameter = module × teeth. Standard centre distance = module × (teeth A + teeth B) ÷ 2.',
      limits:'A separate scenario: the main single-stage drivetrain is unchanged. Geometry does not validate crown, bevel, anglewinder, profile-shifted or proprietary fixed-diameter gears. Check actual parts and mesh. Pitch diameter is not outside diameter.',example:'9:27 followed by 10:20 gives 6:1. Module 0.5 with 10 and 30 teeth gives 5 and 15 mm pitch diameters and 10 mm nominal centres.'},
    inertia:{title:'Rotating mass',category:'weight',icon:'wheel-tyre-set',keys:['inertiaRows','inertiaForce'],
      intro:'Uses main car mass and fitted tyre radius. Main car mass must already include all listed components. Treat each part as a uniform annulus (inner radius zero gives a solid cylinder). Enter only components you can characterize.',
      formula:'I = mass kg × (outer radius m² + inner radius m²) ÷ 2. Equivalent inertia mass = Σ(I × speed ratio²) ÷ rolling radius². Ideal effective mass = actual car mass + equivalent inertia mass. Ideal acceleration = entered force ÷ effective mass.',
      limits:'Educational approximation, not a lap-time prediction. Unlisted motor/axle inertia is omitted. Material distribution may not be uniform. Ignore traction, drag, losses, tyre growth and compliance. Force must describe one operating point, not no-load speed and stall force combined.',example:'A 4 g thin ring at the rolling radius adds approximately 4 g of equivalent inertia mass, in addition to its existing contribution to actual car mass.'},
    braking:{title:'Braking & coast-down',category:'speed',icon:'timer',keys:['brakeMode','brakeNotes','brakeRows'],
      intro:'Enter measured time/speed samples in time order. Use a speed sensor, timed positions or suitable video measurements. Ordinary lap times and controller brake percentages cannot supply this trace.',
      formula:'Speed m/s = km/h ÷ 3.6. Interval distance ≈ (v₁ + v₂) ÷ 2 × Δt. Interval mean deceleration = (v₁ − v₂) ÷ Δt. Recorded distance = sum of interval distances.',
      limits:'Assumes linear speed change between samples. Distance is only for the recorded window, and is called a stopping distance only when the final sample is zero. No extrapolation. Negative deceleration means speed increased; check the trace and conditions.',example:'18 km/h decreasing linearly to zero over 0.6 s gives 1.5 m distance and 8.33 m/s² mean deceleration.'},
    ranges:{title:'Measurement ranges',category:'motor',icon:'scales',keys:['rangeDiameter','rangeRpm','rangePull'],
      intro:'Uses your fitted diameter, no-load RPM, gear outside diameter and mean magnetic pull. Enter absolute ± bounds. Enter 0 for a quantity treated as exact; leave blank if its bound is unknown.',
      formula:'Evaluate outputs at the input interval endpoints: rollout ∝ diameter, speed ∝ diameter × RPM, gear clearance = (diameter − gear outside diameter) ÷ 2, magnetic force = pull × 0.00980665.',
      limits:'Worst-case input bounds, not statistical confidence or instrument calibration. Assumes exact tooth counts and gear outside diameter; other sources of error remain. No conversion from these ranges to grip, actual speed or lap-time uncertainty.',example:'20.00 ± 0.05 mm tyre diameter means nominal gear clearance varies by ±0.025 mm when gear outside diameter is treated as exact.'}
  };
  const defaults=()=>Object.fromEntries(Object.entries(fields).map(([k,f])=>[k,f.type==='select'?f.options[0].split('|')[0]:'']));
  function value(raw,min=0,max=100000000){
    if(typeof raw!=='string'||raw.length>32||! /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(raw.trim()))throw Error('Use finite numbers with decimal points.');
    const n=Number(raw);if(!Number.isFinite(n)||n<min||n>max)throw Error(`Value must be between ${min} and ${max}.`);return n;
  }
  function records(raw,parse){
    if(!raw.trim())return [];
    const rows=raw.trim().split(/\r?\n/).filter(l=>l.trim());if(rows.length>50)throw Error('Use at most 50 rows per tool.');
    return rows.map((line,i)=>{try{return parse(line,i);}catch(e){throw Error(`Row ${i+1}: ${e.message}`);}});
  }
  function split(line,count){const p=line.split('|').map(x=>x.trim());if(p.length!==count)throw Error(`Expected ${count} columns separated by |.`);return p;}
  function label(v){if(!v||v.length>160)throw Error('Use a label of 1–160 characters.');return v;}
  function list(raw,max=100){const p=raw.trim().split(/[\s,;]+/);if(p.length>max)throw Error(`Use at most ${max} values.`);return p.map(x=>value(x,0.000001));}
  function pairs(raw,minA=0,minB=0){return records(raw,line=>{const p=line.trim().split(/[\s,;]+/);if(p.length!==2)throw Error('Expected two numeric columns.');return [value(p[0],minA),value(p[1],minB)];});}
  const optional=v=>v==='-'?null:value(v);
  function data(c,key){
    switch(key){
      case 'tyreSamples':return c[key].trim()?list(c[key]):[];
      case 'tyreHistory':{const r=pairs(c[key],0,0.000001);r.forEach((p,i)=>{if(!Number.isInteger(p[0]))throw Error('Cumulative laps must be whole numbers.');if(i&&(p[0]<=r[i-1][0]||p[1]>r[i-1][1]))throw Error('Wear history needs increasing laps and non-increasing diameters. Start a new history after truing or tyre changes.');});return r;}
      case 'electricalRows':return records(c[key],l=>{const [name,s,v,i]=split(l,4),supply=value(s,0.000001,1000),rail=value(v,0,1000),amps=value(i,0.000001,10000);if(rail>supply)throw Error('Rail voltage exceeds supply; check the same-load measurements.');return {name:label(name),supply,rail,amps};});
      case 'motorBenchRows':return records(c[key],l=>{const [name,mode,dir,v,r,a,f,arm]=split(l,8);if(!['no-load','stall','loaded'].includes(mode)||!['CW','CCW'].includes(dir))throw Error('Use mode no-load/stall/loaded and direction CW/CCW.');const row={name:label(name),mode,dir,v:value(v,0.000001,1000),rpm:value(r,0,10000000),amps:optional(a),force:optional(f),arm:optional(arm)};if((row.force===null)!==(row.arm===null)||(row.arm!==null&&row.arm<=0))throw Error('Force and a positive perpendicular arm length must be entered together.');if(mode==='stall'&&row.rpm!==0)throw Error('A stall reading requires zero RPM.');if(mode==='no-load'&&row.force!==null)throw Error('No-load tests cannot include external torque; use loaded mode.');if(mode==='loaded'&&(row.rpm<=0||row.force===null))throw Error('Loaded tests need positive RPM and measured torque-arm readings.');return row;});
      case 'balanceChanges':return records(c[key],l=>{const [name,m,x]=split(l,3);return {name:label(name),mass:value(m,-100000,100000),x:value(x,-100000,100000)};});
      case 'experimentRows':return records(c[key],l=>{const p=l.split('|').map(v=>v.trim());if(![3,5].includes(p.length))throw Error('Use 3 columns, or 5 including incident count and loss.');const [name,setup,times,inc='-',loss='-']=p;if(!['A','B'].includes(setup))throw Error('Setup must be A or B.');const incidents=optional(inc);if(incidents!==null&&!Number.isInteger(incidents))throw Error('Incident count must be whole.');return {name:label(name),setup,times:list(times),incidents,loss:optional(loss)};});
      case 'rulesRows':return records(c[key],l=>{const [name,v,lo,hi,unit]=split(l,5),row={name:label(name),v:value(v),lo:optional(lo),hi:optional(hi),unit:label(unit)};if(row.lo===null&&row.hi===null)throw Error('Enter at least one limit.');if(row.lo!==null&&row.hi!==null&&row.lo>row.hi)throw Error('Minimum cannot exceed maximum.');return row;});
      case 'gearStages':{const r=pairs(c[key],1,1);if(r.length>8||r.some(p=>p.some(n=>!Number.isInteger(n)||n>10000)))throw Error('Use at most 8 stages, with whole tooth counts from 1 to 10,000.');return r;}
      case 'inertiaRows':return records(c[key],l=>{const [name,m,outer,inner,ratio]=split(l,5),row={name:label(name),mass:value(m,0.000001,100000),outer:value(outer,0.000001,1000),inner:value(inner,0,1000),ratio:value(ratio,0.000001,10000)};if(row.inner>row.outer)throw Error('Inner radius cannot exceed outer radius.');return row;});
      case 'brakeRows':{const r=pairs(c[key]);if(r.some((p,i)=>i&&p[0]<=r[i-1][0]))throw Error('Sample times must strictly increase.');return r;}
      default:return [];
    }
  }
  function clean(input,keys=Object.keys(fields)){
    const out={},d=defaults();
    for(const k of keys){const f=fields[k],v=input[k]===undefined?d[k]:input[k];if(typeof v!=='string')throw Error(f.label+': use text input.');
      try{if(f.type==='number'){out[k]=v===''?'':String(value(v,f.min,f.max));if(/^(strategyLaps|strategyStops|gearDriver|gearDriven)$/.test(k)&&v!==''&&!Number.isInteger(+v))throw Error('Use a whole number.');}
        else if(f.type==='select'){if(!f.options.some(o=>o.split('|')[0]===v))throw Error('Choose a supported option.');out[k]=v;}
        else {if(v.length>f.max)throw Error(`Use at most ${f.max} characters.`);out[k]=v;if(f.type==='textarea')data(out,k);}
      }catch(e){throw Error(f.label+': '+e.message);}
    }return out;
  }
  const finite=n=>Number.isFinite(n)?n:null;
  const quantile=(a,q)=>{const v=[...a].sort((x,y)=>x-y),p=(v.length-1)*q,i=Math.floor(p);return v[i]+(v[Math.ceil(p)]-v[i])*(p-i);};
  const mean=a=>a.length?a.reduce((s,v)=>s+v,0)/a.length:null;
  function calculate(input,tool){
    const spec=tools[tool];if(!spec)return {error:'Unknown tool.'};
    let c;try{c=clean(input,spec.keys);}catch(e){return {error:e.message};}
    const n=k=>c[k]===undefined||c[k]===''?null:Number(c[k]),m=P.calculate(input);
    const result={error:'',metrics:[],headers:[],rows:[],notes:[],plot:null};
    const metric=(label,v,unit='',digits=3)=>result.metrics.push({label,value:finite(v),unit,digits});
    const table=(headers,rows)=>{result.headers=headers;result.rows=rows;};
    try{switch(tool){
      case 'tyres':{
        const enteredHistory=data(c,'tyreHistory'),enteredSamples=data(c,'tyreSamples'),gap=n('tyreRequiredGap'),min=n('tyreMinimum'),gear=P.positive(input.gearDiameter,1000),target=P.positive(input.targetRollout,10000);
        const history=enteredHistory.every(p=>Fit.diameter(p[1])!==null)?enteredHistory:[],samples=enteredSamples.every(d=>Fit.diameter(d)!==null)?enteredSamples:[];
        const plan=Fit.tyrePlan({fitted:m.rearDiameter,gear,requiredGap:gap,minimum:min,targetDiameter:target!==null&&m.ratio!==null?target*m.ratio/Math.PI:null});
        result.tyrePlan=plan;
        metric('Current gap below driven gear',plan.current.gap,'mm');
        if(plan.current.state==='interference')metric('Gear protrusion below tyre contact plane',plan.current.interference,'mm');
        metric('Minimum tyre diameter for required gear gap',plan.gearMinimum,'mm');metric('Diameter for target rollout',plan.targetDiameter,'mm');metric('Usable tyre diameter before minimum',plan.remaining,'mm');
        if(plan.shortfall>0)metric('Tyre diameter below minimum',plan.shortfall,'mm');
        const l=Fit.diameter(n('tyreLeft')),r=Fit.diameter(n('tyreRight')),delta=l!==null&&r!==null?Math.abs(l-r):null;
        metric('Left/right diameter mismatch',delta,'mm');metric('Circumference mismatch per axle revolution',delta===null?null:Math.PI*delta,'mm');metric('Measured diameter spread (not TIR)',samples.length>1?Math.max(...samples)-Math.min(...samples):null,'mm');
        const rates=history.slice(1).map((p,i)=>(history[i][1]-p[1])/(p[0]-history[i][0])),last=history.at(-1),rate=history.length>1?(history[0][1]-last[1])/(last[0]-history[0][0]):null;
        const limit=plan.limit,current=m.rearDiameter??last?.[1]??null;
        const remaining=current!==null&&limit!==null?Math.max(0,current-limit):null,life=remaining===null?null:remaining===0?0:rate>0?remaining/rate:null;
        metric('Observed wear',rate===null?null:rate*100,'mm / 100 laps',4);metric('Estimated remaining laps',life,'laps',0);
        if(rates.length&&remaining!==null){const fastest=Math.max(...rates),slowest=Math.min(...rates);metric('Remaining laps at fastest measured wear',remaining===0?0:fastest>0?remaining/fastest:null,'laps',0);metric('Remaining laps at slowest measured wear',remaining===0?0:slowest>0?remaining/slowest:null,'laps',0);if(slowest===0&&remaining>0)result.notes.push('A zero-wear interval gives no finite upper life estimate.');}
        if(limit!==null)result.notes.push(`Wear budget uses minimum ${limit} mm and ${m.rearDiameter!==null?'the currently fitted tyre':'the latest history measurement'}. Remaining laps use the measured history wear rate.`);
        table(['Cumulative laps','Diameter · mm'],history);result.plot={x:'Cumulative laps',y:'Diameter · mm',points:history};break;
      }
      case 'electrical':{
        const rows=data(c,'electricalRows');if(c.electricalMode!=='dc'){result.notes.push('Select confirmed steady DC to calculate losses. Digital/PWM measurements need waveform-aware equipment.');break;}
        table(['Location','Supply · V','Rails · V','Current · A','Drop · V','Drop · %','Loop · Ω','Loss · W'],rows.map(r=>[r.name,r.supply,r.rail,r.amps,r.supply-r.rail,(r.supply-r.rail)/r.supply*100,(r.supply-r.rail)/r.amps,(r.supply-r.rail)*r.amps]));break;
      }
      case 'motor':{
        const rows=data(c,'motorBenchRows');table(['Test','Mode / direction','V','RPM','A','Torque · gf·cm','Input · W','Shaft · W','Efficiency · %'],rows.map(r=>{const torque=r.force===null?null:r.force*r.arm,power=r.mode==='no-load'||torque===null?null:torque*.0000980665*r.rpm*2*Math.PI/60,pin=r.amps===null||c.motorBenchElectrical!=='dc'?null:r.v*r.amps;let efficiency=power!==null&&pin>0?power/pin*100:null;if(power!==null&&pin!==null&&power>pin){result.notes.push(r.name+': shaft power exceeds electrical input. Check units and simultaneous readings; efficiency suppressed.');efficiency=null;}return [r.name,r.mode+' / '+r.dir,r.v,r.rpm,r.amps,torque,pin,power,efficiency];}));break;
      }
      case 'strategy':{
        const laps=n('strategyLaps'),pace=n('strategyPace'),inc=n('strategyIncidents'),recovery=n('strategyRecovery'),stops=n('strategyStops'),pit=n('strategyPitLoss'),gain=n('strategyGain'),extra=n('strategyExtraStop');
        const base=laps!==null&&pace!==null?laps*pace:null,events=laps!==null&&inc!==null?laps*inc/100:null,incidentLoss=events===0?0:events!==null&&recovery!==null?events*recovery:null,pitLoss=stops===0?0:stops!==null&&pit!==null?stops*pit:null;
        metric('Base race time',base,'s');metric('Expected incident count',events);metric('Expected incident loss',incidentLoss,'s');metric('Planned pit loss',pitLoss,'s');metric('Scenario race duration',base!==null&&incidentLoss!==null&&pitLoss!==null?base+incidentLoss+pitLoss:null,'s');metric('Extra-stop break-even distance',extra!==null&&gain>0?extra/gain:null,'laps');metric('Alternative net saving over entered laps',laps!==null&&gain!==null&&extra!==null?laps*gain-extra:null,'s');
        if(pace!==null&&gain!==null&&gain>=pace)throw Error('Per-lap gain must be smaller than base lap time.');
        if(gain===0&&extra>0)result.notes.push('No pace gain: the additional stop cannot be recovered.');result.notes.push('For a mid-race stop, only laps after that stop count towards recovering its cost.');break;
      }
      case 'balance':{
        const rows=data(c,'balanceChanges'),span=n('balanceSpan'),front=n('balanceFront'),rear=n('balanceRear');if(span===null||front===null||rear===null){result.notes.push('Enter both support readings and their separation.');break;}if(front+rear<=0)throw Error('Original measured mass must be positive.');
        if(rows.filter(r=>r.mass<0).reduce((s,r)=>s-r.mass,0)>front+rear)throw Error('Removed component mass exceeds the original car mass.');
        const mass=front+rear+rows.reduce((s,r)=>s+r.mass,0),back=rear+rows.reduce((s,r)=>s+r.mass*r.x/span,0),fore=mass-back;
        if(mass<=0||fore<0||back<0)throw Error('This plan gives non-positive mass or a negative support load. Check removed parts and positions.');
        metric('Planned mass',mass,'g');metric(c.balanceSupport==='guide'?'Guide support load':'Front axle support load',fore,'g');metric('Rear support load',back,'g');metric('Rear share',back/mass*100,'%');metric('CG behind front support',span*back/mass,'mm');
        const target=n('balanceTarget'),x=n('balanceTargetX');let add=null;
        if(target!==null&&x!==null){const numerator=target/100*mass-back,denominator=x/span-target/100;if(Math.abs(numerator)<1e-9)add=0;else if(Math.abs(denominator)<1e-12)result.notes.push('That target cannot be reached by adding ballast at this position.');else {add=numerator/denominator;if(add<0){add=null;result.notes.push('Reaching this target here requires removal, not added ballast.');}}}
        const max=n('balanceMax');if(add!==null&&!Fit.additionFits(add,mass,max)){add=null;result.notes.push('No ballast addition within this plan’s mass budget reaches that target. Move existing mass or choose another position.');}
        metric('Additional ballast for target',add,'g');metric('Mass including target ballast',add===null?null:mass+add,'g');metric('Mass margin after target (or current plan)',max===null?null:max-mass-(add??0),'g');table(['Part','Mass change · g','Position x · mm'],rows.map(r=>[r.name,r.mass,r.x]));break;
      }
      case 'experiment':{
        const rows=data(c,'experimentRows'),runs=rows.map(r=>({...r,mean:mean(r.times),median:quantile(r.times,.5),spread:r.times.length>1?quantile(r.times,.75)-quantile(r.times,.25):null})),a=runs.filter(r=>r.setup==='A'),b=runs.filter(r=>r.setup==='B');
        table(['Run','Setup','Laps','Mean · s','Median · s','Middle 50% · s','Incidents','Incident loss · s'],runs.map(r=>[r.name,r.setup,r.times.length,r.mean,r.median,r.spread,r.incidents,r.loss]));
        metric('A · average of run means',mean(a.map(r=>r.mean)),'s');metric('B · average of run means',mean(b.map(r=>r.mean)),'s');metric('B − A run-mean change',a.length&&b.length&&c.experimentConfirmed==='yes'?mean(b.map(r=>r.mean))-mean(a.map(r=>r.mean)):null,'s');metric('Return-to-A drift',a.length>1?a.at(-1).mean-a[0].mean:null,'s');
        const aba=runs.some((r,i)=>r.setup==='B'&&runs.slice(0,i).some(s=>s.setup==='A')&&runs.slice(i+1).some(s=>s.setup==='A'));
        result.notes.push(aba?'A–B–A ordering present. Repeat the sequence before drawing conclusions.':'Add an A run before and after a B run to check baseline drift.');if(c.experimentConfirmed!=='yes')result.notes.push('Conditions unconfirmed: direct B − A comparison withheld.');result.plot={x:'Run sequence',y:'Mean lap · s',points:runs.map((r,i)=>[i+1,r.mean])};break;
      }
      case 'rules':{
        const rows=data(c,'rulesRows');table(['Measurement / location','Value','Minimum','Maximum','Min margin','Max margin','Unit','Entered limits'],rows.map(r=>{const lo=r.lo===null?null:r.v-r.lo,hi=r.hi===null?null:r.hi-r.v;return [r.name,r.v,r.lo,r.hi,lo,hi,r.unit,(lo!==null&&lo<0)||(hi!==null&&hi<0)?'Outside':'Within'];}));if(!rows.length)result.notes.push('No class measurements entered.');break;
      }
      case 'gears':{
        const rows=data(c,'gearStages'),ratio=rows.length?rows.reduce((a,[driver,driven])=>a*driven/driver,1):null;
        metric('Compound ratio',ratio,':1',4);metric('Compound rollout',ratio!==null&&m.rearDiameter!==null?Math.PI*m.rearDiameter/ratio:null,'mm / motor rev');metric('Compound no-load axle speed',ratio!==null&&m.ratedRpm!==null?m.ratedRpm/ratio:null,'RPM');
        const pitch=n('gearPitch'),mod=pitch===null?null:c.gearPitchMode==='dp'?25.4/pitch:pitch,driver=n('gearDriver'),driven=n('gearDriven');metric('Module',mod,'mm');metric('Diametral pitch',mod===null?null:25.4/mod,'teeth/in');const driving=mod!==null&&driver!==null?Fit.gearDiameter(mod*driver):null,drivenDiameter=mod!==null&&driven!==null?Fit.gearDiameter(mod*driven):null;metric('Driving pitch diameter',driving,'mm');metric('Driven pitch diameter',drivenDiameter,'mm');metric('Standard centre distance',driving!==null&&drivenDiameter!==null?(driving+drivenDiameter)/2:null,'mm');table(['Driving teeth','Driven teeth'],rows);break;
      }
      case 'inertia':{
        const rows=data(c,'inertiaRows'),mass=P.positive(input.totalWeight,100000),radius=m.rearDiameter===null?null:m.rearDiameter/2000;
        const parts=rows.map(r=>{const inertia=r.mass/1000*((r.outer/1000)**2+(r.inner/1000)**2)/2;return {...r,inertia,equivalent:radius===null?null:inertia*r.ratio**2/radius**2};});
        if(mass!==null&&rows.reduce((s,r)=>s+r.mass,0)>mass+1e-9)throw Error('Listed rotating components exceed total car mass. Total car mass must include those components.');
        const equivalent=radius!==null&&rows.length?parts.reduce((s,r)=>s+r.equivalent,0):null,effective=mass!==null&&equivalent!==null?mass/1000+equivalent:null,force=n('inertiaForce');metric('Listed equivalent inertia mass',equivalent===null?null:equivalent*1000,'g');metric('Ideal effective accelerating mass',effective===null?null:effective*1000,'g');metric('Ideal acceleration including listed inertia',effective!==null&&force!==null?force/effective:null,'m/s²');table(['Part','I · kg·mm²','Equivalent inertia mass · g'],parts.map(r=>[r.name,r.inertia*1e6,r.equivalent===null?null:r.equivalent*1000]));break;
      }
      case 'braking':{
        const rows=data(c,'brakeRows'),intervals=rows.slice(1).map((r,i)=>{const a=rows[i],dt=r[0]-a[0];return [a[0],r[0],(a[1]+r[1])/3.6/2*dt,(a[1]-r[1])/3.6/dt];}),first=rows[0],last=rows.at(-1),duration=rows.length>1?last[0]-first[0]:null;
        metric('Recorded duration',duration,'s');metric(last?.[1]===0?'Estimated stopping distance in recorded window':'Estimated distance in recorded window',intervals.length?intervals.reduce((s,r)=>s+r[2],0):null,'m');metric('Mean deceleration',duration!==null?(first[1]-last[1])/3.6/duration:null,'m/s²');if(last&&last[1]!==0)result.notes.push('Final speed is not zero: this trace does not measure a complete stop.');if(intervals.some(r=>r[3]<0))result.notes.push('Speed rises in part of this trace; negative deceleration is retained.');table(['Start · s','End · s','Start speed · km/h','End speed · km/h','Distance · m','Mean deceleration · m/s²'],intervals.map((r,i)=>[r[0],r[1],rows[i][1],rows[i+1][1],r[2],r[3]]));result.plot={x:'Time · s',y:'Speed · km/h',points:rows};break;
      }
      case 'ranges':{
        const dd=n('rangeDiameter'),dr=n('rangeRpm'),df=n('rangePull'),d=m.rearDiameter,rpm=m.ratedRpm,gear=P.positive(input.gearDiameter,1000),meanPull=(()=>{try{const raw=input.magneticReadings||'';return raw.trim()?mean(raw.trim().split(/[\s,;]+/).map(v=>value(v,0,100000))):null;}catch{return null;}})();
        if((d!==null&&dd!==null&&d-dd<=0)||(rpm!==null&&dr!==null&&rpm-dr<0)||(meanPull!==null&&df!==null&&meanPull-df<0))throw Error('Measurement bounds cross an impossible negative value (or zero tyre diameter). Check the bounds; they are not silently clipped.');
        const rows=[];if(d!==null&&dd!==null&&Fit.diameter(d-dd)!==null&&Fit.diameter(d+dd)!==null){rows.push(['Tyre diameter',d-dd,d+dd,'mm']);if(m.ratio!==null)rows.push(['Rollout',Math.PI*(d-dd)/m.ratio,Math.PI*(d+dd)/m.ratio,'mm / motor rev']);if(Fit.gearDiameter(gear)!==null){const low=(d-dd-gear)/2,high=(d+dd-gear)/2;if(low>=0)rows.push(['Gap below driven gear',low,high,'mm']);else if(high<0)rows.push(['Gear protrusion below tyre contact plane',-high,-low,'mm']);else {rows.push(['Possible gear gap',0,high,'mm']);rows.push(['Possible gear protrusion',0,-low,'mm']);}};if(rpm!==null&&dr!==null&&m.ratio!==null)rows.push(['No-load speed',(d-dd)*(rpm-dr)*Math.PI/m.ratio*60/1e6,(d+dd)*(rpm+dr)*Math.PI/m.ratio*60/1e6,'km/h']);}
        if(meanPull!==null&&df!==null)rows.push(['Magnetic force',(meanPull-df)*.00980665,(meanPull+df)*.00980665,'N']);table(['Quantity','Lower bound','Upper bound','Unit'],rows);break;
      }
    }}catch(e){return {error:e.message};}
    const nonfinite=value=>typeof value==='number'?!Number.isFinite(value):Array.isArray(value)?value.some(nonfinite):value&&typeof value==='object'?Object.values(value).some(nonfinite):false;
    if(nonfinite(result))return {error:'These measurements are too close together or too large to calculate finite results. Check their units and precision.'};
    return result;
  }
  const api={fields,tools,defaults,clean,calculate,data};if(typeof module==='object'&&module.exports)module.exports=api;else root.WorkshopModel=api;
})(globalThis);
