// Presentation state is separate from saved car data. Result bodies stay mounted.
const ResultFolders=(()=>{
  const KEY='slotforge.telemetry.result-folders.v1',q=s=>document.querySelector(s);
  const definitions=[
    ['drivetrain','Drivetrain overview','gearing','spur-gear'],
    ['performance','Performance','motor','short-can-motor'],
    ['weight','Weight & balance','weight','scales'],
    ['tyres','Tyres & clearance','tyres','wheel-tyre-set'],
    ['magnetic','Magnetic downforce','motor','short-can-motor'],
    ['laps','Lap speed','speed','timer'],
    ['workshop','Testing & planning','tyres','motor-tester']
  ];
  const links={pinion:'performance',ratedRpm:'performance',tyreMode:'tyres',totalWeight:'weight',chassisGuideSpan:'weight',targetRollout:'performance',trackLength:'laps',magneticReadings:'magnetic',workshop:'workshop'};
  const groups=new Map();let active='drivetrain',pinned=new Set(),initialized=false,scrollToken=0;
  function init(){
    try{const saved=JSON.parse(localStorage.getItem(KEY)||'null');if(saved){if(saved.active===null||definitions.some(([k])=>k===saved.active))active=saved.active;if(Array.isArray(saved.pinned))pinned=new Set(saved.pinned.filter(k=>definitions.some(([id])=>id===k)));}}catch{/* Defaults also work with unavailable storage. */}
    const stats=q('#stats');stats.removeAttribute('aria-live');
    const head=q('.preview-title');head.innerHTML='<div><h2>Live results</h2><p class="hint">Open an input folder to see its results. Pin a group to keep it open while you work elsewhere.</p></div><button class="text-button" id="results-collapse">Close unpinned</button>';
    for(const [key,title,category,icon] of definitions){
      const section=document.createElement('section');section.className='result-group';section.dataset.resultGroup=key;section.dataset.category=category;
      section.innerHTML=`<details class="result-folder"><summary><span class="result-title">${sfIcon(icon)}${title}</span><span class="result-summary"></span></summary><div class="result-body" id="result-body-${key}"></div></details><button type="button" class="btn small result-pin" aria-pressed="false" aria-label="Pin ${title} open">Pin</button>`;
      stats.append(section);const details=section.querySelector('details'),summary=details.querySelector('summary'),pin=section.querySelector('.result-pin');
      groups.set(key,{section,details,summary:summary.querySelector('.result-summary'),body:section.querySelector('.result-body'),pin,title});
      summary.onclick=e=>{e.preventDefault();if(details.open){if(active===key)active=null;pinned.delete(key);sync();save();}else open(key);};
      pin.onclick=()=>{if(pinned.has(key))pinned.delete(key);else pinned.add(key);sync();save();};
    }
    groups.get('drivetrain').body.append(q('.drivetrain'));
    groups.get('performance').body.innerHTML='<div id="live-performance" aria-live="polite"></div>';
    const weight=groups.get('weight').body;
    weight.append(q('#ballast-planner'));
    weight.insertAdjacentHTML('beforeend','<div id="live-axle-balance" aria-live="polite"></div>');
    weight.append(q('#chassis-live').parentElement);
    groups.get('tyres').body.innerHTML='<div id="live-tyres" aria-live="polite"></div>';
    groups.get('magnetic').body.innerHTML='<div id="live-magnetic" aria-live="polite"></div>';
    groups.get('laps').body.innerHTML='<div id="live-laps" aria-live="polite"></div>';
    const workshop=q('#workshop-live'),old=workshop.parentElement;groups.get('workshop').body.append(workshop);old.remove();
    q('#results-collapse').onclick=()=>{active=null;sync();save();};
    initialized=true;sync();
  }
  function save(){try{localStorage.setItem(KEY,JSON.stringify({active,pinned:[...pinned]}));}catch{/* No effect on car data or calculations. */}}
  function sync(){for(const [key,g] of groups){g.details.open=active===key||pinned.has(key);g.pin.setAttribute('aria-pressed',String(pinned.has(key)));g.pin.textContent=pinned.has(key)?'Unpin':'Pin';g.pin.setAttribute('aria-label',(pinned.has(key)?'Unpin ':'Pin ')+g.title+(pinned.has(key)?'':' open'));}}
  function open(key,{scroll=false}={}){
    if(!initialized||!groups.has(key))return;active=key;sync();save();if(key==='workshop')refresh(calculationInput());const token=++scrollToken;
    if(scroll)requestAnimationFrame(()=>{const g=groups.get(key);if(token!==scrollToken||q('[data-page=telemetry]').hidden||!g.details.open)return;const rect=g.section.getBoundingClientRect();if(rect.top<0||rect.top>innerHeight-80)g.section.scrollIntoView({block:'nearest',behavior:'instant'});});
  }
  function forInput(element,options){const folder=element?.closest('.workbench-folder');if(folder)open(links[folder.dataset.folder],options);}
  function refresh(input){
    if(!initialized)return;
    const m=TelemetryModel.calculate(input),c=ChassisModel.calculate(input),mag=MagneticModel.calculate(input,m.massG,m.rideHeightChange);
    const number=(v,unit='',digits=2)=>Number.isFinite(v)?performanceNumber(v,digits)+(unit?' '+unit:''):'Not available';
    q('#live-performance').innerHTML=liveStats(input);
    q('#live-axle-balance').innerHTML=input.wheelbase||input.ballastPosition?balanceResults(m):'';
    q('#live-tyres').innerHTML=clearanceResults(m)+`<div class="performance-stats">${telemetryCard('Fitted tyre diameter',m.motor.rearDiameter,'mm')}${telemetryCard('Worn tyre diameter',m.worn?.rearDiameter??null,'mm')}${telemetryCard('Rear axle-height change',m.rideHeightChange,'mm')}${telemetryCard('Rollout with worn tyres',m.worn?.rollout??null,'mm/motor rev')}</div><p class="hint">Wear uses your entered worn diameter, no larger than the current fitted tyre. Axle-height change is half the diameter change; chassis pitch is not modelled. For measured wear history and remaining life, open Testing & planning → Tyre preparation & life.</p>`;
    q('#live-magnetic').innerHTML=magneticResults(input);
    q('#live-laps').innerHTML=`<div class="performance-stats">${telemetryCard('Measured average speed',m.lapSpeed,'km/h')}${telemetryCard('Scale-equivalent average speed',m.scaleSpeed,'km/h')}</div><p class="hint">Enter the distance of the lane actually driven and a measured lap time. This is a lap average, not the motor’s no-load speed. Scale-equivalent speed multiplies that average by the scale denominator; it is not a prediction for a full-size car.</p>`;
    const fit=m.gearFit,clearance=fit.state==='interference'?`Gear protrudes ${number(fit.interference,'mm')} below tyre contact plane`:fit.state==='touching'?'Gear clearance: 0 mm · touching':fit.gap!==null?`Gear clearance: ${number(fit.gap,'mm')}`:'Enter tyre and gear diameters for clearance';
    const tool=q('#workshop-tool').value,w=WorkshopModel.calculate(input,tool),metric=w.metrics?.find(v=>Number.isFinite(v.value));
    const summaries={
      drivetrain:`Ratio ${number(m.motor.ratio,':1',3)} · fitted tyre ${number(m.motor.rearDiameter,'mm')}`,
      performance:`No-load speed: ${number(m.motor.speedKmh,'km/h')} · rollout: ${number(m.motor.rollout,'mm/rev')}`,
      weight:c.error?'Check chassis plan inputs':`Car mass: ${number(m.massG,'g')}${c.planned?' · chassis plan: '+number(c.planned.mass,'g'):c.baseline?' · measured support total: '+number(c.baseline.mass,'g'):m.axleTotal!==null?' · axle readings: '+number(m.axleTotal,'g'):' · chassis support readings needed'}`,
      tyres:clearance,
      magnetic:mag.error?'Check magnetic measurements':`Measured pull: ${number(mag.mean,'gf')} · ${mag.count||0} reading(s)`,
      laps:`Measured lap average: ${number(m.lapSpeed,'km/h')}`,
      workshop:WorkshopModel.tools[tool].title+' · '+(w.error?'Check tool inputs':metric?`${metric.label}: ${number(metric.value,metric.unit,metric.digits??2)}`:w.rows?.length?`${w.rows.length} result row(s)`:'Measurements needed')
    };
    for(const [key,text] of Object.entries(summaries))groups.get(key).summary.textContent=text;
    groups.get('workshop').section.dataset.category=WorkshopModel.tools[tool].category;
  }
  return {init,refresh,open,forInput};
})();
