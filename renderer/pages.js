let analysisId=null,compareA=null,compareB=null,analysisTopic='performance',selectedLibraryId=null;
function liveStats(input){
  const m=TelemetryModel.calculate(input);
  return `<div class="performance-stats">${[
    ['Gear ratio',m.motor.ratio,':1',3,'ratio'],['No-load axle speed',m.motor.axleRpm,'RPM',0,'axleRpm'],
    ['No-load speed',m.motor.speedKmh,'km/h',2,'speedKmh'],['Rollout',m.motor.rollout,'mm/motor rev',2,'rollout'],
    ['Estimated peak mechanical power',m.motor.peakPowerW,'W',2,'peakPowerW'],['Estimated peak motor power / mass',m.powerToWeight,'W/kg',2,'powerToWeight']
  ].map(([label,value,unit,digits,key])=>`<div class="performance-stat" data-category="${metricStyle[key][0]}">${metricHeading(key,label)}<strong data-performance-result="${key}">${performanceNumber(value,digits)} <small>${unit}</small></strong>${key==='peakPowerW'?`<small class="metric-caption">at ${performanceNumber(m.motor.peakMotorRpm,0)} RPM</small>`:key==='powerToWeight'?`<small class="metric-caption">based on ${performanceNumber(m.massG)} g</small>`:''}</div>`).join('')}</div><p class="hint">${m.motor.curveReady?'Peak mechanical power uses the ideal brushed DC model, before drivetrain losses; it is not a continuous rating.':'For power estimates, confirm brushed DC, stall torque and matching test voltages.'}${m.massG===null?' Add car weight for power-to-weight.':''}</p>${input.wheelbase||input.ballastPosition?balanceResults(m):''}${input.gearDiameter?clearanceResults(m):''}`;
}
function navigate(route){if(location.hash!=='#'+route)location.hash=route;renderRoute();}
function renderRoute(){
  const [requested,sub,topic]=location.hash.slice(1).split('/'),page=['telemetry','analyze','library','settings'].includes(requested)?requested:'telemetry';
  for(const section of document.querySelectorAll('[data-page]'))section.hidden=section.dataset.page!==page;
  for(const link of document.querySelectorAll('[data-route]')){if(link.dataset.route===page)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');}
  document.title=`${page[0].toUpperCase()+page.slice(1)} · SlotForge Telemetry`;
  if(page==='library'){readLibrary();renderLibrary();updateLibraryStatus();}
  if(page==='analyze'){
    readLibrary();renderAnalysis();const compare=sub==='compare';
    $('#analysis-overview').hidden=compare;$('#analysis-compare').hidden=!compare;
    for(const link of document.querySelectorAll('[data-analysis-mode]')){if((link.dataset.analysisMode==='compare')===compare)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');}
  }
  if(page==='settings'){
    const help=sub==='calculations';$('#settings-appearance').hidden=help;$('#settings-calculations').hidden=!help;
    for(const link of document.querySelectorAll('.settings-nav a')){if(link.hash.includes('calculations')===help)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');}
    if(help)renderHelp(topic);
  }
}
function setupOptions(id,selected){
  const select=$('#'+id);select.innerHTML=library.map(item=>`<option value="${item.id}">${esc(item.setup.name)}</option>`).join('');select.value=selected||'';
}
function renderAnalysis(){
  const available=!libraryError&&library.length>0;
  $('#analysis-empty').hidden=available;$('#analysis-content').hidden=!available;
  if(!available)return;
  if(!library.some(e=>e.id===analysisId))analysisId=library[0].id;
  if(!library.some(e=>e.id===compareA))compareA=analysisId;
  if(!library.some(e=>e.id===compareB)||(compareA===compareB&&library.length>1))compareB=(library.find(e=>e.id!==compareA)||library[0]).id;
  setupOptions('analysis-setup',analysisId);setupOptions('compare-a',compareA);setupOptions('compare-b',compareB);
  const item=library.find(e=>e.id===analysisId),input=CalculatorModel.inputOf(item.setup),m=PerformanceModel.calculate(input);
  $('#analysis-stats').innerHTML=performanceStats(input);$('#analysis-stats').className='analysis-summary';
  renderCurves(input,m);renderTelemetry(input);selectAnalysisTopic(analysisTopic);renderComparison();
}
function selectAnalysisTopic(topic){
  analysisTopic=topic;
  for(const button of document.querySelectorAll('[data-analysis-topic]')){const active=button.dataset.analysisTopic===topic;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));}
  for(const panel of document.querySelectorAll('[data-analysis-panel]'))panel.hidden=panel.dataset.analysisPanel!==topic;
}
function renderComparison(){
  const a=library.find(e=>e.id===compareA),b=library.find(e=>e.id===compareB);
  if(!a||!b)return;
  const rows=CompareModel.compare(a.setup,b.setup,$('#compare-goal').value);
  const delta=r=>r.delta===null?'Unavailable':!r.sameBasis?'Different rating basis':`${r.delta>0?'↑ +':r.delta<0?'↓ ':''}${performanceNumber(r.delta,r.digits)} ${r.unit}${r.percent!==null?`<small>${r.percent>0?'+':''}${performanceNumber(r.percent,1)}% from A</small>`:''}`;
  $('#comparison').innerHTML=`${a.id===b.id?'<p class="note">Choose two different saved setups to compare changes.</p>':''}${rows.some(r=>!r.sameBasis)?'<p class="note">Test voltages or motor / torque types differ. Affected metrics are shown without a performance verdict.</p>':''}<div class="table-wrap"><table class="comparison-table"><thead><tr><th>Metric</th><th>Setup A</th><th>Setup B</th><th>Change · B − A</th></tr></thead><tbody>${rows.map(r=>`<tr data-compare-metric="${r.key}"><th>${r.label}<small class="muted"> · ${r.unit}</small></th><td>${performanceNumber(r.a,r.digits)}</td><td>${performanceNumber(r.b,r.digits)}</td><td class="${r.tone}">${delta(r)}</td></tr>`).join('')}</tbody></table></div>`;
}
function showSavedAnalysis(id,compare=false){analysisId=id;if(compare){compareA=id;compareB=(library.find(e=>e.id!==id)||library[0])?.id;}navigate(compare?'analyze/compare':'analyze');}
function focusSetupInput(name){
  const field=$('[name="'+name+'"]');if(!field)return;
  if(field.closest('details'))field.closest('details').open=true;
  field.focus({preventScroll:true});field.closest('.panel').scrollIntoView({block:'start'});
}
function initializePages(){
  window.addEventListener('hashchange',renderRoute);
  $('.next-step a').onclick=event=>{event.preventDefault();if(activeLibraryId&&library.some(e=>e.id===activeLibraryId))showSavedAnalysis(activeLibraryId);else navigate('analyze');};
  $('#analysis-setup').onchange=e=>{analysisId=e.target.value;renderAnalysis();};
  $('#analysis-edit').onclick=()=>openLibraryTask('load',analysisId);
  for(const button of document.querySelectorAll('[data-edit-inputs]'))button.onclick=()=>{openLibraryTask('load',analysisId);libraryTask.focus=button.dataset.editInputs;};
  for(const button of document.querySelectorAll('[data-analysis-topic]'))button.onclick=()=>selectAnalysisTopic(button.dataset.analysisTopic);
  $('#compare-a').onchange=e=>{compareA=e.target.value;renderComparison();};
  $('#compare-b').onchange=e=>{compareB=e.target.value;renderComparison();};
  $('#compare-goal').onchange=renderComparison;
  renderRoute();
}
