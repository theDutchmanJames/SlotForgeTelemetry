// Explicit saves are separate from the automatically saved workbench draft.
const LIBRARY_KEY='slotforge.telemetry.library.v1',ACTIVE_KEY='slotforge.telemetry.library.active.v1';
let library=[],libraryRaw=null,libraryError='',activeLibraryId=null,libraryTask=null,deletedEntry=null;
function readLibrary() {
  libraryRaw=null;
  try {libraryRaw=localStorage.getItem(LIBRARY_KEY);library=libraryRaw===null?[]:LibraryModel.decode(libraryRaw);libraryError='';}
  catch {library=[];libraryError='The library could not be read. Its stored data has been left untouched. Export the unreadable data for safekeeping, then restore a valid library backup.';}
}
function bindLibrary(id) {
  activeLibraryId=id;
  try {if(id)localStorage.setItem(ACTIVE_KEY,id);else localStorage.removeItem(ACTIVE_KEY);}catch {/* Library saving reports storage errors separately. */}
  updateLibraryStatus();
}
function updateLibraryStatus() {
  const item=library.find(e=>e.id===activeLibraryId);
  if(!item&&!libraryError)activeLibraryId=null;
  let changed=false;
  if(item)try{changed=JSON.stringify(CalculatorModel.cleanSetup(state.setup))!==JSON.stringify(item.setup);}catch{changed=true;}
  $('#library-workspace-status').textContent=libraryError?'Library unavailable':item?`${item.setup.name} · ${changed?'unsaved library changes':'saved in library'}`:'Workbench draft · not linked to a library setup';
  $('#library-workspace-status').dataset.saveStatus=libraryError?'error':item&&!changed?'saved':'draft';
  $('#library-count').textContent=library.length;
  for(const id of ['save-library','save-copy'])$('#'+id).disabled=!!libraryError||!$('#input-error').hidden;
}
function commitLibrary(next,{recover=false}={}) {
  if(libraryError&&!recover)throw Error(libraryError);
  if(localStorage.getItem(LIBRARY_KEY)!==libraryRaw){readLibrary();renderLibrary();throw Error('The library changed in another window. Review it and try again.');}
  const text=LibraryModel.encode(next);
  localStorage.setItem(LIBRARY_KEY,text); // Commit before updating memory or reporting success.
  library=next;libraryRaw=text;libraryError='';renderLibrary();updateLibraryStatus();
}
function libraryFailure(error) {return ['QuotaExceededError','SecurityError'].includes(error.name)?'Could not save the library on this device. Your saved entries are unchanged; export your setup as a file.':error.message;}
function libraryNotice(message) {$('#library-message').textContent=message;}
function renderLibraryTable(entries){
  if(!entries.some(e=>e.id===selectedLibraryId))selectedLibraryId=entries[0]?.id||null;
  $('#library-list').innerHTML=entries.length?`<div class="table-wrap"><table class="library-table"><thead><tr><th>Setup</th><th>Gearing</th><th>Tyres</th><th>Weight</th></tr></thead><tbody>${entries.map(item=>{const s=item.setup,m=TelemetryModel.calculate(CalculatorModel.inputOf(s));return `<tr class="${item.id===selectedLibraryId?'selected':''}"><td><button class="select-setup" data-library-action="select" data-library-id="${item.id}" aria-pressed="${item.id===selectedLibraryId}">${sfIcon('setup')}${esc(s.name)}</button><small>Saved ${esc(new Date(item.updatedAt).toLocaleDateString())}</small></td><td>${esc(s.pinion||'—')} / ${esc(s.gear||'—')}</td><td>${performanceNumber(m.motor.rearDiameter)} mm</td><td>${performanceNumber(m.massG,1)} g</td></tr>`;}).join('')}</tbody></table></div>`:`<div class="library-empty"><h3>${library.length?'No matching setups':'Your setup library starts here.'}</h3><p>${library.length?'Try another name or a word from your notes.':'Save a setup from Telemetry to keep its inputs together.'}</p></div>`;
  const item=library.find(e=>e.id===selectedLibraryId);$('#library-detail').hidden=!item;
  if(!item)return;
  const m=TelemetryModel.calculate(CalculatorModel.inputOf(item.setup));
  $('#library-detail').innerHTML=`<p class="eyebrow">SELECTED SETUP</p><h2 class="library-detail-title">${esc(item.setup.name)}</h2><div class="library-detail-art" data-category="tyres" role="img" aria-label="Wheels and drivetrain assembly">${sfIcon('wheel-tyre-set')}${sfIcon('assembly')}${sfIcon('wheel-tyre-set')}</div><span class="badge saved">${sfIcon('check')} SAVED VERSION</span><dl class="detail-metrics">${[['No-load speed',m.motor.speedKmh,'km/h'],['Gear ratio',m.motor.ratio,':1'],['Peak power',m.motor.peakPowerW,'W'],['Car weight',m.massG,'g']].map(([label,value,unit])=>`<div><dt>${label}</dt><dd>${performanceNumber(value)} <small>${unit}</small></dd></div>`).join('')}</dl>${item.notes?`<p class="library-notes">${esc(item.notes)}</p>`:'<p class="hint">No setup notes yet.</p>'}<p class="library-date">Updated ${esc(new Date(item.updatedAt).toLocaleString())}</p><hr><div class="detail-actions">${[['load','Edit in Telemetry'],['analyze','Analyze'],['compare','Compare with…'],['rename','Rename'],['duplicate','Duplicate'],['delete','Delete']].map(([action,label])=>`<button class="btn ${action==='load'?'primary':''}" data-library-action="${action}" data-library-id="${item.id}" ${libraryError?'disabled':''}>${['load','analyze','compare','rename'].includes(action)?sfIcon({load:'edit',analyze:'timer',compare:'transfer',rename:'edit'}[action]):''}${label}</button>`).join('')}</div>`;
}
function renderLibrary() {
  $('#library-error').textContent=libraryError;$('#library-error').hidden=!libraryError;
  $('#library-backup').disabled=!!libraryError||!library.length;
  $('#library-import').disabled=!!libraryError&&libraryRaw===null;
  $('#library-import').innerHTML=sfIcon('download')+(libraryError?'Restore library backup':'Import library');
  $('#library-recover-export').hidden=!libraryError||libraryRaw===null;
  const entries=LibraryModel.search(library,$('#library-search').value,$('#library-sort').value);
  renderLibraryTable(entries);
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
    if(task.kind==='replace-workbench'){applyWorkbench(task.next);$('#library-editor').close();return;}
    if(task.raw!==libraryRaw||localStorage.getItem(LIBRARY_KEY)!==task.raw){readLibrary();renderLibrary();throw Error('The library changed. Close this dialog and try again.');}
    const now=new Date().toISOString(),item=library.find(e=>e.id===task.id);
    if(task.kind==='save') {
      const setup=CalculatorModel.cleanSetup({...state.setup,name:LibraryModel.name($('#library-entry-name').value)}),id=asCopy||task.asCopy?null:task.id,newId=crypto.randomUUID();
      commitLibrary(LibraryModel.save(library,{id,setup,notes:$('#library-entry-notes').value,now,newId}));
      state.setup.name=setup.name;bindLibrary(id||newId);analysisId=id||newId;fillInputs();persist();libraryNotice('Setup saved to your library.');toast('Setup saved to library.');
    } else if(task.kind==='rename') {
      commitLibrary(LibraryModel.rename(library,task.id,$('#library-entry-name').value,now));libraryNotice('Saved setup renamed.');
    } else if(task.kind==='delete') {
      commitLibrary(LibraryModel.remove(library,task.id));deletedEntry=item;
      if(activeLibraryId===task.id)bindLibrary(null);libraryNotice('Setup deleted. Undo is available until another deletion or app restart.');
    } else if(task.kind==='restore') {
      commitLibrary(task.entries,{recover:true});deletedEntry=null;bindLibrary(null);libraryNotice('Library restored from backup. Your workbench draft was kept.');
    } else {
      if(!item)throw Error('This saved setup no longer exists.');
      state.setup=CalculatorModel.cleanSetup({...item.setup,...task.gearing});if(task.feedbackInclude)state.setup.adviceUseSetup='yes';state.reference=null;bindLibrary(item.id);fillInputs();persist();navigate('telemetry');toast('Loaded '+item.setup.name+'.');
    }
      renderLibrary();$('#library-editor').close();
      if(task.afterRoute)navigate(task.afterRoute);
    if(task.focus)focusSetupInput(task.focus);
  } catch(error){$('#library-editor-error').textContent=libraryFailure(error);}
}
function initializeLibrary() {
  readLibrary();try{activeLibraryId=localStorage.getItem(ACTIVE_KEY);}catch{}
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
      else if(action==='analyze'||action==='compare'){showSavedAnalysis(id,action==='compare');}
      else if(action==='duplicate') {commitLibrary(LibraryModel.duplicate(library,id,crypto.randomUUID(),new Date().toISOString()));libraryNotice('Saved setup duplicated.');}
      else openLibraryTask(action,id);
    }catch(error){libraryNotice(libraryFailure(error));}
  };
  $('#library-undo').onclick=()=>{try{if(deletedEntry){commitLibrary(LibraryModel.clean([...library,deletedEntry]));deletedEntry=null;renderLibrary();libraryNotice('Deleted setup restored.');}}catch(error){libraryNotice(libraryFailure(error));}};
  $('#library-backup').onclick=()=>{try{const url=URL.createObjectURL(new Blob([LibraryModel.encode(library)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='SlotForge-Telemetry-library.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}catch(error){libraryNotice(error.message);}};
  $('#library-recover-export').onclick=()=>{try{if(libraryRaw===null)return;const url=URL.createObjectURL(new Blob([libraryRaw],{type:'application/octet-stream'})),a=document.createElement('a');a.href=url;a.download='SlotForge-Telemetry-unreadable-library.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}catch(error){libraryNotice(error.message);}};
  $('#library-import').onclick=()=>$('#library-file').click();
  $('#library-file').onchange=async event=>{
    const file=event.target.files[0];if(!file)return;
    try{
      if(file.size>LibraryModel.MAX_BYTES)throw Error('Choose a library backup smaller than 2 MB.');
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
