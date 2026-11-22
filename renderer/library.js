// Explicit saves are separate from the automatically saved workbench draft.
const LIBRARY_KEY='slotforge.telemetry.library.v1',ACTIVE_KEY='slotforge.telemetry.library.active.v1';
let library=[],libraryRaw=null,libraryError='',activeLibraryId=null,libraryTask=null,deletedEntry=null,libraryDecoded=undefined;
// Pages re-read the stored library on every visit (another window may have changed it), but only decode
// and validate it again when its text changed. Entries are never edited in place, so the decoded list can be reused.
function readLibrary() {
  libraryRaw=null;
  try {libraryRaw=DataStore.getItem(LIBRARY_KEY);if(libraryRaw!==libraryDecoded){library=libraryRaw===null?[]:LibraryModel.decode(libraryRaw);libraryDecoded=libraryRaw;}libraryError='';}
  catch {library=[];libraryDecoded=undefined;libraryError='The library could not be read. Its stored data has been left untouched. Export the unreadable data for safekeeping, then restore a valid library backup.';}
}
function bindLibrary(id) {
  activeLibraryId=id;
  try {if(id)DataStore.setItem(ACTIVE_KEY,id);else DataStore.removeItem(ACTIVE_KEY);}catch {/* Library saving reports storage errors separately. */}
  updateLibraryStatus();
}
function updateLibraryStatus() {
  const item=library.find(e=>e.id===activeLibraryId);
  if(!item&&!libraryError)activeLibraryId=null;
  let changed=false;
  if(item)try{changed=JSON.stringify(CalculatorModel.cleanSetup(state.setup))!==JSON.stringify(item.setup);}catch{changed=true;}
  $('#library-workspace-status').textContent=libraryError?'Library unavailable':item?`${item.setup.name} · ${changed?'unsaved library changes':'saved in library'}`:'Workbench draft · not linked to a library setup';
  $('#library-workspace-status').dataset.saveStatus=libraryError?'error':item&&!changed?'saved':'draft';
  $('#library-count').textContent=library.length;if(typeof WorkbenchPairs!=='undefined')WorkbenchPairs.refresh();
  for(const id of ['save-library','save-copy'])$('#'+id).disabled=!!libraryError||!$('#input-error').hidden;
}
function commitLibrary(next,{recover=false}={}) {
  if(libraryError&&!recover)throw Error(libraryError);
  if(DataStore.getItem(LIBRARY_KEY)!==libraryRaw){readLibrary();renderLibrary();throw Error('The library changed in another window. Review it and try again.');}
  const text=LibraryModel.encode(next);
  DataStore.setItem(LIBRARY_KEY,text); // Commit before updating memory or reporting success.
  library=next;libraryRaw=text;libraryDecoded=undefined;libraryError='';renderLibrary();updateLibraryStatus();
}
function libraryFailure(error) {return ['QuotaExceededError','SecurityError','DataFileError'].includes(error.name)?'Could not save the library on this device. Your saved entries are unchanged; export your setup as a file.':error.message;}
function libraryNotice(message) {$('#library-message').textContent=message;}
// SlotForge Remake (Setup Binder): every setup in one list, a section per car, with gearing, tyre, weight, top speed and
// the best lap driven with this gearing. Tick several for one action bar; the selected setup is a spec card.
let binderFilter='all';const binderTicks=new Set();
const binderCars=()=>typeof GarageUI!=='undefined'?GarageUI.cars():[];
const binderRuns=()=>typeof RaceUI!=='undefined'?RaceUI.runs():[];
// The run index only changes when the runs do (a new list after each import or save).
let binderIndexOf=null,binderIndex=null;const binderRunIndex=()=>{const runs=binderRuns();if(runs!==binderIndexOf){binderIndexOf=runs;binderIndex=BinderModel.index(runs);}return binderIndex;};
function binderDriven(entry,index=binderRunIndex(),cars=binderCars()){const car=cars.find(c=>c.ref===entry.setup.carRef);return car?BinderModel.lookup(index,entry.setup,car.name):null;}
function binderDownload(entry){const text=CalculatorModel.encode(entry.setup,null),url=URL.createObjectURL(new Blob([text],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=(entry.setup.name.replace(/[^a-z0-9_-]+/gi,'-').slice(0,70)||'setup')+'.slotforge-calculator.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
function binderCarArt(car,cls=''){return `<span class="binder-art ${cls}${car?.source==='paddock'?' paddock':''}">${car?sfIcon('car'):'?'}</span>`;}
// Saved entries are never edited in place (a save makes a new object), so their figures can be kept per entry.
const binderCalc=new WeakMap(),binderFigures=item=>{let m=binderCalc.get(item);if(!m){m=TelemetryModel.calculate(CalculatorModel.inputOf(item.setup));binderCalc.set(item,m);}return m;};
function renderLibraryTable(entries){
  const runIndex=binderRunIndex(),allCars=binderCars(),driven=new Map(library.map(e=>[e.id,binderDriven(e,runIndex,allCars)]));
  const shown=BinderModel.filter(entries,binderFilter,e=>!!driven.get(e.id));
  for(const id of [...binderTicks])if(!library.some(e=>e.id===id))binderTicks.delete(id);
  if(!shown.some(e=>e.id===selectedLibraryId))selectedLibraryId=shown[0]?.id||null;
  for(const b of document.querySelectorAll('[data-binder-filter]'))b.setAttribute('aria-pressed',String(b.dataset.binderFilter===binderFilter));
  const searching=!!$('#library-search').value.trim()||binderFilter!=='all',groups=BinderModel.groups(shown,searching?[]:binderCars());
  const row=item=>{const s=item.setup,m=binderFigures(item),d=driven.get(item.id),on=item.id===selectedLibraryId,ticked=binderTicks.has(item.id);
    return `<div class="binder-row${on?' selected':''}" role="row"><button class="binder-tick" data-library-action="tick" data-library-id="${item.id}" role="checkbox" aria-checked="${ticked}" aria-label="Tick ${esc(s.name)}"></button><button class="select-setup binder-name" data-library-action="select" data-library-id="${item.id}" aria-pressed="${on}"><b>${esc(s.name)}${item.id===activeLibraryId?'<span class="binder-pill">workbench</span>':''}</b><small>${esc(new Date(item.updatedAt).toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'}))}${item.notes?' · '+esc(item.notes.split('\n')[0].slice(0,60)):''}</small></button><span class="binder-num">${esc(s.pinion||'—')}/${esc(s.gear||'—')}</span><span class="binder-num">${unitText(m.motor.rearDiameter,'mm')}</span><span class="binder-num">${unitText(m.massG,'g',1)}</span><span class="binder-num">${unitValue(m.motor.speedKmh,'km/h')}</span><span class="binder-num${d?'':' quiet'}" title="${d?`Best lap with ${esc(s.pinion)}/${esc(s.gear)}: ${esc(d.run.track)} lane ${d.run.lane}`:'Not driven with this gearing yet'}">${d?.ms?(d.ms/1000).toFixed(3):'—'}</span><button class="binder-star" data-library-action="star" data-library-id="${item.id}" aria-pressed="${!!item.favourite}" aria-label="${item.favourite?'Remove from':'Add to'} favourites">${item.favourite?'★':'☆'}</button></div>`;};
  $('#library-list').innerHTML=shown.length||(!searching&&binderCars().length)?`<div class="panel binder" role="table" aria-label="Your setups"><div class="binder-row binder-head" role="row"><span></span><span>Setup</span><span>Gearing</span><span>Tyre</span><span>Weight</span><span>Top speed · ${esc(Units.label('km/h'))}</span><span>Best lap</span><span></span></div>${groups.map(g=>`<div class="binder-group">${binderCarArt(g.car)}<b>${esc(g.car?.name||'Without a car')}</b><small>${esc([g.car?.maker,g.car?.source==='paddock'?'Paddock':''].filter(Boolean).join(' · '))}${g.car?.maker||g.car?.source==='paddock'?' · ':''}${g.entries.length?g.entries.length+' setup'+(g.entries.length===1?'':'s'):'no setups yet'}</small>${g.car?`<button class="btn small ghost" data-binder-new="${esc(g.car.ref)}">New setup</button>`:''}</div>${g.entries.map(row).join('')}`).join('')}</div>`:`<div class="library-empty"><h3>${library.length?'No matching setups':'Your setup library starts here.'}</h3><p>${library.length?(binderFilter==='favourites'?'Star a setup to keep it here.':binderFilter==='driven'?'Setups appear here once a run is driven with their car and gearing.':'Try another name or a word from your notes.'):'Save a setup from Telemetry to keep its inputs together.'}</p></div>`;
  // The action bar for ticked setups.
  const ticked=library.filter(e=>binderTicks.has(e.id)),bar=$('#binder-actions');bar.hidden=!ticked.length;
  bar.innerHTML=ticked.length?`<b>${ticked.length} ticked</b><span>${esc(ticked.map(e=>e.setup.name).join(', '))}</span><button class="btn small" id="binder-compare"${ticked.length<2?' disabled title="Tick two or three setups"':ticked.length>3?' disabled title="Compare up to three at once"':''}>Compare</button><button class="btn small" id="binder-export">Export files</button><button class="btn small" id="binder-delete"${libraryError?' disabled':''}>Delete</button><button class="btn small ghost" id="binder-clear">Clear</button>`:'';
  const item=library.find(e=>e.id===selectedLibraryId);$('#library-detail').hidden=!item;
  if(!item)return;
  const m=TelemetryModel.calculate(CalculatorModel.inputOf(item.setup)),car=binderCars().find(c=>c.ref===item.setup.carRef),d=driven.get(item.id);
  $('#library-detail').innerHTML=`${binderCarArt(car,'binder-hero')}<p class="eyebrow">${esc(car?car.name:'WITHOUT A CAR')}</p><h2 class="library-detail-title">${esc(item.setup.name)}</h2><p class="library-date">Saved ${esc(new Date(item.updatedAt).toLocaleString())}${item.id===activeLibraryId?' · on the workbench now':''}</p><dl class="detail-metrics binder-spec">${[['Gearing',`${esc(item.setup.pinion||'—')} / ${esc(item.setup.gear||'—')}`],['Ratio',unitText(m.motor.ratio,':1',3)],['Top speed',unitText(m.motor.speedKmh,'km/h')],['Weight',unitText(m.massG,'g',1)],['Power / weight',unitText(m.powerToWeight,'W/kg')],['Rear tyre',unitText(m.motor.rearDiameter,'mm')]].map(([label,value])=>`<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')}</dl><p class="binder-usage">${d?`Driven: best <b>${(d.ms/1000).toFixed(3)} s</b> on ${esc(d.run.track)} lane ${d.run.lane}, ${d.count} run${d.count===1?'':'s'} with ${esc(item.setup.pinion)}/${esc(item.setup.gear)}.`:car?`Not driven with ${esc(item.setup.pinion||'—')}/${esc(item.setup.gear||'—')} yet.`:'Choose a car for this setup on the workbench to see where it was driven.'}</p>${item.notes?`<p class="library-notes">${esc(item.notes)}</p>`:'<p class="hint">No setup notes yet.</p>'}<div class="detail-actions">${[['load','Open on the workbench'],['compare','Compare with…'],['sheet','Setup sheet'],['rename','Rename'],['duplicate','Duplicate'],['export','Export file'],['delete','Delete']].map(([action,label])=>`<button class="btn ${action==='load'?'primary':action==='delete'?'danger':['rename','duplicate','export'].includes(action)?'ghost':''}" data-library-action="${action}" data-library-id="${item.id}" ${libraryError&&action!=='export'&&action!=='sheet'?'disabled':''}>${label}</button>`).join('')}</div>`;
}
function renderLibrary() {
  $('#library-error').textContent=libraryError;$('#library-error').hidden=!libraryError;
  $('#library-backup').disabled=!!libraryError||!library.length;
  $('#library-import').disabled=!!libraryError&&libraryRaw===null;
  $('#library-import').innerHTML=sfIcon('download')+(libraryError?'Restore library backup':'Import library');
  $('#library-recover-export').hidden=!libraryError||libraryRaw===null;
  const entries=LibraryModel.search(library,$('#library-search').value,$('#library-sort').value);
  renderLibraryTable(entries);
  if(typeof LibraryUI!=='undefined')LibraryUI.status('setups',libraryError?'Needs attention':library.length===1?'1 saved setup':library.length?library.length+' saved setups':'No setups yet');
  $('#library-undo').hidden=!deletedEntry;
}
function openLibraryTask(kind,id=null) {
  const item=id?library.find(e=>e.id===id):null;
  if(id&&!item)return toast('This saved setup no longer exists.');
  libraryTask={kind,id,raw:libraryRaw};
  const save=kind==='save',rename=kind==='rename',deleting=kind==='delete';
  $('#library-editor-title').textContent=save?(item?'Save changes to library':'Save a setup'):rename?'Rename saved setup':deleting?'Delete saved setup?':'Load saved setup?';
  $('#library-editor-description').textContent=save?'Library entries change only when you save them. Analyze and comparisons use these saved snapshots.':rename?'This changes the library name. Current workbench inputs stay as they are.':['restore','replace-workbench'].includes(kind)?'':deleting?`Delete “${item.setup.name}” from the library? The current workbench will stay open. You can undo this deletion here.`:`Load “${item.setup.name}”? This replaces the current workbench inputs. Save any changes you want to keep first.`;
  $('#library-name-field').hidden=!(save||rename);$('#library-notes-field').hidden=!save;
  $('#library-entry-name').value=save?state.setup.name:item?.setup.name||'';
  $('#library-entry-notes').value=save?(item?.notes||''):'';
  $('#library-editor-error').textContent='';$('#library-save-copy').hidden=!(save&&item);
  $('#library-editor-confirm').textContent=save?(item?'Update saved setup':'Save to library'):rename?'Rename':deleting?'Delete setup':'Load setup';
  $('#library-editor').showModal();if(save||rename)$('#library-entry-name').focus();
}
function completeLibraryTask(asCopy=false) {
  const task=libraryTask;if(!task)return;
  try {
    if(task.kind==='replace-workbench'){applyWorkbench(task.next);$('#library-editor').close();if(task.afterRoute)navigate(task.afterRoute);if(task.focus)focusSetupInput(task.focus);return;}
    if(task.raw!==libraryRaw||DataStore.getItem(LIBRARY_KEY)!==task.raw){readLibrary();renderLibrary();throw Error('The library changed. Close this dialog and try again.');}
    const now=new Date().toISOString(),item=library.find(e=>e.id===task.id);
    if(task.kind==='save') {
      const setup=CalculatorModel.cleanSetup({...state.setup,name:LibraryModel.name($('#library-entry-name').value)}),id=asCopy||task.asCopy?null:task.id,newId=crypto.randomUUID();
      commitLibrary(LibraryModel.save(library,{id,setup,notes:$('#library-entry-notes').value,now,newId}));
      state.setup.name=setup.name;bindLibrary(id||newId);analysisId=id||newId;fillInputs();persist();libraryNotice('Setup saved to your library.');toast('Setup saved to library.');
    } else if(task.kind==='rename') {
      commitLibrary(LibraryModel.rename(library,task.id,$('#library-entry-name').value,now));libraryNotice('Saved setup renamed.');
    } else if(task.kind==='delete') {
      commitLibrary(LibraryModel.remove(library,task.id));deletedEntry=[item];binderTicks.delete(task.id);
      if(activeLibraryId===task.id)bindLibrary(null);libraryNotice('Setup deleted. Undo is available until another deletion or app restart.');
    } else if(task.kind==='delete-many') {
      const gone=library.filter(e=>task.ids.includes(e.id));commitLibrary(task.ids.reduce((list,id)=>LibraryModel.remove(list,id),library));deletedEntry=gone;binderTicks.clear();
      if(task.ids.includes(activeLibraryId))bindLibrary(null);libraryNotice(`${gone.length} setups deleted. Undo is available until another deletion or app restart.`);
    } else if(task.kind==='restore') {
      commitLibrary(task.entries,{recover:true});deletedEntry=null;bindLibrary(null);libraryNotice('Library restored from backup. Your workbench draft was kept.');
    } else {
      if(!item)throw Error('This saved setup no longer exists.');
      state.setup=CalculatorModel.cleanSetup({...item.setup,...task.gearing});if(task.feedbackInclude)state.setup.adviceUseSetup='yes';state.reference=null;bindLibrary(item.id);fillInputs();persist();navigate('telemetry');toast('Loaded '+item.setup.name+'.');
    }
      renderLibrary();$('#library-editor').close();
      if(task.feedbackNext){task.feedbackNext.setup.name=state.setup.name;applyWorkbench(task.feedbackNext);}
      if(task.afterRoute)navigate(task.afterRoute);
    if(task.focus)focusSetupInput(task.focus);
  } catch(error){$('#library-editor-error').textContent=libraryFailure(error);}
}
function initializeLibrary() {
  readLibrary();try{activeLibraryId=DataStore.getItem(ACTIVE_KEY);}catch{}
  if(!library.some(e=>e.id===activeLibraryId))activeLibraryId=null;
  $('#library-button').onclick=()=>navigate('library');
  $('#save-library').onclick=()=>openLibraryTask('save',activeLibraryId);
  $('#library-search').oninput=renderLibrary;$('#library-sort').onchange=renderLibrary;
  $('#library-editor-cancel').onclick=()=>$('#library-editor').close();
  $('#library-editor-confirm').onclick=()=>completeLibraryTask();$('#library-save-copy').onclick=()=>completeLibraryTask(true);
  $('#library-entry-name').onkeydown=event=>{if(event.key==='Enter'&&!event.isComposing){event.preventDefault();completeLibraryTask();}};
  for(const container of [$('#library-list'),$('#library-detail')])container.onclick=event=>{
    const button=event.target.closest('[data-library-action]');if(!button)return;
    const {libraryAction:action,libraryId:id}=button.dataset,item=library.find(e=>e.id===id);if(!item)return;
    try {
      if(action==='select'){selectedLibraryId=id;renderLibrary();}
      else if(action==='tick'){if(binderTicks.has(id))binderTicks.delete(id);else binderTicks.add(id);renderLibrary();}
      else if(action==='star'){commitLibrary(LibraryModel.star(library,id,!item.favourite));}
      else if(action==='export'){binderDownload(item);libraryNotice('Setup file saved: open it on any workbench with Open file.');}
      else if(action==='analyze'||action==='compare'){showSavedAnalysis(id,action==='compare');}
      else if(action==='sheet'){SetupSheet.download(item.setup,{notes:item.notes,savedAt:item.updatedAt,units:Units.prefs});libraryNotice('Setup sheet downloaded. Open it and print, or save as PDF.');}
      else if(action==='duplicate') {commitLibrary(LibraryModel.duplicate(library,id,crypto.randomUUID(),new Date().toISOString()));libraryNotice('Saved setup duplicated.');}
      else openLibraryTask(action,id);
    }catch(error){libraryNotice(libraryFailure(error));}
  };
  // The binder: filters, a new setup for a car, and the action bar.
  for(const b of document.querySelectorAll('[data-binder-filter]'))b.onclick=()=>{binderFilter=b.dataset.binderFilter;renderLibrary();};
  $('#library-list').addEventListener('click',event=>{const b=event.target.closest('[data-binder-new]');if(!b)return;const car=binderCars().find(c=>c.ref===b.dataset.binderNew);if(car){replaceWorkbench({setup:{...CalculatorModel.blank(),name:car.name,carRef:car.ref},reference:null},'Start a new setup for '+car.name+'?');navigate('telemetry');}});
  $('#binder-actions').onclick=event=>{const b=event.target.closest('button');if(!b)return;const ids=[...binderTicks].filter(id=>library.some(e=>e.id===id)); // In the order ticked: the first is the base.
    if(b.id==='binder-clear'){binderTicks.clear();renderLibrary();}
    else if(b.id==='binder-compare'&&ids.length>=2&&ids.length<=3)SetupsUI.compareSet(ids);
    else if(b.id==='binder-export'){for(const id of ids)binderDownload(library.find(e=>e.id===id));libraryNotice(ids.length===1?'Setup file saved.':ids.length+' setup files saved.');}
    else if(b.id==='binder-delete'&&ids.length){libraryTask={kind:'delete-many',ids,raw:libraryRaw};$('#library-editor-title').textContent=`Delete ${ids.length} saved setup${ids.length===1?'':'s'}?`;$('#library-editor-description').textContent=`Delete ${library.filter(e=>ids.includes(e.id)).map(e=>'“'+e.setup.name+'”').join(', ')} from the library? The current workbench stays open. You can undo this here.`;$('#library-name-field').hidden=true;$('#library-notes-field').hidden=true;$('#library-save-copy').hidden=true;$('#library-editor-error').textContent='';$('#library-editor-confirm').textContent='Delete setups';$('#library-editor').showModal();}
  };
  $('#library-undo').onclick=()=>{try{if(deletedEntry){commitLibrary(LibraryModel.clean([...library,...deletedEntry]));deletedEntry=null;renderLibrary();libraryNotice('Deleted setup restored.');}}catch(error){libraryNotice(libraryFailure(error));}};
  $('#library-backup').onclick=()=>{try{const url=URL.createObjectURL(new Blob([LibraryModel.encode(library)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='SlotForge-Telemetry-library.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}catch(error){libraryNotice(error.message);}};
  $('#library-recover-export').onclick=()=>{try{if(libraryRaw===null)return;const url=URL.createObjectURL(new Blob([libraryRaw],{type:'application/octet-stream'})),a=document.createElement('a');a.href=url;a.download='SlotForge-Telemetry-unreadable-library.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}catch(error){libraryNotice(error.message);}};
  $('#library-import').onclick=()=>$('#library-file').click();
  $('#library-file').onchange=async event=>{
    const file=event.target.files[0];if(!file)return;
    try{
      if(file.size>LibraryModel.MAX_BYTES)throw Error('Choose a library backup smaller than 4 MB.');
      const incoming=LibraryModel.decode(await file.text());
      if(libraryError){
        openLibraryTask('restore');libraryTask.entries=incoming;
        $('#library-editor-title').textContent='Restore library from backup?';
        $('#library-editor-description').textContent=`Replace the unreadable library with ${incoming.length} saved setups from this backup? Cancel to export the unreadable data first. Your workbench draft stays unchanged.`;
        $('#library-editor-confirm').textContent='Replace unreadable library';
      }else{commitLibrary(LibraryModel.merge(library,incoming,()=>crypto.randomUUID()));libraryNotice(`Imported ${incoming.length} setups as new copies. Existing entries were kept.`);}
    }
    catch(error){libraryNotice(libraryFailure(error));}finally{event.target.value='';}
  };
  window.addEventListener('storage',event=>{if(event.key===LIBRARY_KEY||event.key===null){readLibrary();renderLibrary();updateLibraryStatus();if(location.hash.startsWith('#analyze'))renderAnalysis();}});
  renderLibrary();updateLibraryStatus();
}
