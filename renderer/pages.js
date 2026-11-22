// A form field the browser rejects (a pinion of 9.5, say) inside a closed section would silently block its form: the
// browser cannot show the message on a field it cannot see. Open every section around it first.
document.addEventListener('invalid',e=>{for(let d=e.target.closest?.('details');d;d=d.parentElement?.closest('details'))d.open=true;},true);
let analysisId=null,analysisTopic='performance',selectedLibraryId=null;
function liveStats(input){
  const m=TelemetryModel.calculate(input);
  return `<div class="performance-stats">${[
    ['Gear ratio',m.motor.ratio,':1',3,'ratio'],['No-load axle speed',m.motor.axleRpm,'RPM',0,'axleRpm'],
    ['No-load speed',m.motor.speedKmh,'km/h',2,'speedKmh'],['Rollout',m.motor.rollout,'mm/motor rev',2,'rollout'],
    ['Estimated peak mechanical power',m.motor.peakPowerW,'W',2,'peakPowerW'],['Estimated peak motor power / mass',m.powerToWeight,'W/kg',2,'powerToWeight']
  ].map(([label,value,unit,digits,key])=>`<div class="performance-stat" data-category="${metricStyle[key][0]}">${metricHeading(key,label)}<strong data-performance-result="${key}">${unitValue(value,unit,digits)} <small>${Units.label(unit)}</small></strong>${key==='peakPowerW'?`<small class="metric-caption">at ${performanceNumber(m.motor.peakMotorRpm,0)} RPM</small>`:key==='powerToWeight'?`<small class="metric-caption">based on ${unitText(m.massG,'g')}</small>`:''}</div>`).join('')}</div><p class="hint">${m.motor.curveReady?'Peak mechanical power uses the ideal brushed DC model, before drivetrain losses; it is not a continuous rating.':'For power estimates, confirm brushed DC, stall torque and matching test voltages.'}${m.massG===null?' Add car weight for power-to-weight.':''}</p>`;
}
// navigate() renders straight away; the hashchange that follows the same change must not render the page a second time.
let renderedHash=null;
function navigate(route){if(location.hash!=='#'+route)location.hash=route;renderRoute();renderedHash=location.hash;}
function hashChanged(){if(location.hash===renderedHash){renderedHash=null;return;}renderedHash=null;renderRoute();}
function renderRoute(){
  if(location.hash==='#analyze/predicted'){history.replaceState(null,'','#feedback');}
  // Laps used to live in Analyze and Library: old links land on the Laps page.
  const moved={'#analyze/races':'#laps/run','#analyze/racecompare':'#laps/compare','#analyze/progress':'#laps','#analyze/records':'#laps','#library/races':'#laps'}[location.hash];if(moved)history.replaceState(null,'',moved);
  const [requested,sub,topic]=location.hash.slice(1).split('/'),page=['telemetry','trackday','laps','analyze','feedback','library','settings'].includes(requested)?requested:'telemetry';
  for(const section of document.querySelectorAll('[data-page]'))section.hidden=section.dataset.page!==page;
  for(const link of document.querySelectorAll('[data-route]')){if(link.dataset.route===page)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');}
  document.title=`${page==='feedback'?'Driver Feedback':page==='trackday'?'Track day':page==='analyze'?'Setups':page[0].toUpperCase()+page.slice(1)} · SlotForge Telemetry`;
  if(page==='trackday')TrackdayUI.render();
  if(page==='library'){readLibrary();renderLibrary();updateLibraryStatus();}
  if(page==='analyze'){
    readLibrary();renderAnalysis();const compare=sub==='compare';
    $('#analysis-overview').hidden=compare;$('#analysis-compare').hidden=!compare;SetupsUI.route(compare);
    for(const link of document.querySelectorAll('[data-analysis-mode]')){if(link.dataset.analysisMode===(sub||'overview'))link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');}
  }
  if(page==='settings'){
    const help=sub==='calculations';SettingsUI.route(page,sub);
    for(const link of document.querySelectorAll('.settings-nav a')){if(link.hash.split('/')[1]===(sub||'appearance'))link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');}
    if(help)renderHelp(topic);
  }
  AnalyzeNav.route(page,sub);LapsUI.route(page,sub);RaceUI.route(page,sub);GarageUI.route(page,sub);BackupsUI.route(page,sub);UpdatesUI.route(page,sub);
  PredictionUI.route(page,sub);
}
function setupOptions(id,selected){
  const select=$('#'+id);select.innerHTML=library.map(item=>`<option value="${item.id}">${esc(item.setup.name)}</option>`).join('');select.value=selected||'';
}
function renderAnalysis(){
  const available=!libraryError&&library.length>0;
  $('#analysis-empty').hidden=available;$('#analysis-content').hidden=!available;
  if(!available)return;
  if(!library.some(e=>e.id===analysisId))analysisId=library[0].id;
  setupOptions('analysis-setup',analysisId);
  const item=library.find(e=>e.id===analysisId),input=CalculatorModel.inputOf(item.setup),m=PerformanceModel.calculate(input);
  $('#analysis-stats').innerHTML=performanceStats(input);$('#analysis-stats').className='analysis-summary';
  AnalyzeNav.refresh(item.setup);renderCurves(input,m);renderTelemetry(input);$('#magnetic-results').innerHTML=magneticResults(input,true);WorkshopUI.renderSaved();ChassisUI.renderSaved();selectAnalysisTopic(analysisTopic);SetupsUI.render();
}
function selectAnalysisTopic(topic){
  analysisTopic=topic;
  for(const button of document.querySelectorAll('[data-analysis-topic]')){const active=button.dataset.analysisTopic===topic;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));}
  for(const panel of document.querySelectorAll('[data-analysis-panel]'))panel.hidden=panel.dataset.analysisPanel!==topic;
}
function showSavedAnalysis(id,compare=false){SetupsUI.select(id,compare);navigate(compare?'analyze/compare':'analyze');}
function focusSetupInput(name){
  if(Object.hasOwn(PredictionModel.fields,name)){PredictionUI.focus(name);return;}
  WorkshopUI.reveal(name);
  // Follow the active tyre-entry mode rather than focusing a hidden diameter input.
  if(name==='rearDiameter'&&state.setup.tyreMode==='rim')name='rimDiameter';
  const field=$('[name="'+name+'"]');if(!field)return;
  ResultFolders.forInput(field);
  for(let parent=field.parentElement;parent;parent=parent.parentElement)if(parent.tagName==='DETAILS')parent.open=true;
  field.focus({preventScroll:true});field.closest('.panel').scrollIntoView({block:'start'});
}
function initializePages(){
  window.addEventListener('hashchange',hashChanged);
  $('.next-step a').onclick=event=>{event.preventDefault();if(activeLibraryId&&library.some(e=>e.id===activeLibraryId))showSavedAnalysis(activeLibraryId);else navigate('analyze');};
  $('#analysis-setup').onchange=e=>{analysisId=e.target.value;renderAnalysis();};
  $('#analysis-edit').onclick=()=>openLibraryTask('load',analysisId);
  for(const button of document.querySelectorAll('[data-edit-inputs]'))button.onclick=()=>{openLibraryTask('load',analysisId);libraryTask.focus=button.dataset.editInputs;};
  for(const button of document.querySelectorAll('[data-analysis-topic]'))button.onclick=()=>selectAnalysisTopic(button.dataset.analysisTopic);
  renderRoute();
}
