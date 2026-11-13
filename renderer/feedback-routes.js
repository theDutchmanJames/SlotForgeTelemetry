(function(root){
  'use strict';
  const choices=(label,options)=>({label,type:'select',options:['unknown|Not sure / skip',...options]});
  const yesno=label=>choices(label,['yes|Yes','no|No']);
  const symptoms=['tip','slide','snap','guide','hop','slow','brake','fade','consistent'];
  const labels={tip:'Tipping',slide:'Rear sliding',snap:'Sudden catching',guide:'Guide escape',hop:'Hopping or vibration',slow:'Lack of power',brake:'Braking',fade:'Deterioration during a run',consistent:'Consistency',unknown:'Identify the behaviour'};
  const symptomOptions=symptoms.map(k=>k+'|'+labels[k]);
  const fields={
    adviceTipFirst:choices('What moves first?',['lift|Inside wheels lift while the guide stays engaged','front|The front leaves first, then the car rolls','catch|The rear slides, catches, then rolls','trip|It trips over a joint, kerb or bump']),
    adviceSlideWhen:choices('When does the rear step out?',['power|When applying power','coast|While coasting','brake|While braking','all|In most conditions']),
    adviceCatchResult:choices('What happens when it catches?',['straight|It straightens abruptly but stays on track','tip|It lifts onto two wheels or tips','hop|It hops or chatters','guide|The guide comes out']),
    adviceCatchTrigger:choices('What coincides with the catch?',['power|Adding or changing power','rails|Realigning with the rails','neither|Neither that I can see']),
    adviceGuideWhen:choices('When does the front leave the slot?',['bump|At a crest, bridge or joint','accel|Under acceleration','tight|In tight corners','direction|Mainly in one turning direction','all|Throughout the track','roll|The car rolls before the guide leaves']),
    adviceGuideFirst:choices('Does the nose lift, or does power cut out first?',['lift|The nose visibly lifts','cutout|Power cuts out first','neither|Neither is clear']),
    adviceHopWhen:choices('When does it hop or vibrate?',['straight|On straights, increasingly with speed','power|Mainly under acceleration','corner|Only in corners','local|At one track section','after|Since wheel, gear or pod work']),
    adviceWeakWhere:choices('What feels weak?',['accel|Pulling away or exiting corners','top|Straight-line speed despite good acceleration','revs|Motor sounds fast but the car barely accelerates','cutout|Hesitation or intermittent cutouts','fade|Starts strong, then weakens','tight|Slows unusually in tight turns','trigger|Difficult to control through the trigger travel']),
    adviceFadeWhat:choices('What gets worse during the run?',['power|Power or acceleration','grip|Rear grip','guide|Guide retention','brake|Braking','pace|General lap pace']),
    adviceConsistentWhat:choices('What prevents consistent laps?',['incident|Repeated tipping, sliding, hopping or guide escape','unpredictable|Different behaviour at the same corner','times|Variable times but few incidents','tradeoff|One setup is faster but harder to control','fade|It changes character during the run']),
    adviceUnknownWhat:choices('Which behaviour comes closest?',symptomOptions),
    advicePrimaryIncident:choices('Which behaviour happens first or matters most?',symptomOptions.filter(o=>!o.startsWith('consistent|'))),
    adviceOnset:choices('Has it always behaved this way?',['new|New car / first runs','always|Always behaved this way','recent|Started recently']),
    adviceTrued:yesno('Were the tyres recently trued or reshaped?'),
    adviceShoulder:choices('What do the rear tyre shoulders look like?',['square|Sharply squared edges','rounded|Rounded edges']),
    adviceMountChange:choices('Which mounting adjustment changed?',['body|Body screws','pod|Motor pod','both|Both']),
    adviceMovement:choices('Does the body or pod contact anything through its intended movement?',['yes|Yes, it rubs or catches','no|No contact found']),
    adviceDriveSlip:choices('What seems to slip?',['rim|A tyre slips on its rim','track|The rear wheels spin on the track','hardware|A wheel or gear is loose on its shaft','none|No slipping found']),
    adviceRevs:yesno('Does the motor rev while the car struggles to accelerate?'),
    adviceStillGaining:yesno('Is it still gaining speed before the braking point?'),
    adviceGentle:yesno('Does gentler throttle reduce the problem?'),
    adviceLowerSpeed:yesno('Does it still slide at a slightly lower corner-entry speed?'),
    adviceOtherCorner:yesno('Does it happen in other corners turning the same way?'),
    adviceOtherCar:yesno('Does another car struggle at that same location?'),
    adviceFrontContact:choices('Are the front tyres or braids preventing full guide engagement?',['yes|Yes, they appear to hold it up','no|No, engagement looks correct']),
    adviceCutoutWhere:choices('Where does the interruption happen?',['location|At the same track location','angle|At a particular guide angle','all|Throughout the track']),
    adviceSharedPower:yesno('Does it change when another car accelerates or leaves the track?'),
    adviceSystem:choices('Which track system are you using?',['analogue|Analogue','digital|Digital']),
    adviceFullTrigger:choices('Is it weak at full trigger, or difficult through the trigger travel?',['full|Weak even at full trigger','travel|Poor control through the trigger travel','both|Both']),
    adviceBrakeAdjust:choices('Does adjusting the controller brake affect this car?',['yes|Yes, the response changes','no|No noticeable change','fixed|No adjustable brake / not available']),
    adviceBrakeDirection:choices('Does it turn sideways in the same direction?',['same|Always the same direction','varies|Direction varies']),
    adviceCooling:yesno('Does it recover after cooling?'),
    adviceCleaning:yesno('Does permitted tyre cleaning restore the grip?'),
    adviceOthersFade:yesno('Do other cars change similarly during the session?'),
    adviceRunContext:choices('What accompanies the changing lap times?',['traffic|Traffic, interruptions or lane changes','warmup|Warm-up or preparation changes','matched|Comparable clear runs']),
    adviceRepeatConditions:choices('Were throttle action and preparation comparable?',['yes|Yes, as far as I can tell','no|No, conditions or driving changed']),
    advicePriority:choices('What matters most for this test?',['comfort|Comfortable, predictable driving','race|Repeatable racing with fewer incidents','best|A best-lap attempt']),
    adviceTestKind:choices('What did you test?',['inspection|An inspection for a fault','change|A setup or controller change']),
    adviceSecondary:choices('Which different problem appeared?',symptomOptions),
    adviceRouteSkipped:{label:'Skipped feedback questions',type:'hidden',max:5000},
    adviceUnavailable:{label:'Checks unavailable to this user',type:'hidden',max:5000}
  };
  const manuals={basics:{title:'SlotRacer: inspection and maintenance',url:'https://slotracer.online/manual/basics.php'},tuning:{title:'SlotRacer: tuning',url:'https://slotracer.online/manual/tuning.php'},controller:{title:'SlotRacer: controllers',url:'https://slotracer.online/manual/controllers.php'},power:{title:'SlotRacer: track power',url:'https://slotracer.online/manual/power.php'}};
  function list(raw){if(!raw)return [];let a;try{a=JSON.parse(raw);}catch{throw Error('Could not read the saved feedback choices.');}if(!Array.isArray(a)||a.length>100||a.some(x=>typeof x!=='string'||! /^[a-zA-Z][a-zA-Z0-9-]{0,79}$/.test(x))||new Set(a).size!==a.length)throw Error('Invalid saved feedback choices.');return a;}
  function resolve(input={}){
    const i={...Object.fromEntries(Object.keys(fields).map(k=>[k,fields[k].type==='select'?'unknown':''])),...input};
    if(i.adviceSlideWhen==='unknown'&&['power','coast','brake'].includes(i.advicePower))i.adviceSlideWhen=i.advicePower;
    const savedList=raw=>{try{return list(raw);}catch{return [];}};
    const questions=[],suggestions=[],path=[],overrides={},active=new Set();let symptom=Object.hasOwn(labels,i.adviceSymptom)?i.adviceSymptom:'unknown';
    const ask=(field,why)=>{const value=i[field]||'unknown';if(!active.has(field)){active.add(field);questions.push({field,title:fields[field]?.label||field,why,level:1,value});}return value;};
    const say=(id,title,why,action,principle='freedom',extra={})=>suggestions.push({id:'route-'+id,title,why,action,principles:[principle],basis:'Your answers',rank:91,area:'handling',kind:'inspection',effort:'Quick inspection',tools:'No measuring tools',alternative:'Watch one familiar section at a comfortable pace and record what moves first. Skip this check until you can inspect it.',test:'Repeat the same section with comparable preparation and throttle input. Record handling and incidents; change one thing at a time.',...extra});
    const go=s=>{symptom=s;};
    const local=()=>say('local','Inspect the location before changing the car','The problem is tied to a bump, joint or particular section.','With power off, inspect the slot and rails there, then compare another section. Check actual gear and underside gaps; do not add ballast to compensate for a snag.','context',{manual:'basics'});
    // Follow explicit crossover answers, bounded by visited nodes. Keep the original symptom intact.
    for(let count=0;count<10&&!path.includes(symptom);count++){
      path.push(symptom);const before=symptom;
      if(symptom==='unknown'){const a=ask('adviceUnknownWhat','Choose the first movement you notice; no measurements are needed.');if(symptoms.includes(a))go(a);else say('observe','Observe one familiar corner','The behaviour has not been identified yet.','At a comfortable pace, watch whether wheels lift, the rear slides, the nose leaves, or the car hesitates. Choose the closest description when ready.','context');}
      if(before==='tip'){
        const a=ask('adviceTipFirst','Guide escape, a snag and wheel lift need different first checks.');
        if(a==='front')go('guide');else if(a==='catch')go('snap');else if(a==='trip'){local();overrides.adviceDirection='one';}
        else if(a==='lift'){say('wheel-lift','Check what permits the wheel lift','The inside wheels lift before the guide leaves.','Inspect body/pod freedom and contact first. If those checks pass, compare permitted ways to lower existing mass before adding ballast.','balance',{measure:'height',manual:'tuning'});ask('adviceMovement','Contact can imitate a balance problem; inspect before altering mass.');}
      }
      if(before==='slide'){
        const a=ask('adviceSlideWhen','Separates power delivery, corner-entry speed and braking.');
        if(['power','coast','brake'].includes(a))overrides.advicePower=a;
        if(a==='brake'){overrides.adviceBrakeFeel='sideways';go('brake');}
        if(a==='power'){ask('adviceWheelspin','Observed wheelspin prioritises traction and delivery over more wheel torque.');say('power-slide','Compare gentler delivery first','The rear steps out when power is applied.','Try gentler, smoother throttle delivery with the same motor and tyres. Inspect tyre condition and seating; extra wheel torque may make this harder to control.','tyres',{kind:'change',effort:'Simple comparison',manual:'tuning'});}
        if(a==='coast'){ask('adviceLowerSpeed','A lower-entry-speed comparison helps separate driving conditions from a persistent car problem.');say('coast-slide','Compare corner-entry speed',i.adviceLowerSpeed==='no'?'You report that the slide disappears at a slightly lower entry speed.':'The slide occurs while coasting.','Confirm electrical braking is off. Compare a slightly lower entry speed; if it persists, inspect tyres and rubbing rather than changing motor RPM.','tyres',{kind:'change',effort:'Simple comparison'});}
        if(a==='all')say('general-slide','Inspect rear contact and preparation','The rear slides in several conditions.','Check tyre seating, permitted cleaning and rubbing first. If those checks pass, use measured support loads for a reversible placement comparison.','tyres',{manual:'basics'});
      }
      if(before==='snap'){
        const a=ask('adviceCatchResult','The movement after the catch determines whether to investigate roll, vibration or guide retention.');
        if(['tip','hop','guide'].includes(a))go(a);
        else if(a==='straight'){const b=ask('adviceCatchTrigger','Separates a throttle event from possible position-dependent magnetic behaviour.');say('catch','Separate the trigger from the recovery','The car straightens abruptly but stays on the track.',b==='power'?'Compare a smoother trigger input and inspect tyre rubbing before changing mass or motor.':b==='rails'?'Observe whether recovery coincides with realignment. Only on responsive rails, consider matched motor-off angle-force measurements; straight-ahead pull alone cannot explain recovery.':'Inspect tyre/body contact and record whether throttle input or alignment changes at the catch.','magnetic',{measure:b==='rails'?'yaw':undefined});}
      }
      if(before==='guide'){
        const a=ask('adviceGuideWhen','Local bumps, binding in tight turns and lifting under power need different checks.');
        if(a==='roll')go('tip');
        if(a==='bump'){local();overrides.adviceDirection='one';ask('adviceOtherCar','A second car at the same location helps separate track and car-specific checks.');}
        if(a==='accel'){overrides.advicePower='power';const b=ask('adviceGuideFirst','Visible nose lift and loss of electrical contact should not receive the same ballast advice.');if(b==='cutout'){go('slow');overrides.adviceWeakWhere='cutout';}else say('nose-lift','Check engagement before front ballast','The front departure happens under acceleration.','Inspect braid seating and front contact. With confirmed support readings, compare a ballast placement that preserves guide engagement; first exclude binding.','front',{measure:'chassis',manual:'basics'});}
        if(['tight','direction'].includes(a))say('guide-bind','Inspect guide rotation through the turn','The front departure is associated with tight or directional turns.','With power off, check blade clearance, wire tension and body interference through both directions. Compare another equivalent corner.','front',{manual:'basics'});
        if(a==='all'){ask('adviceFrontContact','Front tyres or bulky braids can prevent the blade seating properly.');say('front-contact','Check the actual front contacts','The guide leaves in many locations.',i.adviceFrontContact==='yes'?'Correct the reported contact problem within the car maker’s adjustment range, then retest before adding mass.':'Inspect blade engagement and braid seating on a flat track section. Record which front contacts actually carry load before weighing.','front',{manual:'basics',unresolved:i.adviceFrontContact==='yes'});}
      }
      if(before==='hop'){
        const a=ask('adviceHopWhen','The location and load distinguish rotating-part checks from grip or track checks.');
        if(a==='local'){local();overrides.adviceDirection='one';}
        if(a==='straight')say('roundness','Inspect the rotating parts','Vibration increases with speed on straights.','With power off, inspect tyre seating, wheel security, axle condition and rotating contact. Measured diameter variation can guide inspection but is not radial runout.','tyres',{measure:'tyres',manual:'tuning'});
        if(a==='power'){ask('adviceGentle','If gentler input reduces hopping, investigate delivery and movement under load.');say('power-hop','Compare the hopping under gentler input',i.adviceGentle==='no'?'Gentler throttle did not reduce the hopping.':'The hopping appears mainly under acceleration.',i.adviceGentle==='no'?'Prioritise wheel seating, axle alignment, gear mesh and motor security.':'Compare gentler throttle with the original input, then inspect tyre contact and pod movement under load. Do not stiffen every mounting at once.','tyres',{kind:i.adviceGentle==='no'?'inspection':'change',manual:'tuning'});}
        if(a==='corner')say('corner-hop','Inspect movement through cornering','Hopping appears only in corners.','Check tyre/body contact through permitted body and pod movement. Compare previous tyre preparation if this began after a tyre change.','gripRoll',{manual:'tuning'});
        if(a==='after')say('assembly','Inspect the recently worked assembly','The symptom followed wheel, gear or pod work.','Check seating, security, mesh and clearance on that assembly. Compare its previous secure adjustment before trying different stiffness or ballast.','freedom',{tools:'Suitable screwdriver',manual:'tuning'});
      }
      if(before==='slow'){
        const a=overrides.adviceWeakWhere||ask('adviceWeakWhere','Weak acceleration, low straight-line speed and intermittent power need different investigations.');
        if(a==='fade'){go('fade');overrides.adviceFadeWhat='power';}
        if(a==='accel'){const b=ask('adviceRevs','A fast-sounding motor may indicate slip rather than insufficient motor output.');if(b==='yes')ask('adviceDriveSlip','Distinguish tyre-on-rim slip, wheelspin and loose transmission parts.');else say('acceleration','Check resistance and pickup before gearing','Pull-away or corner-exit acceleration feels weak.','Inspect rubbing, gear mesh and pickup. If those checks pass and the tyres do not spin, compare shorter gearing with the same motor and fitted tyres.','gearing',{measure:'drive'});}
        if(a==='revs')ask('adviceDriveSlip','A tyre can slip on its rim even when the wheel is secure on the axle.');
        if(a==='top'){ask('adviceStillGaining','A taller ratio is not automatically helpful if the car is still accelerating at the braking point.');say('straight-speed','Compare rollout with the available straight',i.adviceStillGaining==='yes'?'The car is still gaining speed before braking.':i.adviceStillGaining==='no'?'You report that speed seems to level off.':'Acceleration feels good but straight-line speed seems low.','Check pickup and mechanical freedom, then compare rollout and loaded performance on this track. A no-load speed ceiling does not establish achievable speed; do not automatically fit taller gearing.','gearing',{measure:'drive'});}
        if(a==='cutout'){ask('adviceCutoutWhere','A fixed location suggests track contact; a guide angle suggests braids or wires.');say('cutout','Locate the interruption','The car hesitates or cuts out.',i.adviceCutoutWhere==='location'?'Compare another car at that section and inspect rail connections and pickup.':i.adviceCutoutWhere==='angle'?'With power off, inspect braid contact and lead wires through the guide’s rotation.':'Inspect braids, connectors and lead wires, then compare a compatible controller or lane under otherwise similar conditions.','freedom',{manual:'basics'});}
        if(a==='tight')say('tight-drag','Check corner-dependent binding','The car slows unusually in tight turns.','Inspect guide binding, wire tension and tyre/body rubbing through the turn before considering a motor change.','freedom',{manual:'basics'});
        if(a==='trigger')overrides.adviceFullTrigger='travel';
      }
      if(before==='brake'){
        const a=overrides.adviceBrakeFeel||ask('adviceBrakeFeel','Weak, abrupt, variable and sideways braking need different tests.');
        if(['weak','strong'].includes(a))ask('adviceBrakeAdjust','Establish whether a brake adjustment changes the response before changing gearing.');
        if(a==='sideways')ask('adviceBrakeDirection','A repeatable direction calls for tyre, rubbing and guide checks.');
        if(a==='varying')ask('adviceCutoutWhere','Intermittent contact can also affect braking; check whether the variation is tied to a location or guide angle.');
        if(a!=='unknown')say('brake','Test the brake response you described','Braking feels '+({weak:'too weak',strong:'too abrupt',sideways:'sideways',varying:'inconsistent'})[a]+'.',a==='strong'&&i.adviceBrakeAdjust==='fixed'?'Check the documented braking behaviour and pickup. With no adjustable brake, compare a controlled entry speed before changing the car.':a==='strong'?'Compare one small reduction in braking at the same entry speed, keeping the car setup fixed.':a==='sideways'?(i.adviceBrakeDirection==='same'?'Inspect tyre matching, rubbing and guide freedom on both sides before changing the brake.':'Compare controlled entry speed and one brake adjustment; keep tyre preparation unchanged.'):a==='varying'?'Check contact and the time/location of the variation before changing motor or gearing.':i.adviceBrakeAdjust==='no'?'Check that braking is enabled for this system and pickup is reliable. Compare a known compatible controller; an unchanged response is not proof the motor is faulty.':i.adviceBrakeAdjust==='fixed'?'Check the system’s documented brake behaviour and pickup. Do not assume trigger release applies electrical braking.':'Compare one available brake adjustment at a matching entry speed. Confirm that trigger release applies braking rather than coasting.','brakes',{kind:['strong','weak'].includes(a)&&i.adviceBrakeAdjust!=='fixed'?'change':'inspection',measure:'power',manual:'controller'});
      }
      if(before==='fade'){
        const a=overrides.adviceFadeWhat||ask('adviceFadeWhat','Identify what changes before attributing the whole problem to heat or wear.');
        if(a==='power'){ask('adviceCooling','Recovery after cooling establishes a pattern, not a motor-temperature diagnosis.');say('warm-power','Compare cold and warm performance',i.adviceCooling==='yes'?'Performance recovers after cooling.':i.adviceCooling==='no'?'The loss persists after cooling.':'Power fades as the run continues.',i.adviceCooling==='no'?'Inspect lasting changes in rubbing, gear mesh and electrical contact. Compare against the earlier baseline.':'Compare matched early and late runs; inspect resistance and electrical delivery. Use measured loaded voltage/current or motor tests if available. Warmth alone cannot identify a fault.','gearing',{measure:'power'});}
        if(a==='grip'){ask('adviceCleaning','Restoration after permitted cleaning points to a preparation check; it does not establish a compound coefficient.');say('fading-grip','Inspect preparation and tyre change',i.adviceCleaning==='yes'?'Permitted cleaning restores the grip.':i.adviceCleaning==='no'?'Cleaning does not restore the grip.':'Rear grip deteriorates during the run.',i.adviceCleaning==='yes'?'Repeat the same approved cleaning and preparation interval. Check contamination before changing compound or ballast.':'Inspect wear, seating and new rubbing. Compare fitted diameters and clearance with the early-run baseline; wear alone does not prove grip loss.','tyres',{measure:'tyres',manual:'basics'});}
        if(a==='guide'){go('guide');say('fading-guide','Inspect what changes at the front','Guide retention gets worse as the run continues.','Check braids, loose parts, wire routing and newly occurring contact. Measure only changes you can establish.','front');}
        if(a==='brake')go('brake');
        if(a==='pace'){go('consistent');overrides.adviceConsistentWhat='times';}
        ask('adviceOthersFade','A shared change directs attention to track and supply conditions before altering one car.');
      }
      if(before==='consistent'){
        const a=overrides.adviceConsistentWhat||ask('adviceConsistentWhat','Separate a repeated handling problem from variation in otherwise clean laps.');
        if(a==='incident'){const b=ask('advicePrimaryIncident','Choose the first or most troublesome behaviour; the other observations remain saved.');if(symptoms.includes(b))go(b);}
        if(a==='fade')go('fade');
        if(a==='unpredictable'){ask('adviceRepeatConditions','Unmatched preparation or inputs need a better comparison before attributing the change to the setup.');say('repeatability','Establish a repeatable comparison',i.adviceRepeatConditions==='yes'?'You report comparable preparation and throttle action.':'Conditions or inputs are not yet confirmed comparable.',i.adviceRepeatConditions==='yes'?'Inspect intermittent contact and rubbing, then look for progression during the run.':'Repeat a short run with the same lane, preparation and comfortable throttle input. Keep interruptions separate.','pace',{kind:'change',measure:'laps'});}
        if(a==='times'){ask('adviceRunContext','Traffic, warm-up and comparable clear runs should not be pooled as the same test.');say('lap-context','Keep the lap context attached','Lap times vary without a clear dominant handling fault.',i.adviceRunContext==='traffic'?'Separate traffic, lane changes and interruptions before comparing clean runs.':i.adviceRunContext==='warmup'?'Compare the same warm-up and preparation phase in each run.':'Compare typical pace, spread and valid sequences; a single fastest lap cannot establish the cause of variation.','pace',{measure:'laps'});}
        if(a==='tradeoff'){ask('advicePriority','Your goal changes whether repeatability or a best-lap attempt leads the comparison.');say('goal','Compare the result against your goal','One setup feels faster but harder to control.',i.advicePriority==='best'?'Compare best valid laps across repeated comparable attempts, alongside typical pace and incidents. Label this a best-lap goal; do not call it the best race setup.':i.advicePriority==='comfort'?'Prioritise predictable response and fewer unwanted departures. A small fastest-lap gain need not justify harder control.':'Compare typical pace, incidents and recovery loss over the intended race. Do not add recovery time again if lap times already include it.','pace',{kind:'change',measure:'laps'});}
      }
      if(symptom===before)break;
    }
    // If crossovers return to a visited node, retain the first behaviour rather than looping.
    const cycle=path.length>1&&symptom!==path[path.length-1];
    if(cycle){const last=questions.at(-1);if(last){last.level=0;last.review=true;last.why='These answers point back to an earlier behaviour. Review which part moves first; the cause is still uncertain.';}say('sequence','Clarify the order of movement','The selected sequence points back to an earlier behaviour.','Watch the first movement at a comfortable pace and revise the answer above. Keep a separate investigation for a second symptom.','context',{rank:115});}
    if(!path.includes(symptom))path.push(symptom);
    if(!suggestions.length)say('start-'+symptom,'Start with '+labels[symptom].toLowerCase(), 'Your first description selects this investigation.','Watch the first movement at a comfortable pace, then answer the question above or choose a relevant mechanical check below.','context',{rank:45});
    const selected=k=>overrides[k]||i[k];
    if(symptom!=='unknown'){
      ask('adviceOnset','A new or unchanged car needs preparation checks; recent deterioration calls for a previous baseline.');
      if(i.adviceOnset==='new')overrides.adviceRecentChange='unknown';if(i.adviceOnset!=='new')ask('adviceRecentChange','Compare the affected parts and previous setting before an unrelated modification.');
      ask('adviceDirection','One location prioritises track checks; one direction prioritises asymmetric contact.');
      if(['left','right'].includes(i.adviceDirection))ask('adviceOtherCorner','A single corner and several same-direction corners are different comparisons.');
      if(i.adviceDirection==='one')ask('adviceOtherCar','Another car can help distinguish that location from this car’s setup.');
    }
    if(i.adviceOnset==='recent')say('recent','Compare with the last working setup','The problem started recently.','Check what changed or deteriorated since the car last ran well. Compare the previous preparation and secure settings before buying parts.','context',{rank:55});
    if(i.adviceOtherCar==='yes'&&active.has('adviceOtherCar'))say('shared-location','Inspect the shared track location','Another car also struggles at that location.','Inspect the section and connections, then compare both cars elsewhere. This does not prove the track is the only cause.','context',{rank:97});
    if(i.adviceOtherCorner==='no'&&active.has('adviceOtherCorner'))local();
    if(i.adviceOtherCorner==='yes'&&active.has('adviceOtherCorner'))say('direction','Compare left and right contact','The problem repeats in several corners turning the same way.','Inspect tyre matching, rubbing and guide-wire tension. Repeat left/right support readings if available before moving ballast.','balance',{measure:'tyres'});
    if(['tip','snap'].includes(symptom)||path.includes('snap')||(symptom==='hop'&&i.adviceHopWhen==='corner')){
      ask('adviceTrued','Recent reshaping makes tyre shoulder and profile inspection relevant before ballast.');
      if(i.adviceTrued==='yes'){ask('adviceShoulder','Inspect the outer edges; sharp shoulders are a possible contributor, not a diagnosis.');say('shoulders','Inspect the recently shaped tyres',i.adviceShoulder==='square'?'You report sharply squared rear tyre shoulders.':i.adviceShoulder==='rounded'?'The shoulders are already rounded.':'The tyres were recently trued or reshaped.',i.adviceShoulder==='rounded'?'Do not remove more material just because the tyres were trued. Check seating, matching and rubbing, then test body/pod freedom.':'Inspect shoulders, seating and rubbing before ballast. Compare permitted profiling for this tyre; do not blindly sand or apply a generic treatment.','gripRoll',{manual:'tuning',measure:'tyres'});}
    }
    if(selected('adviceRecentChange')==='body'){
      ask('adviceMountChange','Body and motor-pod adjustments affect different contacts; inspect the one that changed.');ask('adviceMovement','Check intended movement without loosening all mountings at once.');
      say('mounting','Recheck the '+({body:'body screws',pod:'motor pod',both:'body and pod'}[i.adviceMountChange]||'changed mounting'),'The behaviour followed a mounting adjustment.',i.adviceMountChange==='pod'?'Inspect pod security, gear/tyre clearance and movement within the maker’s range. Compare the previous secure pod setting while keeping body adjustment fixed.':i.adviceMountChange==='body'?'Inspect body posts, cockpit and tyre clearance through movement. Compare the previous secure body setting while keeping the pod fixed.':'Record body and pod settings separately. Compare one secure setting at a time and check contact through the intended movement.','freedom',{tools:'Suitable screwdriver',manual:'tuning'});
    }
    if(active.has('adviceMovement')&&i.adviceMovement==='yes')say('rubbing','Resolve the reported contact first','You found contact through body or pod movement.','Correct the contact within permitted adjustments and retest before adding ballast or grip. Do not loosen everything indiscriminately.','freedom',{rank:124,unresolved:true,manual:'tuning'});
    if(active.has('adviceDriveSlip')&&i.adviceDriveSlip!=='unknown'){
      const a=i.adviceDriveSlip;if(a==='track'){overrides.adviceWheelspin='yes';overrides.advicePower='power';}
      say('drive-slip',a==='rim'?'Check tyre-to-rim attachment':a==='hardware'?'Secure the slipping transmission part':a==='track'?'Investigate wheelspin before more torque':'Continue after the slip check','You reported '+({rim:'a tyre moving on its rim',hardware:'a loose wheel or gear',track:'wheelspin on the track',none:'no slipping'})[a]+'.',a==='rim'?'With power disconnected, gently verify whether the tyre moves independently of its wheel. Use only a tyre/rim-compatible and permitted attachment method.':a==='hardware'?'With power disconnected, inspect and secure the wheel or gear using the part maker’s method; check mesh and free movement afterwards.':a==='track'?'Compare gentler delivery and tyre preparation before a torque increase.': 'Inspect mechanical resistance and pickup, then compare gearing with the current motor.','tyres',{rank:a==='rim'||a==='hardware'?124:95,unresolved:a==='rim'||a==='hardware',manual:'tuning',measure:a==='none'?'drive':undefined});
    }
    const electrical=(symptom==='slow'&&!['tight','revs'].includes(selected('adviceWeakWhere'))&&!['rim','hardware','track'].includes(active.has('adviceDriveSlip')?i.adviceDriveSlip:''))||symptom==='brake'||(path.includes('fade')&&selected('adviceFadeWhat')==='power');
    if(electrical){
      ask('adviceSystem','Analogue and digital systems need different controller and electrical checks.');
      if(symptom==='slow'||(path.includes('fade')&&selected('adviceFadeWhat')==='power')){if(!overrides.adviceFullTrigger)ask('adviceFullTrigger','Separates delivered power at full trigger from an unsuitable response curve.');ask('adviceSharedPower','A change with another car directs attention to shared supply or system behaviour.');}
      if((active.has('adviceFullTrigger')||overrides.adviceFullTrigger)&&['travel','both'].includes(selected('adviceFullTrigger')))say('trigger','Check the useful trigger range','The response through the trigger travel is difficult to control.',i.adviceSystem==='digital'?'Check the system’s documented car speed, acceleration, brake and controller settings. Compare one setting at a time; do not treat track voltage as voltage at the motor.':i.adviceSystem==='analogue'?'Check available sensitivity/response settings and controller compatibility with this motor. Compare a known compatible controller before changing the car.':'Identify the controller and track system if possible. Compare the response with a known compatible setup; do not change supply wiring or assume an adjustable brake.','gearing',{kind:'change',effort:'Simple adjustment',manual:'controller',rank:98});
      if(active.has('adviceFullTrigger')&&selected('adviceFullTrigger')==='full')say('full-power','Check delivered power at full trigger','You report weakness even at full trigger.',i.adviceSystem==='digital'?'Check documented car power limits and system settings, then pickup and drivetrain freedom. Track voltage alone is not motor voltage.':'Check pickup and mechanical freedom. If available on an analogue system, compare loaded electrical measurements before changing the motor. Response-curve adjustment alone does not establish more full-trigger power.','gearing',{rank:98,manual:'power',measure:i.adviceSystem==='analogue'?'power':undefined});
      if(active.has('adviceSharedPower')&&i.adviceSharedPower==='yes')say('shared-power','Investigate the shared power response','Performance changes when another car accelerates or leaves.',i.adviceSystem==='digital'?'Check documented powerbase and car settings and supported supply capacity. Digital electronics can affect delivery; use system-appropriate measurements.':i.adviceSystem==='analogue'?'Inspect connections and compare loaded rail voltage under the same conditions with one and more cars. Use only supported supply arrangements.':'Identify the system, then compare one-car and multi-car behaviour without altering wiring. Do not assume a particular voltage or supply upgrade.','context',{rank:102,manual:'power',measure:i.adviceSystem==='analogue'?'power':undefined});
    }
    if(active.has('adviceOthersFade')&&i.adviceOthersFade==='yes')say('shared-fade','Compare shared session conditions','Other cars also change during the session.','Check track condition, preparation, warm-up and supply behaviour before changing one car. Compare matched early/late runs.','context',{rank:99,measure:'laps'});
    return {symptom,path,overrides,questions,suggestions,active:[...active],electrical,
      handling:!(symptom==='tip'&&i.adviceTipFirst==='trip')&&!(symptom==='guide'&&['bump','tight','direction'].includes(i.adviceGuideWhen)),
      drive:symptom!=='slow'||(!['cutout','tight','trigger','revs'].includes(selected('adviceWeakWhere'))&&selected('adviceFullTrigger')!=='travel'&&(!active.has('adviceDriveSlip')||!['rim','hardware','track'].includes(i.adviceDriveSlip))),
      wear:path.includes('fade')&&selected('adviceFadeWhat')==='grip',
      skip:savedList(i.adviceRouteSkipped),unavailable:savedList(i.adviceUnavailable)};
  }
  const api={fields,labels,manuals,list,resolve};if(typeof module==='object'&&module.exports)module.exports=api;else root.FeedbackRoutes=api;
})(globalThis);
