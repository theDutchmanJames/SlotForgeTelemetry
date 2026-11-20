// SlotForge Rework (Paired Rows): below the setup bar, one row per topic with what you enter on the left and what it does
// on the right. The input folders and the live result groups are moved, not recreated, so ids, handlers and calculations
// stay as they were; a result group opens and closes with its input folder. Each row shows what changed since you saved.
const WorkbenchPairs=(()=>{
  const q=s=>document.querySelector(s);
  // Input folder → the result groups that show what it does.
  const PAIRS={pinion:['performance'],ratedRpm:['drivetrain'],tyreMode:['tyres'],totalWeight:['weight'],magneticReadings:['magnetic'],targetRollout:['gears'],trackLength:['laps'],workshop:['workshop']};
  // Results that belong to a row in "since saved".
  const SINCE={totalWeight:['massG','powerToWeight','pullPerKg','chassisAngle','chassisRatio','chassisTrack','chassisGuideSpan','chassisFrontShare','chassisRearLeft','chassisCgX','chassisCgY','chassisPlanMass'],pinion:['ratio','speedKmh','rollout','forceN'],ratedRpm:['speedKmh','forceN','peakPowerW','powerToWeight','pullPerKg'],magneticReadings:['magneticMean','magneticPercent'],trackLength:['lapSpeed']};
  const rows=new Map();let ready=false;
  function init(){
    const layout=q('.calculator-layout'),column=q('.input-column');if(!layout||!column)return;
    const box=document.createElement('div');box.className='wb-pairs';box.id='workbench-pairs';
    const tools=column.querySelector('.workbench-folder-tools');if(tools)box.append(tools);
    // Chassis geometry shares the weight row: its results (balance, the ballast planner) are part of Weight & balance.
    const JOIN={chassisGuideSpan:'totalWeight'};
    for(const folder of [...column.querySelectorAll(':scope>.workbench-folder')]){
      const key=folder.dataset.folder;
      if(JOIN[key]&&rows.has(JOIN[key])){const r=rows.get(JOIN[key]);r.row.querySelector('.wb-in').append(folder);r.folders.push(folder);folder.addEventListener('toggle',()=>{follow();if(folder.open)ResultFolders.refresh(calculationInput());});continue;}
      const results=(PAIRS[key]||[]).map(k=>q(`[data-result-group="${k}"]`)).filter(Boolean);
      const row=document.createElement('section');row.className='wb-pair';row.dataset.pair=key;row.dataset.category=folder.dataset.category||'';
      const left=document.createElement('div');left.className='wb-in';left.append(folder);
      const right=document.createElement('div');right.className='wb-out';right.innerHTML='<div class="wb-out-head"><span class="wb-out-title">What it does</span><span class="wb-since" data-since></span></div>';
      for(const r of results)right.append(r);
            row.append(left,right);box.append(row);rows.set(key,{row,folder,folders:[folder],results});
      folder.addEventListener('toggle',()=>{follow();if(folder.open)ResultFolders.refresh(calculationInput());});
    }
    // Anything left in the results column without an input of its own (none today) stays reachable below the rows.
    const rest=[...q('#stats').querySelectorAll(':scope>[data-result-group]')];
    if(rest.length){const extra=document.createElement('section');extra.className='wb-pair wb-extra';extra.innerHTML='<div class="wb-out" style="grid-column:1/-1"></div>';rest.forEach(r=>extra.firstChild.append(r));box.append(extra);}
    // What to do next, with your own data, instead of the advert cards.
    box.insertAdjacentHTML('beforeend','<div class="wb-next" id="workbench-next" aria-live="polite"></div>');
    const help=q('.results-column .help-link');if(help)box.append(help);
    layout.before(box);layout.hidden=true;
    for(const el of ['.next-step','.df-entry','.note.assumptions'])q(el)?.setAttribute('hidden','');
    ResultFolders.follow(key=>{for(const {folders,results} of rows.values())if(results.some(r=>r.dataset.resultGroup===key))return folders.some(f=>f.open);return false;},key=>{for(const {folder,folders,results} of rows.values())if(results.some(r=>r.dataset.resultGroup===key)){const open=folders.some(f=>f.open);if(open)folders.forEach(f=>f.open=false);else folder.open=true;return;}});
    ready=true;sync();refresh();
  }
  // Rows follow the view tabs: a row shows when its input folder shows.
  function sync(){if(!ready)return;for(const {row,folders} of rows.values())row.hidden=folders.every(f=>f.hidden);follow();}
  function follow(){ResultFolders.syncFollow?.();}
  const savedEntry=()=>typeof library!=='undefined'?library.find(e=>e.id===activeLibraryId)||null:null;
  const value=(n,r)=>Number.isFinite(n)?unitValue(n,r.unit,r.digits)+(r.unit===':1'?':1':' '+Units.label(r.unit)):'—';
  function refresh(){
    if(!ready)return;
    const saved=savedEntry();let list=[];
    try{list=saved?ChangeSheetModel.rows(saved.setup,CalculatorModel.cleanSetup(state.setup)):[];}catch{list=[];}
    for(const [key,{row}] of rows){
      const moved=list.filter(r=>r.moved&&(SINCE[key]||[]).includes(r.key)),box=row.querySelector('[data-since]');
      box.innerHTML=moved.length?'<span class="wb-since-label">since saved</span>'+moved.map(r=>`<span class="wb-delta ${r.tone}" title="${esc(r.label)}: ${esc(value(r.a,r))} when saved">${esc(r.label.replace(/ \(.*\)$/,''))} <b>${esc(value(r.b,r))}</b> <i>${r.delta>0?'+':'−'}${esc(unitValue(Math.abs(r.delta),r.unit,r.digits))}</i></span>`).join(''):'';
      row.classList.toggle('wb-changed',moved.length>0);
    }
    next(saved,list);
  }
  function next(saved,list){
    const box=q('#workbench-next');if(!box)return;
    const changed=list.filter(r=>r.moved);let compare;
    if(saved&&changed.length){const v=ChangeSheetModel.verdict({rows:list,changes:[]});compare=`<b>Compare with what you saved</b><span>${v.parts.length?`Against ${esc(saved.setup.name)}, the workbench is ${v.parts.slice(0,2).map(p=>esc(p.key==='massG'?unitText(p.grams,'g',1)+' '+p.text:p.text)).join(' and ')}.`:`${changed.length} result${changed.length===1?'':'s'} moved since ${esc(saved.setup.name)}.`}</span><button type="button" class="text-button" data-next="compare">Open in Setups</button>`;}
    else if(saved)compare=`<b>Saved as ${esc(saved.setup.name)}</b><span>Change something to see what it does against it, here and in Setups.</span><button type="button" class="text-button" data-next="setups">Open in Setups</button>`;
    else compare='<b>Save to compare later</b><span>A saved setup lets you see what each change does, here and in Setups.</span><button type="button" class="text-button" data-next="save">Save setup</button>';
    box.innerHTML=`<div>${compare}</div><div><b>Drive it</b><span>Take this setup to Track day for the next run and see the verdict there.</span><button type="button" class="text-button" data-next="trackday">Track day</button></div><div><b>Something feels off?</b><span>Pick what the car does; get checks and one thing to try.</span><button type="button" class="text-button" data-next="feedback">Driver Feedback</button></div>`;
    box.onclick=e=>{const b=e.target.closest('[data-next]');if(!b)return;const a=b.dataset.next;
      if(a==='compare'){const s=savedEntry();if(s)SetupsUI.compareSet([s.id,'workbench']);}
      else if(a==='setups'){const s=savedEntry();if(s)showSavedAnalysis(s.id);else navigate('analyze');}
      else if(a==='save')q('#save-library').click();
      else navigate(a);};
  }
  return {init,sync,refresh};
})();
