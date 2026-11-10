const ChassisTestUI=(()=>{
  function init(){
    document.querySelector('[data-workshop-inputs=experiment]').insertAdjacentHTML('beforeend',`<section class="chassis-snapshot"><h3>Setup evidence for each run</h3><p class="hint">Choose the saved setup actually used for the run. Capture freezes its geometry, weighing method, ballast plan, drivetrain, workshop measurements and prediction context. Editing that library setup later cannot rewrite this evidence. Capture also applies when you append recorded laps above.</p><label class="field">Saved setup used<select id="chassis-test-setup"><option value="">Choose a saved setup</option></select></label><button class="btn small" id="chassis-test-refresh">Refresh saved setups</button><label class="field">Entered run to attach / replace<select id="chassis-test-row"><option value="">Choose an entered run</option></select></label><button class="btn small" id="chassis-test-capture">Capture / replace this run’s setup evidence</button><p id="chassis-test-status" class="hint" role="status"></p><p class="hint">If a run row is edited or moved, its old evidence is marked detached. Capture again deliberately to attach the correct setup. Planned ballast remains a plan: record in test conditions which changes were physically made.</p></section>`);
    document.querySelector('#chassis-test-refresh').onclick=()=>{readLibrary();refresh();};
    document.querySelector('#chassis-test-capture').onclick=()=>{
      try{
        const row=document.querySelector('#chassis-test-row').value;if(row==='')throw Error('Choose an entered run.');
        const next=captureInto(state.setup,Number(row),true);state.setup=next;window.refresh();persist();document.querySelector('#chassis-test-status').textContent='Setup evidence captured. Test conditions reset to unconfirmed; save this test setup to preserve it in the library.';
      }catch(e){document.querySelector('#chassis-test-status').textContent=e.message;}
    };
  }
  function refresh(){
    const select=document.querySelector('#chassis-test-setup');if(!select)return;
    const old=select.value;select.innerHTML='<option value="">Choose a saved setup</option>'+library.map(e=>`<option value="${esc(e.id)}">${esc(e.setup.name)}</option>`).join('');select.value=old;
    const row=document.querySelector('#chassis-test-row'),chosen=row.value,lines=(state.setup.experimentRows||'').split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
    row.innerHTML='<option value="">Choose an entered run</option>'+lines.map((l,i)=>`<option value="${i}">${i+1} · ${esc(l.split('|')[0])}</option>`).join('');row.value=chosen;
  }
  function captureInto(setup,row,required=false){
    const id=document.querySelector('#chassis-test-setup').value;if(!id&&!required)return setup;
    const entry=library.find(e=>e.id===id);if(!entry)throw Error('Choose the saved setup used for this run.');
    const r=WorkshopModel.calculate(setup,'experiment');if(r.error)throw Error(r.error);
    return {...setup,chassisRunSnapshots:ChassisTestModel.capture(setup,{row,entry,now:new Date().toISOString()}),experimentConfirmed:'no'};
  }
  function render(input){
    let rows;try{rows=ChassisTestModel.records(input.chassisRunSnapshots??'[]');}catch(e){return `<p class="note">${esc(e.message)}</p>`;}
    if(!rows.length)return '';
    return `<section class="chassis-snapshot"><h3>Captured chassis evidence</h3>${rows.map(r=>{const h=ChassisModel.calculate(r.setup),g=h.geometry,b=h.baseline,p=h.planned,attached=ChassisTestModel.attached(r,input.experimentRows);return `<details><summary>${esc(r.name)} · run ${r.row+1} · ${attached?'attached':'DETACHED: run row changed'}</summary><p>${esc(r.run.split('|')[0])} · captured ${esc(r.capturedAt)} · library ID ${esc(r.setupId)}</p><p>Method: ${esc(h.mode)} · ${esc(r.setup.chassisSupportReference)} support reference. Notes: ${esc(r.setup.chassisNotes||'Not recorded')}</p><p>Guide span ${performanceNumber(g?.length)} mm · rear centres ${performanceNumber(h.track)} mm · triangle ${performanceNumber(g?.angle)}°. Support span ${performanceNumber(h.span)} mm.</p><p>Measured total ${performanceNumber(b?.mass)} g · front share ${performanceNumber(b?.frontShare)}% · measured CG x/y ${performanceNumber(b?.x)} / ${performanceNumber(b?.y)} mm.</p><p>Planned total ${performanceNumber(p?.mass)} g · planned CG x/y ${performanceNumber(p?.x)} / ${performanceNumber(p?.y)} mm. ${h.changes.length} planned part changes. Snapshot inputs are preserved in setup exports.</p>${!attached?'<p class="note">This snapshot is historical only; it is not assigned to the edited run.</p>':''}</details>`;}).join('')}<p class="hint">These observations do not prove a geometry or balance change caused a lap-time difference.</p></section>`;
  }
  return {init,refresh,captureInto,render};
})();
