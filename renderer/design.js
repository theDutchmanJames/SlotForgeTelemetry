// Shared presentation only; calculation and saved-setup behaviour live elsewhere.
function initializeDesign(){
  const homeHead=document.querySelector('[data-page=telemetry] .page-head'),setupPanel=document.querySelector('.setup-panel');
  homeHead.classList.add('workbench-toolbar');homeHead.firstElementChild.replaceChildren(setupPanel);
  const decorate=(selector,name)=>{for(const el of document.querySelectorAll(selector))el.insertAdjacentHTML('afterbegin',sfIcon(name));};
  document.querySelector('.brand-mark').innerHTML='<img src="../assets/icon.svg" alt="" width="42" height="42">';
  for(const [route,name] of Object.entries({telemetry:'setup',analyze:'timer',feedback:'list',library:'library',settings:'settings'})){
    const link=document.querySelector(`[data-route="${route}"]`);link.querySelector('svg')?.remove();link.insertAdjacentHTML('afterbegin',sfIcon(name));
  }
  for(const [field,tone,name] of [['pinion','gearing','spur-gear'],['ratedRpm','motor','short-can-motor'],['tyreMode','tyres','wheel-tyre-set'],['totalWeight','weight','scales']]){
    const panel=document.querySelector(`[name="${field}"]`).closest('.panel');panel.dataset.category=tone;
    panel.querySelector('.step')?.remove();panel.querySelector('h2').insertAdjacentHTML('afterbegin',`<i class="icon-tile">${sfIcon(name)}</i>`);
  }
  document.querySelector('.motor-details').open=true;
  const inputSections=[['pinion','Gearing','gearing'],['ratedRpm','Motor','motor'],['tyreMode','Tyres & clearance','tyres'],['totalWeight','Weight & ballast','weight'],['chassisGuideSpan','Chassis geometry & balance','chassis'],['targetRollout','Gear finder','gears'],['trackLength','Lap speed','laps'],['magneticReadings','Magnetic downforce','magnetic'],['workshop-tool','Testing & planning','workshop']];
  document.querySelector('#setup-sections').innerHTML='<span class="input-nav-label">Setup inputs</span>'+inputSections.map(([field,label,topic])=>`<button type="button" data-input-jump="${field}" data-category="${topicStyle[topic][0]}">${sfIcon(topicStyle[topic][1])}${label}</button>`).join('');
  for(const button of document.querySelectorAll('[data-input-jump]'))button.onclick=()=>{if(button.dataset.inputJump==='workshop-tool'){document.querySelector('#workshop-tool').focus();document.querySelector('.workshop-inputs').scrollIntoView({block:'start'});}else focusSetupInput(button.dataset.inputJump);};
  for(const [topic,field,label] of [['performance','ratedRpm','Motor & gearing'],['weight','totalWeight','Weight & ballast'],['wear','wornDiameter','Tyre wear & clearance'],['gears','targetRollout','Gear finder'],['laps','trackLength','Lap speed'],['magnetic','magneticReadings','Magnetic downforce']]){
    const panel=document.querySelector('[data-analysis-panel="'+topic+'"]');
    panel.insertAdjacentHTML('afterbegin',`<div class="analysis-input-link"><span>${label} · inputs saved with this setup</span><button class="btn small" data-edit-inputs="${field}">${sfIcon('edit')}Edit these inputs</button></div>`);
  }
  const flow=document.querySelector('.drive-flow');
  flow.innerHTML=`<div data-category="motor"><div class="part-illustration" role="img" aria-label="Motor">${sfIcon('short-can-motor')}</div><span>Motor</span><strong id="flow-rpm"></strong></div><span class="flow-link">${sfIcon('next')}</span><div data-category="gearing"><div class="part-illustration gear-pair" role="img" aria-label="Pinion and driven gear">${sfIcon('motor-pinion')}${sfIcon('spur-gear')}</div><span>Gearing</span><strong id="flow-gearing"></strong></div><span class="flow-link">${sfIcon('next')}</span><div data-category="tyres"><div class="part-illustration" role="img" aria-label="Rear wheel and tyre">${sfIcon('wheel-tyre-set')}</div><span>Rear tyre</span><strong id="flow-tyre"></strong></div>`;
  for(const [id,name] of Object.entries({'new-setup':'plus','open-setup':'download','save-setup':'upload','save-copy':'plus','save-library':'check','library-import':'download','library-backup':'upload','analysis-edit':'edit','library-undo':'history'}))decorate('#'+id,name);
  decorate('.setup-panel h2','setup');decorate('.next-step h3','timer');decorate('.help-link','list');
  for(const button of document.querySelectorAll('[data-analysis-topic]')){
    const [tone,name]=topicStyle[button.dataset.analysisTopic];button.dataset.category=tone;button.insertAdjacentHTML('afterbegin',sfIcon(name));
  }
  for(const link of document.querySelectorAll('[data-analysis-mode]')){const mode=link.dataset.analysisMode;link.dataset.category=['compare','racecompare'].includes(mode)?'tyres':mode==='overview'?'gearing':mode==='records'?'speed':mode==='progress'?'weight':'motor';link.insertAdjacentHTML('afterbegin',sfIcon(['compare','racecompare'].includes(mode)?'transfer':mode==='records'?'list':mode==='progress'?'history':'timer'));}
  for(const link of document.querySelectorAll('.settings-nav a')){const help=link.hash.includes('calculations'),paddock=link.hash.includes('paddock');link.dataset.category=paddock?'weight':help?'motor':'tyres';link.insertAdjacentHTML('afterbegin',sfIcon(paddock?'transfer':help?'list':'palette'));}
  for(const panel of document.querySelectorAll('[data-analysis-panel]'))panel.dataset.category=topicStyle[panel.dataset.analysisPanel][0];
  document.querySelector('#settings-appearance').dataset.category='tyres';
  for(const button of document.querySelectorAll('[data-tone-choice]'))button.textContent=button.dataset.toneChoice==='light'?'Light':'Dark';
}
