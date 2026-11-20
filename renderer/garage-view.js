// Garage: Paddock cars (read-only, owned by Paddock), Telemetry's own cars, and tracks with lanes.
// Setups link to a car by reference; lap runs keep using names, which the garage keeps consistent.
const GarageUI=(()=>{
  const q=s=>document.querySelector(s);
  let view={local:{data:{cars:[],tracks:[]},error:''},paddock:{hosts:[],error:''}},selected='',editing=null;const photos=new Map();
  const ref={local:id=>'local:'+id,paddock:(db,id)=>`paddock:${db}:${id}`};
  // One list for every screen: Paddock cars first, then Telemetry's own.
  function cars(){
    const paddock=view.paddock.hosts.flatMap(h=>h.cars.map(c=>({ref:ref.paddock(h.id,c.id),source:'paddock',databaseId:h.id,collection:h.name,id:c.id,name:c.name,maker:c.maker,raceClass:c.raceClass,archived:c.archived,availability:c.availability,technical:c.technical||{},photo:c.photo?.hash||null,notes:''})));
    const local=view.local.data.cars.map(c=>({ref:ref.local(c.id),source:'local',id:c.id,name:c.name,maker:c.maker,raceClass:c.raceClass,archived:false,technical:{},photo:null,notes:c.notes}));
    return [...paddock,...local];
  }
  const tracks=()=>view.local.data.tracks;
  const byRef=r=>cars().find(c=>c.ref===r)||null;
  const key=s=>String(s||'').trim().toLowerCase();
  // Runs that belong to a car: imported runs by Paddock identity, manual and Track day runs by name.
  function runsOf(car){return RaceUI.runs().filter(r=>car.source==='paddock'&&r.entryKind!=='manual'?r.hostId===car.databaseId&&r.carId===car.id:key(r.car)===key(car.name));}
  async function call(name,input){if(!window.garage)throw Error('The garage requires the desktop app.');const r=await window.garage[name](input);if(!r?.ok)throw Error(r?.error||'Garage operation failed.');return r.value;}
  async function load(){try{view=await call('read');}catch{/* Browser preview or unavailable: empty garage. */}refresh();}
  function refresh(){fillCarSelect();if(!q('#garage')?.hidden)render();TrackdayUI.suggest?.();}
  // Workbench: optional car for the setup. The select is bound like every other setup input (name="carRef").
  function fillCarSelect(){
    const select=q('[name=carRef]');if(!select)return;const current=state.setup.carRef||'',list=cars().filter(c=>!c.archived||c.ref===current);
    const option=(value,label)=>`<option value="${esc(value)}">${esc(label)}</option>`;
    select.innerHTML=option('','No car selected')+list.map(c=>option(c.ref,c.name+(c.source==='paddock'?' · Paddock':''))).join('')+(current&&!byRef(current)?option(current,'Car not in the garage right now'):'');
    select.value=current;
  }
  async function photo(hash,img){
    if(!hash){img.hidden=true;return;}
    if(!photos.has(hash))photos.set(hash,call('photo',hash).catch(()=>null));
    const uri=await photos.get(hash);if(uri&&/^data:image\/(png|jpeg|webp);base64,/.test(uri)){img.src=uri;img.hidden=false;}else img.hidden=true;
  }
  const time=ms=>Number.isFinite(ms)?(ms/1000).toFixed(3)+' s':'—';
  function render(){
    const list=cars(),setups=c=>library.filter(e=>e.setup.carRef===c.ref);
    q('#garage-error').textContent=[view.local.error,view.paddock.error].filter(Boolean).join(' ');q('#garage-error').hidden=!q('#garage-error').textContent;q('#garage-reset').hidden=!view.local.error;
    q('#garage-source').textContent=view.paddock.hosts.length?`Paddock cars from ${view.paddock.hosts.map(h=>h.name).join(', ')}, updated with each import. Edit them in Paddock.`:'Connect to Paddock on this computer (Settings → Connect to Paddock) to bring in your Paddock cars. You can also add cars here.';
    q('#garage-cars').innerHTML=list.length?list.map(c=>`<button type="button" class="garage-car${c.ref===selected?' selected':''}${c.archived?' archived':''}" data-garage-car="${esc(c.ref)}"><span class="garage-thumb">${sfIcon('wheel-tyre-set')}<img alt="" hidden data-photo="${esc(c.photo||'')}"></span><span class="garage-car-text"><strong>${esc(c.name)}</strong><small>${esc([c.maker,c.raceClass].filter(Boolean).join(' · ')||'—')}</small><small>${setups(c).length} setup(s) · ${runsOf(c).length} run(s)</small></span><span class="badge"${c.source==='paddock'||c.archived?' data-paddock':''}>${c.source==='paddock'?'PADDOCK':'TELEMETRY'}${c.archived?' · ARCHIVED':''}</span></button>`).join(''):'<p class="hint">No cars yet.</p>';
    for(const b of document.querySelectorAll('[data-garage-car]')){b.onclick=()=>{selected=b.dataset.garageCar;render();};photo(b.querySelector('img').dataset.photo,b.querySelector('img'));}
    q('#garage-tracks').innerHTML=tracks().length?`<div class="table-wrap"><table><thead><tr><th>Track</th><th>Lanes</th><th></th></tr></thead><tbody>${tracks().map(t=>`<tr><th>${esc(t.name)}${t.notes?`<small>${esc(t.notes)}</small>`:''}</th><td>${t.lanes.map(l=>`${l.lane}: ${l.lengthM===null?'length not set':unitText(l.lengthM,'m',2)}`).join(' · ')}</td><td><button type="button" class="btn small" data-garage-edit-track="${esc(t.id)}">Edit</button></td></tr>`).join('')}</tbody></table></div>`:'<p class="hint">Add your tracks with their lane lengths. Track day uses them to fill in the lane length.</p>';
    for(const b of document.querySelectorAll('[data-garage-edit-track]'))b.onclick=()=>openEditor('track',tracks().find(t=>t.id===b.dataset.garageEditTrack));
    if(typeof LibraryUI!=='undefined'){const t=tracks().length;LibraryUI.status('garage',`${list.length} car${list.length===1?'':'s'} · ${t} track${t===1?'':'s'}`);}
    detail();
  }
  function detail(){
    const box=q('#garage-detail'),c=byRef(selected);box.hidden=!c;if(!c)return;
    const runs=runsOf(c),setups=library.filter(e=>e.setup.carRef===c.ref);
    // Best eligible lap per track and lane, across manual, Track day and imported runs.
    const best=new Map();for(const r of runs){const st=RaceModel.statistics(r);if(st.best===null)continue;const k=r.track+' · lane '+r.lane;if(!best.has(k)||st.best<best.get(k).best)best.set(k,{best:st.best,run:r});}
    const spec=Object.entries(c.technical).filter(([,v])=>v).slice(0,12);
    box.innerHTML=`<img class="garage-photo" alt="Photo of ${esc(c.name)}" hidden><p class="eyebrow">${c.source==='paddock'?'FROM PADDOCK · '+esc(c.collection):'TELEMETRY CAR'}</p><h2>${esc(c.name)}</h2><p class="muted">${esc([c.maker,c.raceClass,c.availability].filter(Boolean).join(' · '))}</p>
     ${spec.length?`<dl class="garage-spec">${spec.map(([k,v])=>`<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>`:''}${c.notes?`<p class="library-notes">${esc(c.notes)}</p>`:''}
     <div class="actions"><button type="button" class="btn primary" id="garage-new-setup">New setup for this car</button><button type="button" class="btn" id="garage-trackday">Track day with this car</button>${c.source==='local'?'<button type="button" class="btn" id="garage-edit-car">Edit</button>':''}</div>
     <h3>Setups</h3>${setups.length?`<ul class="garage-list">${setups.map(e=>`<li><span>${esc(e.setup.name)}</span><button type="button" class="btn small" data-library-action="load" data-library-id="${esc(e.id)}">Edit in Telemetry</button></li>`).join('')}</ul>`:'<p class="hint">No saved setups for this car yet. Choose this car in a setup on the workbench.</p>'}
     <h3>Best laps</h3>${best.size?`<div class="table-wrap"><table><thead><tr><th>Track · lane</th><th>Best eligible lap</th><th></th></tr></thead><tbody>${[...best].map(([k,v])=>`<tr><th>${esc(k)}</th><td>${time(v.best)}</td><td><button type="button" class="btn small" data-garage-run="${esc(v.run.id)}">Analyze</button></td></tr>`).join('')}</tbody></table></div><p class="hint">${runs.length} run(s): imported races by Paddock car, manual and Track day runs by car name.</p>`:'<p class="hint">No laps for this car yet.</p>'}`;
    photo(c.photo,box.querySelector('.garage-photo'));
    q('#garage-new-setup').onclick=()=>{replaceWorkbench({setup:{...CalculatorModel.blank(),name:c.name,carRef:c.ref},reference:null},'Start a new setup for '+c.name+'?');navigate('telemetry');};
    q('#garage-trackday').onclick=()=>{TrackdayUI.useCar(c.name);navigate('trackday');};
    if(q('#garage-edit-car'))q('#garage-edit-car').onclick=()=>openEditor('car',view.local.data.cars.find(x=>x.id===c.id));
    for(const b of box.querySelectorAll('[data-garage-run]'))b.onclick=()=>RaceUI.openRun(b.dataset.garageRun);
    for(const b of box.querySelectorAll('[data-library-action=load]'))b.onclick=()=>openLibraryTask('load',b.dataset.libraryId);
  }
  // One dialog for cars and tracks.
  function openEditor(kind,record=null){
    editing={kind,id:record?.id||null};const d=q('#garage-editor');
    q('#garage-editor-title').textContent=(record?'Edit ':'Add ')+(kind==='car'?'car':'track');
    q('#garage-editor-body').innerHTML=kind==='car'
     ?`<label class="field">Car name<input id="garage-f-name" maxlength="200" value="${esc(record?.name||'')}"></label><div class="form-grid"><label class="field">Maker · optional<input id="garage-f-maker" maxlength="200" value="${esc(record?.maker||'')}"></label><label class="field">Class · optional<input id="garage-f-class" maxlength="100" value="${esc(record?.raceClass||'')}"></label></div><label class="field">Notes · optional<textarea id="garage-f-notes" maxlength="2000" rows="3">${esc(record?.notes||'')}</textarea></label><p class="hint">For cars that are not in Paddock. Cars in Paddock appear here automatically.</p>`
     :`<label class="field">Track name<input id="garage-f-name" maxlength="200" value="${esc(record?.name||'')}"></label><label class="field">Number of lanes<input id="garage-f-lanes" type="number" min="1" max="64" step="1" value="${record?.lanes.length||2}"></label><div id="garage-f-lengths" class="form-grid"></div><label class="field">Notes · optional<textarea id="garage-f-notes" maxlength="2000" rows="2">${esc(record?.notes||'')}</textarea></label><p class="hint">Lane length is the distance driven in one lap of that lane, in ${esc(Units.label('m'))}. Leave a length empty if you do not know it.</p>`;
    if(kind==='track'){const draw=()=>{const n=Math.max(1,Math.min(64,Math.floor(Number(q('#garage-f-lanes').value)||1))),old=[...q('#garage-f-lengths').querySelectorAll('input')].map(i=>i.value);q('#garage-f-lengths').innerHTML=Array.from({length:n},(_,i)=>{const lane=record?.lanes.find(l=>l.lane===i+1);const v=old[i]??(lane?.lengthM==null?'':UnitSystem.inputText(Units.value(lane.lengthM,'m')));return `<label class="field">Lane ${i+1} length · ${esc(Units.label('m'))}<input type="number" min="0" step="any" data-lane="${i+1}" value="${esc(v)}"></label>`;}).join('');};draw();q('#garage-f-lanes').oninput=draw;}
    q('#garage-editor-delete').hidden=!record;q('#garage-editor-error').textContent='';d.showModal();q('#garage-f-name').focus();
  }
  async function saveEditor(){
    try{
      const name=q('#garage-f-name').value,notes=q('#garage-f-notes').value;let value;
      if(editing.kind==='car')value=await call('saveCar',{id:editing.id||undefined,name,maker:q('#garage-f-maker').value,raceClass:q('#garage-f-class').value,notes});
      else{const lanes=[...q('#garage-f-lengths').querySelectorAll('input')].map(i=>({lane:Number(i.dataset.lane),lengthM:i.value===''?null:Number(Units.toMetric(Number(i.value),'m').toPrecision(7))}));value=await call('saveTrack',{id:editing.id||undefined,name,lanes,notes});}
      view=value;q('#garage-editor').close();refresh();toast((editing.kind==='car'?'Car':'Track')+' saved.');
    }catch(e){q('#garage-editor-error').textContent=e.message;}
  }
  async function removeEditing(){
    if(!editing?.id||!confirm(`Delete this ${editing.kind}? Setups and laps that use its name are not changed.`))return;
    try{view=await call('remove',{kind:editing.kind==='car'?'cars':'tracks',id:editing.id});q('#garage-editor').close();if(editing.kind==='car')selected='';refresh();}catch(e){q('#garage-editor-error').textContent=e.message;}
  }
  function init(){
    // Workbench: choose the car next to the setup name.
    q('[name=name]').closest('label').insertAdjacentHTML('afterend','<label class="field garage-car-field">Car<select name="carRef"></select><small class="hint">Paddock cars and cars added in Library → Cars &amp; tracks.</small></label>');
    q('.race-library-nav').insertAdjacentHTML('beforeend','<a href="#library/garage">Garage</a>');
    q('[data-page=library]').insertAdjacentHTML('beforeend',`<section id="garage" hidden><div class="section-heading"><div><h2>Cars &amp; tracks</h2><p class="hint" id="garage-source"></p></div><div class="actions"><button type="button" class="btn primary" id="garage-add-car">Add car</button><button type="button" class="btn" id="garage-add-track">Add track</button></div></div>
     <p id="garage-error" class="note" role="alert" hidden></p><button type="button" class="btn" id="garage-reset" hidden>Archive unreadable garage and start again</button>
     <div class="garage-layout"><div><h3>Cars</h3><div id="garage-cars" class="garage-cars"></div><h3>Tracks</h3><div id="garage-tracks"></div></div><aside id="garage-detail" class="panel" hidden></aside></div></section>
     <dialog id="garage-editor" aria-labelledby="garage-editor-title"><div class="dialog-head"><h2 id="garage-editor-title"></h2></div><div class="dialog-body"><div id="garage-editor-body"></div><p id="garage-editor-error" class="note" role="alert"></p><div class="actions"><button type="button" class="btn primary" id="garage-editor-save">Save</button><button type="button" class="btn danger" id="garage-editor-delete">Delete</button><button type="button" class="btn" id="garage-editor-cancel">Cancel</button></div></div></dialog>`);
    q('#garage-add-car').onclick=()=>openEditor('car');q('#garage-add-track').onclick=()=>openEditor('track');
    q('#garage-editor-save').onclick=saveEditor;q('#garage-editor-delete').onclick=removeEditing;q('#garage-editor-cancel').onclick=()=>q('#garage-editor').close();
    q('#garage-reset').onclick=async()=>{try{view=await call('reset');refresh();}catch(e){toast(e.message);}};
    fillCarSelect();load();
  }
  // Setup Binder: cars and tracks sit below the setups on the Library page; #library/garage scrolls to them.
  function route(page,sub){const show=page==='library';q('#garage').hidden=!show;if(show){render();if(sub==='garage')requestAnimationFrame(()=>q('#garage').scrollIntoView({block:'start'}));}}
  return {init,load,refresh,route,cars,tracks,byRef,runsOf,fillCarSelect};
})();
