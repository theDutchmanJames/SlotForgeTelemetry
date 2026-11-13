// Compact inputs and a visual editor for the existing, persisted chassisChanges plan.
const WorkbenchUI=(()=>{
  const q=s=>document.querySelector(s),FOLD_KEY='slotforge.telemetry.folders.v1';
  let folders=[],selected=null,editorSpace='',endpoint='current',marking='',drag=null,suppressClick=false,lastRows='',setupIdentity=null,ready=false;
  const rawRows=()=>JSON.parse(state.setup.chassisChanges||'[]');
  const status=t=>q('#ballast-map-status').textContent=t;
  function init(){
    const nav=q('#setup-sections');nav.hidden=true;
    const column=q('.input-column');
    column.insertAdjacentHTML('afterbegin','<div class="workbench-folder-tools"><strong>Setup inputs</strong><button class="text-button" id="workbench-close">Close all</button></div>');
    let saved={};try{saved=JSON.parse(localStorage.getItem(FOLD_KEY)||'{}');}catch{/* Use defaults. */}
    for(const panel of [...column.children].filter(e=>e.matches('.panel'))){
      const heading=panel.querySelector('h2,h3');if(!heading)continue;
      const key=panel.matches('.workshop-inputs')?'workshop':panel.querySelector('[name]')?.name||panel.id;
      const details=document.createElement('details');details.className='workbench-folder';details.dataset.category=panel.dataset.category;details.dataset.folder=key;
      details.open=typeof saved?.[key]==='boolean'?saved[key]:key==='pinion';
      const summary=document.createElement('summary');summary.innerHTML=`<span class="folder-heading">${heading.innerHTML}</span><small class="folder-values"></small>`;
      panel.before(details);details.append(summary,panel);heading.classList.add('folder-original-heading');folders.push({details,key,summary});
      summary.addEventListener('click',()=>{if(!details.open)ResultFolders.forInput(summary,{scroll:true});});
      details.addEventListener('toggle',()=>{try{localStorage.setItem(FOLD_KEY,JSON.stringify(Object.fromEntries(folders.map(f=>[f.key,f.details.open]))));}catch{/* Folding works without storage. */}});
    }
    q('#workbench-close').onclick=()=>folders.forEach(f=>f.details.open=false);
    // Existing input shortcuts still work for help, analysis and keyboard navigation.
    q('[data-input-jump="workshop-tool"]').onclick=()=>{reveal(q('#workshop-tool'));q('#workshop-tool').focus();};
    const panel=document.createElement('section');panel.id='ballast-planner';panel.className='panel';panel.dataset.category='weight';
    panel.innerHTML=`<div class="section-heading"><div><p class="eyebrow">WEIGHT & BALANCE</p><h2>Place the weight. See the change.</h2></div><span class="badge">PLANNED CHANGES</span></div>
      <p class="hint">Click the chassis to place ballast, then drag the point to adjust it. Enter its weight and choose Add to plan. Existing points can be dragged too; choose Update part to keep the change.</p>
      <div class="actions ballast-tools"><button class="btn primary" id="ballast-new">${sfIcon('plus')}New part</button><button class="btn" id="ballast-references" aria-expanded="false">Set references</button><label class="ballast-guide-toggle"><input type="checkbox" id="ballast-guides" checked>Show guides</label></div>
      <div id="ballast-references-panel" hidden><h3>Match the drawing to your measurements</h3><p class="hint">This is a generic chassis. Its image does not measure your car. Enter your car’s guide span and rear contact-centre spacing, then adjust the drawing’s reference points if needed. Drawing references are saved with this setup.</p>
      <button class="btn small" id="ballast-measurements">Enter / review car dimensions</button><div class="form-grid"><label class="field">Reference to mark<select id="ballast-reference"><option value="guide">Guide pivot centre</option><option value="rear">Rear axle centreline</option><option value="right">Car-right rear contact centre</option><option value="left">Car-left rear contact centre</option></select></label><button class="btn" id="ballast-mark">Mark on drawing</button></div><p class="hint">Changing image references keeps your numeric part positions unchanged. Front stays on the left. Car-right is at the top of this view.</p></div>
      <p id="ballast-map-basis" class="hint"></p><div class="ballast-direction"><strong>← FRONT</strong><span>TOP VIEW · CAR’S RIGHT ↑</span><strong>REAR →</strong></div>
      <div id="ballast-stage"><img src="../assets/slotcar-chassis.svg" alt="Slot car chassis, front on the left. Use the position fields below as a keyboard alternative." draggable="false"><svg id="ballast-overlay" viewBox="0 0 687 376.4" aria-hidden="true"><g id="ballast-guide-lines"></g></svg><div id="ballast-markers"></div></div>
      <p class="hint" id="ballast-map-status" role="status">Click anywhere on the chassis to place a point. Only its weight needs typing.</p>
      <div class="actions" id="ballast-endpoints" hidden><span>Move part:</span><button class="btn small" data-ballast-endpoint="current" aria-pressed="true">Original position</button><button class="btn small" data-ballast-endpoint="new" aria-pressed="false">New position</button></div>
      <div id="ballast-editor-host"></div><p class="hint">A point marks the centre of the ballast. Without dimensions, its position is saved relative to the drawing; millimetres and support loads are not invented. Add measurements when you want calculated balance. Check space and clearance on the actual car.</p>
      <div id="ballast-list-host"></div><div id="ballast-live-loads" aria-live="polite"></div>`;
    q('#stats').after(panel);
    q('#ballast-editor-host').append(q('.chassis-editor'));q('#ballast-list-host').append(q('#chassis-parts'));
    for(const [id,label] of [['x','Behind front support · mm'],['y','Sideways · mm (+ right / − left)'],['toX','New distance behind front support · mm'],['toY','New sideways position · mm (+ right / − left)']])q('#chassis-part-'+id).parentElement.firstChild.textContent=label;
    const entry=q('.chassis-inputs');const title=[...entry.querySelectorAll('h3')].find(e=>e.textContent.includes('Ballast plan'));
    title.nextElementSibling.innerHTML='Place and edit parts on the chassis drawing. The plan is a separate scenario; it never changes the measured car weight.';
    title.insertAdjacentHTML('afterend','<button class="btn" id="ballast-open">Open visual ballast planner →</button>');
    q('#ballast-open').onclick=()=>ResultFolders.open('weight',{scroll:true});
    const editor=q('.chassis-editor'),mass=q('#chassis-part-mass').closest('label');
    const advanced=document.createElement('details');advanced.id='ballast-advanced';advanced.innerHTML='<summary>Name, action & precise position (optional)</summary>';
    const apply=q('#chassis-add-part'),editStatus=q('#chassis-edit-status');
    for(const node of [...editor.children])if(node!==apply&&node!==editStatus)advanced.append(node);
    editor.append(mass,apply,advanced,editStatus);
    q('#chassis-add-part').onclick=()=>{
      try{const rows=rawRows(),row=editorRow();if(selected===null)rows.push(row);else {if(!rows[selected])throw Error('Select a part again.');rows[selected]=row;}commit(rows);status('Ballast saved in the workspace. Select its numbered marker to edit it.');}catch(e){q('#chassis-edit-status').textContent=e.message;}
    };
    q('#chassis-parts').onclick=e=>{const edit=e.target.closest('[data-edit-ballast]'),remove=e.target.closest('[data-remove-chassis]');if(edit){select(Number(edit.dataset.editBallast));return;}if(remove){const rows=rawRows();const index=Number(remove.dataset.removeChassis);rows.splice(index,1);if(selected===index)resetEditor();else if(selected!==null&&selected>index)selected--;commit(rows);status('Part removed from the plan.');}};
    q('#ballast-new').onclick=()=>{resetEditor();render();q('#chassis-part-mass').focus();status('Click the chassis and enter the ballast weight, then choose Add to plan.');};
    q('#ballast-references').onclick=()=>{const el=q('#ballast-references-panel');el.hidden=!el.hidden;q('#ballast-references').setAttribute('aria-expanded',String(!el.hidden));marking='';};
    q('#ballast-measurements').onclick=()=>focusSetupInput('chassisGuideSpan');
    q('#ballast-mark').onclick=()=>{marking=q('#ballast-reference').value;status('Click to mark '+q('#ballast-reference').selectedOptions[0].text+'. Press Escape to cancel.');};
    q('#ballast-guides').onchange=render;
    q('#chassis-action').addEventListener('change',()=>{endpoint='current';render();});
    for(const b of document.querySelectorAll('[data-ballast-endpoint]'))b.onclick=()=>{endpoint=b.dataset.ballastEndpoint;render();};
    for(const el of q('.chassis-editor').querySelectorAll('input,select'))el.addEventListener('input',draw);
    const stage=q('#ballast-stage');
    stage.onclick=e=>{if(suppressClick){suppressClick=false;return;}if(e.target.closest('[data-ballast-draft]')&&!marking)return;const pin=e.target.closest('[data-ballast-pin]');if(pin&&!marking){select(Number(pin.dataset.ballastPin),pin.dataset.endpoint);q(`[data-ballast-pin="${selected}"][data-endpoint="${endpoint}"]`)?.focus({preventScroll:true});return;}place(e);};
    stage.onpointerdown=e=>{
      const pin=e.target.closest('[data-ballast-pin],[data-ballast-draft]');if(!pin||marking||e.button!==0)return;
      const rect=pin.getBoundingClientRect();
      if(!pin.hasAttribute('data-ballast-draft')&&(selected!==Number(pin.dataset.ballastPin)||endpoint!==pin.dataset.endpoint))select(Number(pin.dataset.ballastPin),pin.dataset.endpoint);
      const keys=endpoint==='new'?['toX','toY']:['x','y'];
      drag={pointer:e.pointerId,x:e.clientX,y:e.clientY,offsetX:e.clientX-rect.left-rect.width/2,offsetY:e.clientY-rect.top-rect.height/2,moved:false,keys,original:keys.map(k=>q('#chassis-part-'+k).value),space:editorSpace};
      stage.setPointerCapture(e.pointerId);
    };
    stage.onpointermove=e=>{
      if(!drag||drag.pointer!==e.pointerId)return;if(!drag.moved&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<4)return;
      drag.moved=true;stage.classList.add('dragging');place({clientX:e.clientX-drag.offsetX,clientY:e.clientY-drag.offsetY},false);
    };
    stage.onpointerup=()=>{if(!drag)return;suppressClick=drag.moved;if(drag.moved){status(selected===null?'Position adjusted. Enter the weight and choose Add to plan.':'Position adjusted. Choose Update part to keep it.');q('[data-ballast-draft]')?.focus({preventScroll:true});}drag=null;stage.classList.remove('dragging');};
    stage.onpointercancel=()=>{if(drag){drag.keys.forEach((k,i)=>q('#chassis-part-'+k).value=drag.original[i]);editorSpace=drag.space;draw();}drag=null;suppressClick=false;stage.classList.remove('dragging');};
    stage.onkeydown=e=>{if(e.key==='Escape'){marking='';status('Reference placement cancelled.');return;}const pin=e.target.closest('[data-ballast-pin],[data-ballast-draft]');if(!pin||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();if(!pin.hasAttribute('data-ballast-draft')&&(selected!==Number(pin.dataset.ballastPin)||endpoint!==pin.dataset.endpoint))select(Number(pin.dataset.ballastPin),pin.dataset.endpoint);const g=BallastMapModel.geometry(state.setup);if(!g.ready&&editorSpace!=='drawing')return;const prefix=endpoint==='new'?'to':'',x=q('#chassis-part-'+(prefix?'toX':'x')),y=q('#chassis-part-'+(prefix?'toY':'y')),n=e.shiftKey?2:.5;
      x.value=+x.value+(e.key==='ArrowRight'?n:e.key==='ArrowLeft'?-n:0);y.value=editorSpace==='drawing'||g.lateral?+y.value+(e.key==='ArrowUp'?n:e.key==='ArrowDown'?-n:0):0;draw();(q('[data-ballast-draft]')||q(`[data-ballast-pin="${selected}"][data-endpoint="${endpoint}"]`))?.focus({preventScroll:true});status(selected===null?'Position adjusted. Choose Add to plan to keep it.':'Position edited. Choose Update part to apply it.');};
    // Keep detailed result tables available without making the workbench a long report.
    for(const [id,label] of [['chassis-live','Chassis geometry & balance · detailed results'],['workshop-live','Testing & planning · live results']]){const el=q('#'+id),d=document.createElement('details');d.className='workbench-results';d.innerHTML='<summary>'+label+'</summary>';el.before(d);d.append(el);}
    q('#workshop-tool').addEventListener('change',()=>ResultFolders.open('workshop'));
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&marking){marking='';status('Reference placement cancelled.');}});
    ready=true;
  }
  function reveal(el){ResultFolders.forInput(el);for(let p=el?.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;}
  function resetEditor(){selected=null;editorSpace='';endpoint='current';for(const k of ['','-mass','-x','-toX'])q('#chassis-part'+k).value='';for(const k of ['y','toY'])q('#chassis-part-'+k).value='0';q('#chassis-action').value='add';q('#chassis-move-fields').hidden=true;q('#chassis-edit-status').textContent='';}
  function select(i,end='current'){const row=rawRows()[i];if(!row)return;selected=i;editorSpace=row.space||'';endpoint=end;for(const k of ['mass','x','y','toX','toY'])q('#chassis-part-'+k).value=row[k]===undefined?'':editorSpace==='drawing'&&k!=='mass'?+row[k]*100:row[k];q('#chassis-part').value=row.name;q('#chassis-action').value=row.action;q('#chassis-move-fields').hidden=row.action!=='move';q('#chassis-edit-status').textContent='';render();}
  function editorRow(){
    if(!q('#chassis-part').value.trim())q('#chassis-part').value='Ballast '+(selected===null?rawRows().length+1:selected+1);
    if(!q('#chassis-part-mass').value)throw Error('Enter the ballast weight in grams.');
    if(!q('#chassis-part-x').value)throw Error('Click the chassis to choose a position.');
    const row={name:q('#chassis-part').value,action:q('#chassis-action').value};
    for(const k of ['mass','x','y',...(row.action==='move'?['toX','toY']:[])]){const value=q('#chassis-part-'+k).value;row[k]=editorSpace==='drawing'&&k!=='mass'&&value!==''?String(Number(value)/100):value;}
    if(editorSpace==='drawing')row.space='drawing';ChassisModel.changes(JSON.stringify([row]));return row;
  }
  function commit(rows){const raw=JSON.stringify(rows);ChassisModel.clean({...state.setup,chassisChanges:raw});state.setup.chassisChanges=raw;lastRows=raw;refresh();persist();}
  function place(event,announce=true){
    const box=q('#ballast-stage').getBoundingClientRect(),px=(event.clientX-box.left)/box.width*687,py=(event.clientY-box.top)/box.height*376.4;
    if(px<0||px>687||py<0||py>376.4)return;
    try{
      if(marking){const r=ChassisModel.mapReferences(state.setup.chassisMap);if(marking==='guide'){r.guide=px;r.centre=py;}else r[marking]=marking==='rear'?px:py;const raw=JSON.stringify(r);ChassisModel.mapReferences(raw);state.setup.chassisMap=raw;marking='';refresh();persist();status('Drawing reference saved. Numeric part positions are unchanged.');return;}
      const g=BallastMapModel.geometry(state.setup);
      if(!g.ready&&editorSpace!=='drawing'&&q('#chassis-action').value==='move'&&q('#chassis-part-x').value!==''){status('This move uses millimetres. Restore its dimensions, or start a new drawing placement.');return;}
      if(!g.ready||(!g.lateral&&q('#chassis-action').value!=='move'))editorSpace='drawing';
      const relative=editorSpace==='drawing',p=relative?BallastMapModel.drawingPosition(BallastMapModel.drawing(state.setup),px,py):BallastMapModel.position(g,px,py);
      q('#chassis-part-'+(endpoint==='new'?'toX':'x')).value=relative?+(p.x*100).toFixed(4):p.x;
      q('#chassis-part-'+(endpoint==='new'?'toY':'y')).value=relative?+(p.y*100).toFixed(4):p.y;
      if(!q('#chassis-part').value.trim()||(selected===null&&/^Ballast \d+$/.test(q('#chassis-part').value)))q('#chassis-part').value='Ballast '+(selected===null?rawRows().length+1:selected+1);
      draw();
      if(announce)status(relative?'Position chosen on the drawing. Enter its weight, then apply. Dimensions are optional until you want millimetres and calculated loads.':p.x+' mm behind '+g.reference+'; '+Math.abs(p.y)+' mm '+(p.y>0?'car-right':p.y<0?'car-left':'from centreline')+'. Enter its weight, then apply.');
    }catch(e){status(e.message);}
  }
  function draw(){
    if(!ready)return;const g=BallastMapModel.geometry(state.setup),lines=q('#ballast-guide-lines'),markers=q('#ballast-markers');lines.replaceChildren();markers.replaceChildren();
    q('#ballast-map-basis').textContent=g.ready?`Using your dimensions: guide span ${performanceNumber(g.length)} mm · rear centres ${performanceNumber(g.track)} mm. Position zero: ${g.reference}.${g.lateral?'':' Two-support mode calculates front/rear loads only.'} Only applied parts contribute to the results below.`:'Click to place ballast now. Add car dimensions later for millimetres and support-load calculations.';
    const drawing=BallastMapModel.drawing(state.setup);
    for(const [id,label] of [['x',editorSpace==='drawing'?'Position along guide span · %':'Behind front support · mm'],['y',editorSpace==='drawing'?'Towards rear contact · % (+ right / − left)':'Sideways · mm (+ right / − left)'],['toX',editorSpace==='drawing'?'New position along guide span · %':'New distance behind front support · mm'],['toY',editorSpace==='drawing'?'New sideways position · % (+ right / − left)':'New sideways position · mm (+ right / − left)']])q('#chassis-part-'+id).parentElement.firstChild.textContent=label;
    if(g.ready&&q('#ballast-guides').checked){const r=g.refs,front=BallastMapModel.pixel(g,0,0);lines.innerHTML=`<polygon points="${front.x},${r.centre} ${r.rear},${r.right} ${r.rear},${r.left}"/><line x1="${front.x}" y1="${r.centre}" x2="${r.rear}" y2="${r.centre}"/><line x1="${r.rear}" y1="${r.right}" x2="${r.rear}" y2="${r.left}"/>${[[r.guide,r.centre],[r.rear,r.right],[r.rear,r.left]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="5"/>`).join('')}`;}
    const rows=rawRows();
    const marker=(x,y,i,end,caption,draft=false,space='')=>{if(!Number.isFinite(+x)||!Number.isFinite(+y)||x===''||y==='')return;if(!g.ready&&space!=='drawing')return;const p=BallastMapModel.pixel(space==='drawing'?drawing:g,+x,+y);if(p.x<0||p.x>687||p.y<0||p.y>376.4)return;const b=document.createElement('button');b.className='ballast-pin'+(draft?' draft':'');b.textContent=caption;b.style.left=p.x/687*100+'%';b.style.top=p.y/376.4*100+'%';b.type='button';if(draft){b.dataset.ballastDraft='';b.setAttribute('aria-label','Ballast position being edited. Drag to reposition, or use arrow keys.');}else{b.dataset.ballastPin=i;b.dataset.endpoint=end;b.setAttribute('aria-pressed',String(i===selected&&end===endpoint));b.setAttribute('aria-label',`${rows[i].name}, ${end==='new'?'new':'original'} position. Select or drag; arrow keys adjust position.`);}markers.append(b);};
    rows.forEach((r,i)=>{marker(r.x,r.y,i,'current',String(i+1),false,r.space);if(r.action==='move')marker(r.toX,r.toY,i,'new',(i+1)+'→',false,r.space);});
    const prefix=endpoint==='new'?'to':'',x=q('#chassis-part-'+(prefix?'toX':'x')).value,y=q('#chassis-part-'+(prefix?'toY':'y')).value;
    const scale=editorSpace==='drawing'?100:1;
    const samePosition=rows.some((r,i)=>(r.space||'')===editorSpace&&(selected===null||selected===i)&&+r[endpoint==='new'?'toX':'x']===+x/scale&&+r[endpoint==='new'?'toY':'y']===+y/scale);
    if(!samePosition&&x!==''&&y!=='')marker(+x/scale,+y/scale,-1,endpoint,'+',true,editorSpace);
  }
  function render(){
    if(!ready)return;
    if(setupIdentity!==state.setup){resetEditor();setupIdentity=state.setup;marking='';}
    if(lastRows!==state.setup.chassisChanges){selected=null;endpoint='current';lastRows=state.setup.chassisChanges;}
    const s=calculationInput(),m=PerformanceModel.calculate(s),r=ChassisModel.calculate(s),fmt=(v,u='')=>v===null||v===undefined?'Not entered':performanceNumber(v)+' '+u;
    const summaries={pinion:fmt(m.ratio,':1'),ratedRpm:fmt(m.ratedRpm,'RPM'),tyreMode:fmt(m.rearDiameter,'mm fitted'),totalWeight:fmt(TelemetryModel.calculate(s).massG,'g current'),chassisGuideSpan:r.geometry?`${fmt(r.geometry.length,'mm span')} · ${fmt(r.track,'mm contacts')}`:'Dimensions optional',targetRollout:fmt(TelemetryModel.calculate(s).targetRollout,'mm/rev target'),trackLength:fmt(TelemetryModel.calculate(s).lapSpeed,'km/h measured'),magneticReadings:s.magneticReadings?.trim()?'Force readings entered':'Not measured',workshop:q('#workshop-tool').selectedOptions[0].text};
    for(const f of folders)f.summary.querySelector('.folder-values').textContent=summaries[f.key]??'Optional measurements';
    q('#chassis-add-part').textContent=selected===null?'Add to plan':'Update part';q('#ballast-endpoints').hidden=q('#chassis-action').value!=='move';
    for(const b of document.querySelectorAll('[data-ballast-endpoint]'))b.setAttribute('aria-pressed',String(b.dataset.ballastEndpoint===endpoint));
    for(const [i,row] of [...q('#chassis-parts').querySelectorAll('tbody tr')].entries()){if(!row.querySelector('[data-edit-ballast]')){row.firstElementChild.prepend(document.createTextNode((i+1)+'. '));const b=document.createElement('button');b.className='btn small';b.dataset.editBallast=i;b.textContent='Edit';b.setAttribute('aria-label','Edit part '+(i+1));row.lastElementChild.prepend(b);}}
    const b=r.baseline,p=r.error?null:r.planned;
    q('#ballast-live-loads').innerHTML=`<h3>Static support loads · measured / planned</h3>${r.error?`<p class="note">${esc(r.error)}</p>`:''}${b?`<p class="hint">Measured total ${fmt(b.mass,'g')} · planned total ${fmt(p?.mass,'g')}. Main car weight is unchanged.</p><div class="ballast-load-grid">${b.loads.map((v,i)=>{const label=r.mode==='tripod'?['Guide','Rear · car left','Rear · car right'][i]:[r.mode==='axle'?'Front axle':'Guide','Rear axle'][i];return `<div><span>${label}</span><strong>${fmt(v,'g')} / ${fmt(p?.loads[i],'g')}</strong><small>${fmt(v/b.mass*100,'%')} / ${fmt(p?p.loads[i]/p.mass*100:null,'%')}</small></div>`;}).join('')}</div>`:'<p class="hint">Positions can be recorded before weighing. To calculate support loads, select your weighing method, enter its readings and confirm level, non-magnetic conditions in Chassis geometry & balance. No sample readings are used.</p>'}<p class="hint">Static balance only. This does not predict grip, cornering speed or CG height.</p>`;
    draw();
  }
  return {init,refresh:render,reveal};
})();
