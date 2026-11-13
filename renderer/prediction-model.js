(function(root){
  'use strict';
  const node=typeof module==='object'&&module.exports;
  const P=node?require('./performance-model.js'):root.PerformanceModel;
  const H=node?require('./chassis-model.js'):root.ChassisModel;
  const W=node?require('./workshop-model.js'):root.WorkshopModel;
  const M=node?require('./magnetic-model.js'):root.MagneticModel;
  const T=node?require('./telemetry-model.js'):root.TelemetryModel;
  const Fit=node?require('./fit-model.js'):root.FitModel;
  const Checks=node?require('./feedback-checks.js'):root.FeedbackChecks;
  const Routes=node?require('./feedback-routes.js'):root.FeedbackRoutes;
  const choice=(label,options)=>({label,type:'select',options});
  const number=(label,min=0,max=1000)=>({label,type:'number',min,max});
  const text=(label,max=600)=>({label,type:'text',max});
  const lines=(label,max=6000)=>({label,type:'textarea',max});
  const fields={
    adviceSymptom:choice('What would you like help with?',['unknown|I’m not sure what’s wrong','tip|My car tips over','slide|The rear slides too much','snap|It slides, then suddenly catches','guide|The front comes out of the slot','hop|My car hops, chatters or vibrates','slow|My car lacks power','brake|Braking feels wrong','fade|It gets worse during a run','consistent|My car is difficult to drive consistently']),
    adviceGoal:text('What would a better result feel like?'),
    adviceUseSetup:choice('Include workbench numbers?',['no|Observations only — no measurements needed','yes|Include the current workbench setup']),
    advicePhase:choice('When does it happen?',['unknown|Not sure / skip','entry|Entering a corner','middle|Mid-corner','exit|Leaving a corner','straight|On a straight']),
    advicePower:choice('What is the throttle doing?',['unknown|Not sure / skip','power|Applying power','brake|Braking','coast|Coasting — no electrical braking']),
    adviceDirection:choice('Where does it happen?',['unknown|Not sure / skip','both|Both directions / many corners','left|Left turns','right|Right turns','one|One particular corner or track joint']),
    adviceBody:choice('Where does the body seem to carry its weight?',['unknown|Not sure / skip','low|Mostly low','middle|Spread out / around the middle','high|Mostly high']),
    adviceTrack:text('Track / lane / surface / bumps'),adviceTyres:text('Tyres / preparation / wear / temperature'),
    adviceRails:choice('Do the rails attract a magnet?',['unknown|Not sure / skip','yes|Yes','no|No']),
    adviceController:text('Controller / brake setting / voltage / warm-up'),adviceRules:text('Class rules and changes you want to avoid',1000),
    adviceParts:choice('Replacement parts',['unknown|Ask me to check compatibility and rules','adjust|Prefer adjustments to existing parts','allowed|Replacement parts may be considered']),
    adviceChecks:choice('Mechanical checks',['unknown|Not checked / not sure','clear|Guide, tyres, axles and body/pod checked free','issue|Rubbing, binding or another issue found']),
    adviceRecentChange:choice('Did this start after a change?',['unknown|Not sure / skip','none|No recent change / new car','tyres|Tyres or tyre preparation','ballast|Ballast placement','body|Body, pod or mounting adjustment','gearing|Gearing','motor|Motor','layout|Motor-layout conversion','track|Track, lane or controller']),
    adviceWheelspin:choice('Do the rear wheels spin under power?',['unknown|Not sure / skip','yes|Yes, the wheels spin','no|No wheelspin noticed']),
    adviceBrakeFeel:choice('What feels wrong with braking?',['unknown|Not sure / skip','weak|Too little slowing','strong|Too abrupt','sideways|The car turns sideways','varying|It varies from lap to lap']),
    adviceNotes:lines('What you observed — keep observations separate from suspected causes',2000),
    adviceHeight:number('Whole-car CG height above track · mm',0.001),
    adviceHeightBasis:choice('CG height evidence',['unknown|Unknown method','estimated|Estimated','measured|Measured using a documented method']),
    adviceHeightBound:number('CG height absolute uncertainty · ± mm'),
    adviceMethod:text('Measurement method / date / equipment / conditions',1500),
    adviceComponents:lines('Component | mass g | x mm | y mm | z mm | optional length, width, height mm'),
    adviceInventory:choice('Component inventory',['unknown|Partial / not verified','complete|Complete running car, no duplicated parts']),
    advicePullMethod:choice('Magnetic measurement basis',['unknown|Unknown / skip','net|Net magnetic force only, tare removed','total|Total support or lift force','rear|Rear lift measurement','gauss|Magnetic field strength (gauss)']),
    adviceYawRows:lines('Chassis angle degrees, net magnetic pull gf',3000),adviceYawAngle:number('Angle to inspect · degrees',-90,90),
    adviceProposal:choice('Change to explore',['none|Choose a change / skip','lower|Move existing ballast vertically','add|Add low ballast','gear|Change driven gear','motor|Compare similar-RPM motor pull']),
    advicePartMass:number('Ballast mass · g',0.001,100000),adviceOldZ:number('Existing ballast height · mm'),adviceNewZ:number('Proposed ballast height · mm'),
    adviceGear:number('Proposed driven gear · whole teeth',1,999999),adviceCandidatePull:number('Candidate net motor pull · gf',0,100000),
    adviceMotorMatch:choice('Candidate comparison conditions',['unknown|Not verified','yes|Comparable RPM rating; same fixture, rails and installed gap']),
    adviceTestChange:text('One change being tested',1000),adviceTestObservations:lines('Run observations: handling, incidents and recovery',3000),
    adviceStep:choice('Driver Feedback step',['experience|Your experience','checks|First checks','setup|Your setup','measure|Look deeper','test|Try & learn']),
    adviceMeasurement:choice('Measurement to explore',['body|Body mass','tyres|Tyres & clearance','drive|Motor & gearing','chassis|Support geometry','height|CG height','magnetic|Magnetic attraction','components|Component inventory','yaw|Attraction through a slide','power|Power & braking','laps|Pace & consistency','proposal|Explore a change']),
    adviceBodyMass:number('Complete body assembly mass · g',0.001,100000),
    adviceOutcome:choice('What happened?',['unknown|Not tested / not recorded','better|Change: improved','same|Change: no clear difference','worse|Change: worse','clear|Inspection: no fault found','fault|Inspection: a fault was found','different|A different problem appeared','uncertain|Checked, but the result is uncertain','unable|Could not do this check']),
    adviceResultContext:{label:'Recorded test context',type:'hidden',max:30000},
    adviceCheckLog:{label:'Recorded mechanical checks',type:'hidden',max:26000},
    adviceTestId:{label:'Linked suggested test',type:'hidden',max:80},
    adviceTestAction:{label:'Linked suggested action',type:'hidden',max:1000},
    ...Routes.fields
  };
  const defaults=()=>Object.fromEntries(Object.entries(fields).map(([k,f])=>[k,f.type==='select'?f.options[0].split('|')[0]:'']));
  const hints={
    adviceGoal:'Saved goal, shown with your advice. Free text is not interpreted or scored.',
    adviceTrack:'Saved notes only. Track names, surfaces and bumps typed here do not change calculations. Use “Where does it happen?” to flag a particular corner or joint.',
    adviceTyres:'Saved notes only. Tyre brands, compounds and preparation are not converted into a grip estimate. Enter measured diameters in Tyres & clearance for numeric checks.',
    adviceController:'Saved notes only. Typed voltage or brake settings do not feed the calculators. Use motor test voltages or measured electrical/braking data for calculations.',
    adviceRules:'Saved constraints, shown with proposed changes. Not automatically enforced; use Class limits for numeric rule checks.',
    adviceNotes:'Saved observations only. Choose the behaviour, throttle and corner options above to tailor the suggestions.',
    advicePhase:'Focuses the recommended track test on this part of the lap.',
    advicePower:'Changes guidance for sliding and guide escape, and helps distinguish braking from coasting. Does not assume a grip coefficient.',
    adviceDirection:'One corner prompts a track/clearance check; one turning direction prompts tyre and balance checks.',
    adviceBody:'High-mounted body weight adds a reason to investigate tipping. This is an observation, not a numeric CG height.',
    adviceRails:'Controls whether magnetic angle measurements and motor-pull comparisons can be interpreted.',
    adviceParts:'Used when exploring a replacement motor. Fit and class rules still need checking.',
    adviceChecks:'An unresolved or unchecked mechanical issue keeps a mechanical check in your advice.',
    adviceRecentChange:'Select the change that preceded the problem. This selects relevant checks and counterexamples; it does not prove the cause.',
    adviceWheelspin:'An observed loss of traction changes the priority from more wheel torque to tyres and power delivery.',
    adviceBrakeFeel:'Select the observed response to choose a practical brake test. A controller percentage cannot supply deceleration.',
    adviceUseSetup:'Select “Include” to use the values entered on Telemetry. Observation-only deliberately ignores workbench numbers, including the bundled example.',
    adviceMethod:'Saved measurement record; does not change the numbers or verify their accuracy.'
  };
  function numeric(raw,min,max){if(typeof raw!=='string'||raw.length>32||! /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(raw.trim()))throw Error('Use finite numbers with decimal points.');const v=Number(raw);if(!Number.isFinite(v)||v<min||v>max)throw Error(`Use a number between ${min} and ${max}.`);return v;}
  function clean(input={}){const out=defaults();for(const [k,f] of Object.entries(fields)){const v=input[k]??out[k];if(typeof v!=='string')throw Error('Check '+f.label+'.');if(f.type==='select'){if(!f.options.some(o=>o.split('|')[0]===v))throw Error('Check '+f.label+'.');}else if(f.type==='number'){if(v!==''){numeric(v,f.min,f.max);if(k==='adviceGear'&&!Number.isInteger(Number(v)))throw Error('Proposed gear must have whole teeth.');}}else if(v.length>f.max)throw Error(f.label+' is too long.');out[k]=v;}
    Checks.parse(out.adviceCheckLog);
    Routes.list(out.adviceRouteSkipped);Routes.list(out.adviceUnavailable);
    return out; // Incomplete measurement tables are retained; only their calculation is withheld.
  }
  const n=(c,k)=>c[k]===''?null:Number(c[k]);
  function components(raw){if(!raw.trim())return null;const rows=raw.trim().split(/\r?\n/).filter(s=>s.trim());if(rows.length>40)throw Error('Use up to 40 components.');return rows.map((line,i)=>{const a=line.split('|').map(s=>s.trim());if(![5,8].includes(a.length)||!a[0]||a[0].length>100)throw Error(`Component row ${i+1}: use name | mass | x | y | z, optionally followed by length | width | height.`);const mass=numeric(a[1],0.000001,100000),x=numeric(a[2],-1000,1000),y=numeric(a[3],-1000,1000),z=numeric(a[4],0,1000),dims=a.length===8?a.slice(5).map(v=>numeric(v,0,1000)):[0,0,0];return {name:a[0],mass,x,y,z,dims,point:a.length===5};});}
  function massProperties(rows){if(!rows?.length)return null;const mass=rows.reduce((s,r)=>s+r.mass,0);const cg=Object.fromEntries(['x','y','z'].map(k=>[k,rows.reduce((s,r)=>s+r.mass*r[k],0)/mass]));let yaw=0,roll=0;for(const r of rows){const [l,w,h]=r.dims;yaw+=r.mass*((r.x-cg.x)**2+(r.y-cg.y)**2+(l*l+w*w)/12);roll+=r.mass*((r.y-cg.y)**2+(r.z-cg.z)**2+(w*w+h*h)/12);}return {mass,...cg,yaw,roll,approximation:rows.some(r=>r.point)?'Includes point-mass approximations; component self-inertia omitted where dimensions are absent.':'Uniform-box component approximation; body shells are not solid uniform boxes.'};}
  function yawPoints(raw){if(!raw.trim())return [];const rows=raw.trim().split(/\r?\n/).filter(s=>s.trim());if(rows.length>50)throw Error('Use up to 50 angle measurements.');const points=rows.map((line,i)=>{const a=line.trim().split(/[,;\s]+/);if(a.length!==2)throw Error(`Angle row ${i+1}: use angle degrees, pull gf.`);return {angle:numeric(a[0],-90,90),pull:numeric(a[1],0,100000)};}).sort((a,b)=>a.angle-b.angle);if(points.some((p,i)=>i&&p.angle===points[i-1].angle))throw Error('Use one mean reading per angle.');return points;}
  function interpolate(points,angle){if(angle===null||!points.length||angle<points[0].angle||angle>points.at(-1).angle)return null;const exact=points.find(p=>p.angle===angle);if(exact)return exact.pull;const i=points.findIndex(p=>p.angle>angle),a=points[i-1],b=points[i];return a.pull+(b.pull-a.pull)*(angle-a.angle)/(b.angle-a.angle);}
  function support(chassis,height){if(!chassis.baseline||chassis.mode!=='tripod'||!chassis.span||!chassis.track||height===null)return null;
    const {x,y}=chassis.baseline,S=chassis.span,T=chassis.track,side=Math.hypot(S,T/2);
    const margins=[(T*x/2-S*y)/side,(T*x/2+S*y)/side,S-x];const distance=Math.min(...margins);
    return {distance,angle:Math.atan2(distance,height)*180/Math.PI}; // Geometric distance only, not dynamic rollover acceleration.
  }
  function analyze(input={}){
    const r={error:'',issues:[],evidence:[],suggestions:[],missing:[],properties:null,support:null,yaw:null,comparison:[],proposalNotes:[],coverage:[],guidance:{}};let c;
    c=defaults();for(const k of Object.keys(fields)){try{c[k]=clean({[k]:input[k]})[k];}catch(e){r.issues.push(e.message+' Clear it to skip this measurement.');}}
    const use=c.adviceUseSetup==='yes',base=use?input:{},telemetry=T.calculate(base),motor=telemetry.motor,chassis=H.calculate(base),mass=telemetry.massG;
    const add=(title,why,action,trade,test,area='handling')=>r.suggestions.push({title,why,action,trade,test,area});
    if(c.adviceChecks!=='clear')add(c.adviceChecks==='issue'?'Resolve the mechanical issue first':'Start with a quick mechanical check','Rubbing or restricted movement can resemble a balance, grip or motor problem.','With the power off, check guide rotation and braid seating, tyre/body clearance, free axles and intended body/pod movement.','Do not loosen everything indiscriminately; keep parts secure and follow the car’s setup instructions.','Repeat the same corner after one correction. Record what changed.','checks');
    const symptom={
      tip:['Investigate roll stability','Tipping is an observation; high CG is one possible cause, not a confirmed diagnosis.','First distinguish wheel lift from guide escape or a snag. Explore moving existing mass lower before adding mass. Check permitted rear contact spacing.','Added mass changes acceleration and support loads. A wider axle must still fit without tyre rubbing.','Observe which part lifts first; compare left and right turns.'],
      slide:['Investigate rear grip and power delivery','Sliding under power can have a different cause from sliding while coasting.','Check tyre condition, seating and preparation. Try a more progressive throttle setting; keep the motor class and intended pace.','A shorter gear ratio can increase wheel torque and worsen sliding. More magnetic pull is conditional on the track and installed gap.','Compare corner entry and exit separately; record controllability and incidents.'],
      snap:['Separate slide onset from sudden recovery','A car that slides easily may still recover abruptly.','Check tyre rubbing and body/pod freedom. Record whether the catch happens when power changes or when the car realigns with the rails.','A higher straight-ahead magnetic reading does not guarantee smoother recovery.','Repeat at a controlled pace; note the sequence: slide, catch, lift or deslot.'],
      guide:['Check guide engagement and front support','A straight-ahead departure is not automatically a rollover.','Check guide freedom, slot clearance, braid thickness and whether front wheels lift the guide. Compare behaviour under power and braking.','Adding front ballast changes rear support load and total mass; first rule out binding and interference.','Check the affected corner with power off, then compare controlled runs.'],
      hop:['Check roundness, fit and movement','Vibration may come from tyres, axles, gear mesh or pod movement.','Check fitted tyre roundness, seating, loose wheels, axle alignment and motor/pod security.','Diameter samples around a tyre are not a dial-indicator runout measurement. Stiffening everything may change grip.','Identify whether hopping appears on straights, under power or at a track joint.'],
      slow:['Check delivered power before changing the motor','An RPM rating is a no-load test, not loaded performance.','Check binding, gear mesh and pickup contact. Compare loaded rail voltage and matched motor tests; explore gearing within the current motor class.','More RPM or wheel torque does not guarantee quicker laps.','Use repeated straight-line or lap tests under comparable voltage and conditions.'],
      brake:['Separate braking from coasting','Controller settings, motor and gearing all influence the result.','Record whether releasing the trigger applies electrical braking. Compare one brake setting at a time and use measured speed–time tests if available.','More braking can change corner-entry behaviour; a controller percentage is not a deceleration value.','Use comparable entry speeds; never infer stopping distance from lap time alone.'],
      fade:['Investigate what changes during the run','Tyres, electrical contact, motor temperature and track conditions can change together.','Record warm-up, tyre cleaning, voltage and when the behaviour changes. Compare cold/warm motor readings when available.','Do not turn an outside motor temperature into winding temperature or assume a universal grip correction.','Compare equal-length stints with the same preparation and cooling procedure.'],
      consistent:['Optimize repeatability and incidents','A best lap does not describe a whole race.','Compare representative pace, lap spread, recorded incidents and recovery loss. Keep driver, lane and preparation comparable.','A faster clean lap can be outweighed by incidents; slow laps do not identify the cause.','Use repeated A–B–A runs and record every incident separately.'],
      unknown:['Choose a goal, or explore what you know','No measurements are needed to start.','Choose a behaviour above, or open a calculation area to inspect your setup. Every question can be skipped.','More data permits more specific comparisons; it does not automatically establish a cause.','Change one thing at a time and keep a baseline.']
    }[c.adviceSymptom];add(...symptom,({slow:'drive',brake:'control',fade:'control',consistent:'race',hop:'tyres'})[c.adviceSymptom]||'handling');
    const behaviour=r.suggestions.at(-1);
    if(c.adviceSymptom==='tip'&&c.adviceBody==='high')behaviour.why+=' You report high-mounted body weight; this supports investigating mass height but does not measure whole-car CG.';
    if(['slide','snap'].includes(c.adviceSymptom)&&c.advicePower==='coast')behaviour.action='Because you report coasting, first confirm that electrical braking is off. Compare lower entry speed, tyre preparation and mechanical freedom; an RPM upgrade does not address this observation.';
    if(c.adviceSymptom==='slide'&&c.advicePower==='power')behaviour.action='For sliding under power, compare gentler throttle delivery before changing parts. Check tyres and explore the wheel-torque trade-off of gearing within the same motor class.';
    if(c.adviceSymptom==='guide'&&c.advicePower==='brake')behaviour.action='For departure under braking, check front tyre/body rubbing, guide freedom and braid seating before adding front ballast. Compare one brake setting at a time.';
    if(c.adviceSymptom==='guide'&&c.advicePower==='power')behaviour.action='For guide lift under power, check guide engagement and actual front support, then investigate longitudinal load transfer. Explore ballast placement only after mechanical checks.';
    if(c.advicePhase!=='unknown')behaviour.test+=' Focus the comparison on '+({entry:'corner entry',middle:'mid-corner behaviour',exit:'corner exit',straight:'the straight'})[c.advicePhase]+'.';
    if(c.adviceDirection==='one')add('Check that location before changing the car','The problem is reported at one corner or joint.','Inspect slot depth, rail/braid height, bumps and available clearance there.','A whole-car adjustment may compromise corners that already work.','Compare the same location and another corner at a controlled pace.','checks');
    else if(['left','right'].includes(c.adviceDirection))add('Check the left/right difference','The behaviour is reported in one turning direction.','Inspect unequal tyre diameters, side rubbing and support readings before blaming motor orientation.','A static imbalance is evidence to investigate, not proof of the cause.','Compare equivalent turns and document tyre and support measurements.','handling');
    if(use){
      if(motor.ratio!==null)r.evidence.push(['Calculated','Gear ratio',motor.ratio,':1']);
      if(motor.rollout!==null)r.evidence.push(['Calculated','Rollout',motor.rollout,'mm / motor rev']);
      if(motor.speedKmh!==null)r.evidence.push(['Ideal ceiling','No-load speed',motor.speedKmh,'km/h']);
      if(mass!==null)r.evidence.push([telemetry.totalWeight===null?'Calculated from axle readings':'Entered','Running mass',mass,'g']);
      const left=Fit.diameter(P.positive(base.tyreLeft,1000)),right=Fit.diameter(P.positive(base.tyreRight,1000));
      if(left!==null&&right!==null&&Math.abs(left-right)>1e-9){r.evidence.push(['Calculated','Rear circumference difference',Math.PI*Math.abs(left-right),'mm']);r.suggestions.unshift({title:'Check unequal rear tyre diameters',why:'The entered left and right fitted diameters differ. This does not establish the cause of the behaviour.',action:'Re-measure seating and roundness; consider matching within rules and clearance limits.',trade:'Truing changes rollout, axle height and possibly magnetic pull. Check actual clearances afterwards.',test:'Compare handling before changing motor or ballast.',area:'tyres'});}
      if(chassis.error)r.issues.push('Chassis: '+chassis.error);
      if(chassis.baseline)r.evidence.push(['Calculated from support readings','Rear support share',chassis.baseline.rearShare,'%']);
      const fit=Fit.clearance(motor.rearDiameter,P.positive(base.gearDiameter,1000));
      if(['touching','interference'].includes(fit.state))r.suggestions.unshift({title:'Resolve gear clearance',why:fit.state==='touching'?'The gear reaches the tyre contact plane.':'The gear protrudes below the tyre contact plane.',action:'Verify fitted tyre and gear outside diameters, then choose compatible parts that clear the track.',trade:'Changing tyres or gears also changes gearing, ride height and possibly magnetic pull.',test:'Check clearance before testing at speed.',area:'tyres'});
    }
    let height=n(c,'adviceHeight');if(height!==null){r.evidence.push([c.adviceHeightBasis==='measured'?'Reported measured':c.adviceHeightBasis==='estimated'?'Estimated':'Unverified','Whole-car CG height',height,'mm']);if(c.adviceHeightBasis==='unknown')r.missing.push('Document how CG height was obtained; body roof height is not CG height.');}
    try{const rows=components(c.adviceComponents);if(rows){r.properties=massProperties(rows);r.properties.complete=c.adviceInventory==='complete';r.evidence.push(['Component model',c.adviceInventory==='complete'?'Inventory mass':'Partial inventory mass',r.properties.mass,'g']);if(c.adviceInventory!=='complete')r.missing.push('Complete the component inventory before interpreting it as the whole car.');else if(mass!==null&&Math.abs(r.properties.mass-mass)>0.01){r.issues.push('Component total differs from entered running mass by more than 0.01 g. Reconcile missing or duplicated parts; this check is not measurement uncertainty.');r.properties.complete=false;}if(height===null&&r.properties.complete)height=r.properties.z;}}catch(e){r.issues.push(e.message);}
    const massMismatch=mass!==null&&chassis.baseline&&Math.abs(chassis.baseline.mass-mass)>0.01;
    if(massMismatch)r.issues.push('Support readings and running mass differ by more than 0.01 g. Reconcile the configuration before combining CG height and support geometry.');
    if(use&&!chassis.error&&!massMismatch&&height!==null)r.support=support(chassis,height);
    if(r.support){r.evidence.push(['Static geometry only','CG projection to nearest support edge',r.support.distance,'mm']);r.evidence.push(['Rigid geometry only','CG-to-edge angle',r.support.angle,'°']);}
    if(['tip','snap','guide'].includes(c.adviceSymptom)&&height===null)r.missing.push('Optional CG height or a complete component inventory enables mass-height comparisons. Advice remains available without it.');
    if(c.adviceBody==='high')r.missing.push('High body weight is a qualitative observation, not a numeric whole-car CG measurement.');
    try{const points=yawPoints(c.adviceYawRows);if(points.length){const a=n(c,'adviceYawAngle'),value=interpolate(points,a),centre=interpolate(points,0);r.yaw={points,value,angle:a,retention:value!==null&&centre>0?value/centre*100:null,eligible:use&&c.advicePullMethod==='net'&&c.adviceRails==='yes'&&base.magneticCondition==='off'};if(!r.yaw.eligible)r.missing.push('Angle-force interpretation requires included setup data, net magnetic force, responsive rails and motor-off measurements in the same fixture. Total/rear lift force and gauss cannot be substituted.');}}catch(e){r.issues.push(e.message);}
    const row=(label,a,b,unit)=>r.comparison.push({label,a,b,unit});
    if(['lower','add'].includes(c.adviceProposal)){
      const part=n(c,'advicePartMass'),old=n(c,'adviceOldZ'),next=n(c,'adviceNewZ');
      if(!use||mass===null||height===null||part===null||next===null||(c.adviceProposal==='lower'&&old===null))r.proposalNotes.push('Optional inputs for this comparison: include running mass, CG height (or complete inventory), ballast mass and height(s).');
      else if(c.adviceProposal==='add'&&!Fit.additionFits(part,mass))r.proposalNotes.push('This addition exceeds the current car mass. Explore moving existing ballast or a smaller addition.');
      else if(c.adviceProposal==='lower'&&(part>mass||part*old>mass*height+1e-8||(part===mass&&Math.abs(old-height)>1e-8)))r.issues.push('Existing ballast is inconsistent with total mass or the baseline vertical mass moment. Check its mass and height.');
      else {const added=c.adviceProposal==='add',newMass=mass+(added?part:0),newHeight=(mass*height+part*(added?next:next-old))/newMass;row('Running mass',mass,newMass,'g');row('Model CG height',height,newHeight,'mm');const bound=n(c,'adviceHeightBound');if(bound!==null){if(bound>height||(!added&&mass*(height-bound)<part*old))r.issues.push('CG height bound is inconsistent with the track plane or known ballast moment; bounds are withheld.');else{row('CG lower bound',height-bound,newHeight-mass/newMass*bound,'mm');row('CG upper bound',height+bound,newHeight+mass/newMass*bound,'mm');}}}
      r.proposalNotes.push('Vertical move assumes the same horizontal position. Added ballast changes horizontal CG and support loads too: use the chassis ballast planner for its placement. CG bounds hold every other input exact; they are not confidence intervals. No tipping speed or lap gain is predicted.');
    }else if(c.adviceProposal==='gear'){
      const gear=n(c,'adviceGear');if(base.gearStages?.trim())r.proposalNotes.push('Compound stages are present. Use Compound gears & geometry to edit the actual stages; a single-gear comparison is withheld.');
      else if(!use||motor.ratio===null||gear===null)r.proposalNotes.push('Include the existing pinion/driven gear and an optional proposed driven gear to compare ratios. Tyre diameter and RPM enable rollout and speed.');
      else{const b=P.calculate({...base,gear:String(gear)});row('Gear ratio',motor.ratio,b.ratio,':1');row('Rollout',motor.rollout,b.rollout,'mm / rev');row('No-load speed',motor.speedKmh,b.speedKmh,'km/h');row('Ideal wheel torque multiplier',1,b.ratio/motor.ratio,'× baseline');}
      r.proposalNotes.push('Same motor torque and efficiency for the torque multiplier, not necessarily the same torque at the same road speed. Check actual gear fit and clearance. More wheel torque can worsen exit sliding; no lap gain is inferred.');
    }else if(c.adviceProposal==='motor'){
      const candidate=n(c,'adviceCandidatePull'),m=M.calculate(base,mass);
      if(!use||c.adviceRails!=='yes'||c.advicePullMethod!=='net'||c.adviceMotorMatch!=='yes'||candidate===null||m.mean==null||m.error)r.proposalNotes.push('To compare, optionally supply baseline and candidate net pull, responsive rails and confirmed comparable RPM / fixture / installed gap.');
      else row('Measured net magnetic pull',m.mean*0.00980665,candidate*0.00980665,'N');
      r.proposalNotes.push('Check motor mass, torque curve, dimensions, class rules and force location. Equal RPM labels do not establish equal loaded performance. Rear tyre load, grip gain and recovery remain unknown.');
      if(c.adviceRails==='no')r.proposalNotes.push('A magnetic-force upgrade is not applicable to the stated non-magnetic rails.');
      if(c.adviceParts==='adjust')r.proposalNotes.push('Replacement conflicts with your preference for adjustments; prioritize the existing setup.');
    }
    if(height!==null&&c.adviceHeightBasis==='unknown'&&c.adviceHeight!=='')r.proposalNotes.push('CG height is unverified: numerical comparisons are conditional on that entered value.');
    if(c.adviceRules.trim())r.proposalNotes.push('Your recorded limits: '+c.adviceRules+'. These notes are not automatically interpreted as a compliance check; use Class limits for explicit numeric limits.');
    r.coverage=Object.entries(W.tools).map(([key,t])=>{const result=use?W.calculate(base,key):null,metrics=(result?.metrics||[]).filter(m=>Number.isFinite(m.value));return {key,title:t.title,field:t.keys[0],status:!use?'Not included':result.error?'Check inputs':metrics.length||result.rows?.length?'Results available — review assumptions':'Optional measurements missing',error:result?.error||'',metrics,tyrePlan:result?.tyrePlan,headers:result?.headers||[],rows:result?.rows||[],notes:result?.notes||[],limits:t.limits};});
    const metric=(label,value,unit='')=>({label,value,unit,digits:2});
    const core=(key,title,field,metrics,limits)=>({key,title,field,metrics:metrics.filter(m=>Number.isFinite(m.value)),limits,status:!use?'Not included':metrics.some(m=>Number.isFinite(m.value))?'Results available — review assumptions':'Optional measurements missing'});
    r.coverage.unshift(
      core('stockDrive','Your motor & gearing','ratedRpm',[metric('Entered no-load RPM',motor.ratedRpm,'RPM'),metric('Gear ratio',motor.ratio,':1'),metric('Rollout',motor.rollout,'mm / motor rev'),metric('No-load speed',motor.speedKmh,'km/h'),metric('Ideal peak shaft power',motor.peakPowerW,'W'),metric('Ideal peak shaft power / entered mass',telemetry.powerToWeight,'W/kg')],'Stock ratings describe gearing and ideal motor output, not grip or lap time. No-load speed is at the entered RPM test conditions. Peak power requires brushed DC, stall torque and matching RPM/torque test voltages; it excludes drivetrain losses.'),
      core('stockMass','Your weight & balance','totalWeight',[metric(telemetry.totalWeight===null?'Car mass from front + rear readings':'Entered total car mass',mass,'g'),metric('Whole-car CG height',height,'mm'),metric('Rear support share',chassis.error?null:chassis.baseline?.rearShare,'%'),metric('Static CG projection to support edge',r.support?.distance,'mm')],'Total weight does not tell us where the weight sits. CG height retains its entered or component-model evidence basis; static support geometry is not a tipping threshold.'),
      core('stockTyres','Your fitted tyre & gear clearance','rearDiameter',[metric('Fitted rear tyre diameter',motor.rearDiameter,'mm'),metric('Static gear clearance',telemetry.clearance,'mm')],'Gear clearance = (fitted tyre diameter − driven gear outside diameter) / 2. Check actual clearances over rails and joints; other components may sit lower.'),
      {key:'chassis',title:'Support geometry & ballast',field:'chassisGuideSpan',status:!use?'Not included':chassis.error?'Check inputs':chassis.baseline?'Support readings available':chassis.geometry?'Geometry only':'Optional measurements missing'},
      {key:'magnetic',title:'Magnetic pull & height sensitivity',field:'magneticReadings',status:use&&base.magneticReadings?'Readings entered — verify method':'Optional measurements missing'});
    const tyre=r.coverage.find(t=>t.key==='tyres'),shortfall=tyre.metrics.find(m=>m.label==='Tyre diameter below minimum')?.value;
    if(!tyre.error&&shortfall>0)r.suggestions.unshift({title:'The tyre has reached its usable minimum',why:'The fitted tyre is below your usable diameter requirement.',action:'Use a correctly sized tyre within body clearance and class rules; recalculate rollout after fitting.',trade:'Changing tyre size changes gearing and rear axle height.',test:'Measure the fitted outside diameter and actual gear clearance.',area:'tyres'});
    const need=(a,field,title,why)=>{(r.guidance[a]??=[]).push({field,title,why});};
    for(const a of ['handling','drive','tyres','control','race','checks'])r.guidance[a]=[];
    if(shortfall>0)need('tyres','tyreMinimum','Review the usable tyre minimum','The fitted tyre has no wear allowance left against this limit.');
    if(c.advicePower==='unknown'&&['slide','snap','guide','brake'].includes(c.adviceSymptom))need('handling','advicePower','Tell us what the throttle is doing','A simple observation separates power-related checks from coasting or braking checks; no measurement needed.');
    if(c.adviceDirection==='unknown')need('handling','adviceDirection','One corner, one direction, or everywhere?','This selects local track checks or left/right tyre and balance checks.');
    if(c.adviceBody==='unknown'&&c.adviceSymptom==='tip')need('handling','adviceBody','Describe where the body carries its weight','“Mostly high” adds a reason to investigate mass height; no specialist measurement needed.');
    if(height===null)need('handling','adviceHeight','Optional: whole-car CG height','Together with total mass and ballast mass/height, this enables a numeric comparison of moving or adding ballast. A complete component inventory is an alternative.');
    if(!chassis.baseline)need('handling','chassisMode','Optional: support loads & geometry','Select and confirm the actual weighing supports, then enter their loads and spacing to calculate weight distribution. Total weight alone cannot do this.');
    if(mass===null)need('handling','totalWeight','Optional: total car mass','Combines with CG height and proposed ballast to calculate how the change affects mass height.');
    if(motor.ratio===null)need('drive',!P.teeth(base.pinion)?'pinion':'gear','Pinion & driven gear tooth counts','Both are needed for gear ratio; add fitted tyre diameter for rollout.');
    if(motor.rearDiameter===null)need('drive','rearDiameter','Fitted rear tyre diameter','Combines with gearing for rollout and with RPM for the no-load speed ceiling.');
    if(motor.ratedRpm===null)need('drive','ratedRpm','No-load motor RPM','Combines with gearing and tyre diameter for the no-load speed ceiling.');
    if(!motor.curveReady){const field=base.motorType!=='Brushed DC'?'motorType':base.torqueType!=='Stall'?'torqueType':motor.motorTorque===null?'motorTorque':motor.ratedRpm===null?'ratedRpm':motor.ratedVoltage===null?'ratedVoltage':'torqueVoltage';need('drive',field,'For ideal motor power: verify the rating basis',motor.reasons.join(' ')+' Do not guess the missing rating or voltage.');}
    if(motor.rearDiameter===null||telemetry.gearDiameter===null)need('tyres',motor.rearDiameter===null?'rearDiameter':'gearDiameter','Fitted tyre & gear outside diameters','These give static gear clearance. Enter mm, not the gear tooth count.');
    if(Fit.diameter(P.positive(base.tyreLeft,1000))===null||Fit.diameter(P.positive(base.tyreRight,1000))===null)need('tyres',Fit.diameter(P.positive(base.tyreLeft,1000))===null?'tyreLeft':'tyreRight','Left & right fitted tyre diameters','Checks mismatch and circumference difference; tyre brand notes cannot supply this.');
    // Read actual records, never examples. Validate each series independently so
    // an unfinished input in one tool does not hide usable evidence in another.
    r.inputState=[];
    const records=(area,key,label,min=1)=>{
      let rows=[],error='';try{rows=W.data(W.clean(base,[key]),key);}catch(e){error=e.message;}
      const entered=!!base[key]?.trim();
      r.inputState.push({area,field:key,label,status:!use?'Workbench data excluded':error?'Entered — needs correction':!entered?'Not entered':rows.length<min?`${rows.length} recorded; ${min} needed for this calculation`:`${rows.length} recorded`,error});
      if(use&&error)need(area,key,'Review '+label.toLowerCase(),error);
      return {rows,error,entered};
    };
    records('tyres','tyreSamples','Measurements around one tyre',2);
    records('drive','motorBenchRows','Motor bench tests');
    records('drive','gearStages','Compound gear stages');
    records('drive','inertiaRows','Rotating parts');
    records('handling','balanceChanges','Planned mass changes');
    const history=records('tyres','tyreHistory','Wear history',2);
    if(!history.error&&history.rows.some(row=>Fit.diameter(row[1])===null)){
      r.inputState.find(s=>s.field==='tyreHistory').status='Entered — diameter outside supported range';
      need('tyres','tyreHistory','Review wear-history diameters','Use fitted outside diameters in mm for this 1:32 setup. These rows cannot supply a wear rate.');
    }else if(!history.error&&history.rows.length<2)need('tyres','tyreHistory',history.entered?'Add a second wear-history measurement':'Optional: tyre measurements over recorded laps',history.entered?'Your first measurement is recorded. Add a later cumulative lap count and diameter from the same tyre set to calculate wear rate.':'Current tyre size and left/right readings are separate from wear history. Record at least two diameters at different cumulative lap counts to calculate wear rate. The examples below the field are not data.');
    else if(!history.error&&tyre.metrics.some(m=>m.label==='Observed wear')){
      const wear=tyre.metrics.find(m=>m.label==='Observed wear').value;
      if(wear===0)r.inputState.find(s=>s.field==='tyreHistory').status+=' — no diameter decrease measured; a finite wear-life estimate is unavailable';
      if(tyre.tyrePlan?.invalidGap||tyre.tyrePlan?.invalidTarget)need('tyres','tyreRequiredGap','Review your optional gear-gap requirement','The existing target cannot be used for this tyre plan. Correct or clear the target; current gear clearance is calculated separately.');
      else if(!tyre.tyrePlan?.missingGear&&(tyre.tyrePlan?.limit==null||tyre.tyrePlan?.invalidMinimum))need('tyres','tyreMinimum','Optional: usable minimum tyre diameter','Your wear history is already included. Add a usable minimum to calculate remaining diameter; remaining laps also require a positive measured wear rate.');
    }
    const electrical=records('control','electricalRows','Loaded electrical measurements');
    if(!electrical.error&&!electrical.entered)need('control','electricalRows','Optional: loaded electrical measurements','Record supply voltage, rail voltage and actual current under the same load. Confirm steady DC to calculate voltage drop and loss.');
    else if(!electrical.error&&base.electricalMode!=='dc')need('control','electricalMode','Confirm the electrical measurement mode','Your readings are already entered. Loss calculations need confirmed steady DC; PWM measurements cannot be treated as steady DC.');
    const braking=records('control','brakeRows','Braking / coasting samples',2);
    if(!braking.error&&braking.rows.length<2)need('control','brakeRows',braking.entered?'Add another speed/time sample':'Optional: measured speed over time',braking.entered?'One sample is recorded. Add a sample at a later time to calculate duration, distance within the record and mean deceleration.':'At least two speed/time samples enable duration, distance within the record and mean deceleration. A brake percentage does not.');
    if(c.adviceSymptom==='brake'&&c.advicePower==='unknown')need('control','advicePower','Braking or coasting?','Record whether releasing the trigger applies electrical braking before interpreting the test.');
    const runs=records('race','experimentRows','Baseline / changed runs');
    if(!runs.error&&!runs.entered)need('race','experimentRows','Record comparable baseline & changed runs','Enter laps by hand or attach recorded runs. Confirm comparable conditions to compare run means; record incidents separately.');
    else if(!runs.error&&!['A','B'].every(side=>runs.rows.some(row=>row.setup===side)))need('race','experimentRows','Add the other setup’s runs','Your existing runs are included. Record both A and B for a comparison.');
    if(!runs.error&&runs.entered&&base.experimentConfirmed!=='yes')need('race','experimentConfirmed','Confirm comparable test conditions','Your runs are recorded. Confirm matching driver, lane and conditions before interpreting a direct A/B comparison.');
    if(!base.strategyPace)need('race','strategyPace','Optional: typical clean lap & incident data','Combines pace, race distance and incident recovery cost to explore race-time trade-offs.');
    if(c.adviceChecks!=='clear')need('checks','adviceChecks','Record your mechanical checks','An unresolved check stays in the suggestions until you report that the guide, tyres, axles and body/pod move freely.');
    const rules=records('checks','rulesRows','Numeric class limits');
    if(!rules.error&&!rules.entered)need('checks','rulesRows','Optional: explicit numeric class limits','Tests entered measurements against minimum/maximum limits. Free-text rules remain notes only.');
    if(use&&mass!==null&&['tip','slide','snap','guide'].includes(c.adviceSymptom))behaviour.why+=` Your included running mass is ${mass} g; mass alone does not locate the CG or establish grip.`;
    if(height!==null&&c.adviceSymptom==='tip')behaviour.action+=` With the ${Number(height.toFixed(3))} mm CG-height input, use Explore a change to compare ballast mass and height. This remains conditional on that input.`;
    r.inputSummary=!use?'Workbench numbers are switched off. The suggestions use your selected observations and any optional advisor measurements below.':`Your workbench numbers are included. Stock weight, motor ratings and tyre size give numeric results below; they do not by themselves identify why the car tips or slides. Select a calculation area to see its results and useful next inputs.`;
    r.usingSetup=use;
    r.missing=[...new Set(r.missing)];return r;
  }
  function snapshot(input){
    // Capture physical inputs and advisor context, never recursive run evidence.
    const workshop=W.clean(input);for(const k of Object.keys(workshop))if(k.startsWith('experiment'))delete workshop[k];
    const advisor=clean(input);for(const key of ['adviceTestObservations','adviceTestChange','adviceResultContext','adviceStep','adviceMeasurement','adviceOutcome','adviceCheckLog','adviceTestId','adviceTestAction','adviceTestKind','adviceSecondary','adviceRouteSkipped','adviceUnavailable'])delete advisor[key];
    let rearDiameter=input.rearDiameter??'';
    if(input.tyreMode==='rim'){const rim=P.positive(input.rimDiameter,1000),thick=P.positive(input.tyreThickness,500);rearDiameter=rim!==null&&thick!==null?String(rim+2*thick):'';}
    return {...P.baseline({...P.blank(),pinion:'',gear:'',...input,rearDiameter}),...T.clean(input),...M.clean(input),...H.snapshot(input),...workshop,...advisor};
  }
  const api={fields,hints,defaults,clean,numeric,components,massProperties,yawPoints,interpolate,support,analyze,snapshot};if(node)module.exports=api;else root.PredictionModel=api;
})(globalThis);
