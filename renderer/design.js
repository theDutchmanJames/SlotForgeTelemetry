// Shared presentation only; calculation and saved-setup behaviour live elsewhere.
// SlotForge Restyle (Pit Wall): the main menu is one slim bar. The six tabs sit in three groups on a dark track, the
// connection and save status are small lights on the right, and the bar under it only appears for an update notice.
function pitWall(){
  const nav=document.querySelector('.main-nav'),header=document.querySelector('.app-header'),bar=document.querySelector('.workspace-bar');
  const link=route=>nav.querySelector(`[data-route="${route}"]`);
  const groups=[['Build','telemetry','trackday'],['Understand','analyze','feedback'],['Keep','library','settings']].map(([label,...routes])=>{
    const group=document.createElement('div');group.className='nav-group';group.setAttribute('role','group');group.setAttribute('aria-label',label);
    for(const route of routes){const a=link(route);if(!a)continue;group.append(a);
      for(const node of [...a.childNodes])if(node.nodeType===3&&node.textContent.trim()){const word=document.createElement('span');word.className='nav-word';word.textContent=node.textContent.trim();node.replaceWith(word);a.title=word.textContent;}}
    return group;
  });
  const rest=[...nav.children].filter(el=>!el.classList.contains('nav-group'));nav.replaceChildren(...groups.filter(g=>g.children.length),...rest);
  const lights=document.createElement('div');lights.className='status-lights';
  for(const id of ['paddock-global-status','save-state']){const el=document.getElementById(id);if(!el)continue;lights.append(el);
    const tip=()=>{el.title=el.textContent.trim();};tip();new MutationObserver(tip).observe(el,{childList:true,characterData:true,subtree:true});}
  header.querySelector('.theme-switch').before(lights);
  bar?.classList.add('pit-strip');
}
function initializeDesign(){
  const homeHead=document.querySelector('[data-page=telemetry] .page-head'),setupPanel=document.querySelector('.setup-panel');
  homeHead.classList.add('workbench-toolbar');homeHead.firstElementChild.replaceChildren(setupPanel);
  // SlotForge Restyle (Pit Board): the name reads as an editable title, the car sits under it, the saved state
  // top right, and one row of tools below with Save as the one main action. Elements move, so ids and handlers stay.
  const tools=homeHead.querySelector('.actions'),saved=document.querySelector('#library-workspace-status'),name=document.querySelector('#name');
  const nameField=name.closest('label'),carField=document.querySelector('.garage-car-field'),example=document.querySelector('#load-example');
  setupPanel.querySelector('.section-heading').classList.add('sr-only');
  nameField.classList.add('setup-name-field');const edit=document.createElement('span');edit.className='setup-name-edit';name.replaceWith(edit);edit.append(name);
  edit.insertAdjacentHTML('beforeend',sfIcon('edit'));name.placeholder='Name this setup';
  if(saved){saved.classList.add('save-state');setupPanel.prepend(saved);}
  if(carField){
    const row=document.createElement('div');row.className='setup-car-row';carField.replaceWith(row);row.append(carField);
    const hint=carField.querySelector('small');if(hint)hint.remove();
    row.insertAdjacentHTML('beforeend','<a class="text-button setup-car-link" href="#library/garage" title="Paddock cars and cars added in Library → Garage">Manage cars</a>');
  }
  if(tools){
    example.className='btn ghost';
    const left=document.createElement('div'),right=document.createElement('div');left.className='pit-tools';right.className='pit-save';
    for(const id of ['new-setup','load-example','open-setup','save-setup','setup-sheet'])left.append(document.getElementById(id));
    for(const id of ['save-copy','save-library'])right.append(document.getElementById(id));
    tools.classList.add('pit-actions');tools.replaceChildren(left,right);
  }
  for(const id of ['new-setup','open-setup','save-setup','setup-sheet'])document.getElementById(id)?.classList.add('ghost');
  const decorate=(selector,name)=>{for(const el of document.querySelectorAll(selector))el.insertAdjacentHTML('afterbegin',sfIcon(name));};
  document.querySelector('.brand-mark').innerHTML='<img src="../assets/icon.svg" alt="" width="42" height="42">';
  for(const [route,name] of Object.entries({telemetry:'setup',trackday:'history',analyze:'timer',feedback:'list',library:'library',settings:'settings'})){
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
  for(const [id,name] of Object.entries({'new-setup':'plus','open-setup':'download','save-setup':'upload','setup-sheet':'list','save-copy':'plus','save-library':'check','library-import':'download','library-backup':'upload','analysis-edit':'edit','library-undo':'history','load-example':'car'}))decorate('#'+id,name);
  decorate('.setup-panel h2','setup');decorate('.next-step h3','timer');decorate('.help-link','list');
  for(const button of document.querySelectorAll('[data-analysis-topic]')){
    const [tone,name]=topicStyle[button.dataset.analysisTopic];button.dataset.category=tone;button.insertAdjacentHTML('afterbegin',sfIcon(name));
  }
  for(const link of document.querySelectorAll('[data-analysis-mode]')){const mode=link.dataset.analysisMode;link.dataset.category=['compare','racecompare'].includes(mode)?'tyres':mode==='overview'?'gearing':mode==='records'?'speed':mode==='progress'?'weight':'motor';link.insertAdjacentHTML('afterbegin',sfIcon(['compare','racecompare'].includes(mode)?'transfer':mode==='records'?'list':mode==='progress'?'history':'timer'));}
  pitWall();
  for(const link of document.querySelectorAll('.settings-nav a')){const help=link.hash.includes('calculations'),paddock=link.hash.includes('paddock'),backups=link.hash.includes('backups'),updates=link.hash.includes('updates');link.dataset.category=paddock?'weight':help?'motor':backups?'speed':updates?'gearing':'tyres';link.insertAdjacentHTML('afterbegin',sfIcon(paddock?'transfer':help?'list':backups?'history':updates?'download':'palette'));}
  for(const panel of document.querySelectorAll('[data-analysis-panel]'))panel.dataset.category=topicStyle[panel.dataset.analysisPanel][0];
  document.querySelector('#settings-appearance').dataset.category='tyres';
  for(const button of document.querySelectorAll('[data-tone-choice]'))button.textContent=button.dataset.toneChoice==='light'?'Light':'Dark';
}
