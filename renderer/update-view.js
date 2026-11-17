// "A new version is available": a quiet notice in the top bar, plus Settings → Updates.
// Same behaviour as SlotForge Paddock: Download opens the release page in the browser; nothing installs by itself.
const UpdatesUI=(()=>{
  const q=s=>document.querySelector(s);
  let state=null,loading=false,again=false,busy=false;
  const when=ms=>new Date(ms).toLocaleString('en-GB',{dateStyle:'medium',timeStyle:'short'});
  async function call(name,input){if(!window.updates)throw Error('Update checks require the desktop app.');const r=await window.updates[name](input);if(!r?.ok)throw Error(r?.error||'Update action failed.');return r.value;}
  // A change that arrives while loading is not lost: load once more afterwards.
  async function load(){
    if(!window.updates)return render();
    if(loading){again=true;return;}loading=true;
    try{state=await call('status');}catch{state=null;/* The notice is optional; never block the app for it. */}finally{loading=false;}
    render();if(again){again=false;load();}
  }
  function notice(){
    const bar=q('.workspace-bar');if(!bar)return;
    const s=state,html=s?.notify&&s.latest?`<span class="update-notice" role="status">${sfIcon('download')}<span>Telemetry ${esc(s.latest.version)} is available</span><button type="button" class="btn small primary" data-update="open">Download</button><button type="button" class="btn small" data-update="skip" title="Hide until a newer version appears">Not now</button></span>`:'';
    const old=bar.querySelector('.update-notice');if((old?.outerHTML||'')===html)return;
    old?.remove();if(html)bar.querySelector('.version').insertAdjacentHTML('beforebegin',html);
  }
  function settings(){
    const box=q('#settings-updates');if(!box)return;const s=state;
    if(!window.updates){q('#update-summary').textContent='Update checks are available in the desktop app.';for(const b of box.querySelectorAll('button'))b.hidden=true;return;}
    if(!s){q('#update-summary').textContent='Loading…';return;}
    const how=!s.enabled?'Off: Telemetry only checks when you click Check now.':s.automatic?'Telemetry checks for a new version twice a day at most and shows a notice in the top bar.':'This copy only checks when you click Check now.';
    q('#update-summary').textContent=how+' It only asks GitHub for the newest version number; nothing about you, your setups or your laps is sent. Telemetry never installs anything by itself.';
    const error=s.lastError&&!s.checking?s.lastError:'';q('#update-error').textContent=error;q('#update-error').hidden=!error;
    const newest=s.checking?'Checking…':s.latest?`Version ${s.latest.version} is available`:s.upToDate?'You have the latest version':'Not checked yet';
    q('#update-facts').innerHTML=[['This version',s.current],['Newest version',newest],['Last checked',s.lastCheck?when(s.lastCheck):'Never']].map(([k,v])=>`<tr><th>${k}</th><td>${esc(v)}</td></tr>`).join('');
    const open=q('#update-download');open.hidden=!s.latest;open.textContent=s.latest?'Download '+s.latest.version:'Download';
    q('#update-after').hidden=!s.latest;
    const toggle=q('#update-toggle');toggle.hidden=!s.automatic;toggle.textContent=s.enabled?'Turn off automatic checks':'Turn on automatic checks';
    q('#update-check').disabled=busy||s.checking;
  }
  function render(){notice();settings();}
  async function act(name,input,done){
    if(busy)return;busy=true;settings();
    try{state=await call(name,input);if(done)toast(done(state));}catch(e){toast(e.message);load();}finally{busy=false;render();}
  }
  function init(){
    q('.settings-nav').insertAdjacentHTML('beforeend','<a href="#settings/updates">Updates</a>');
    q('#settings-appearance').parentElement.insertAdjacentHTML('beforeend',`<section class="panel" id="settings-updates" hidden><h2>Updates</h2>
     <p id="update-summary" class="hint"></p><p id="update-error" class="note" role="alert" hidden></p>
     <div class="table-wrap"><table><tbody id="update-facts"></tbody></table></div>
     <div class="actions"><button type="button" class="btn primary" id="update-download" hidden>Download</button><button type="button" class="btn" id="update-check">Check now</button><button type="button" class="btn" id="update-toggle" hidden>Turn off automatic checks</button></div>
     <p id="update-after" class="hint" hidden>Download opens the release page in your browser. Make a backup (Settings → Backups), close Telemetry, then install the new version as before; your data stays where it is.</p></section>`);
    q('#update-download').onclick=()=>window.updates?.open().then(r=>{if(!r?.ok)toast(r?.error||'Could not open the release page.');});
    q('#update-check').onclick=()=>act('check',undefined,s=>s.latest?`Version ${s.latest.version} is available.`:'You have the latest version.');
    q('#update-toggle').onclick=()=>act('enable',{enabled:!state?.enabled});
    document.addEventListener('click',e=>{const b=e.target.closest('[data-update]');if(!b)return;
      if(b.dataset.update==='open')q('#update-download').click();
      else act('skip',{version:state?.latest?.version},()=>'Telemetry will remind you again when a newer version appears. Settings → Updates has the download.');});
    window.updates?.onChange(()=>load());
    load();
  }
  function route(page,sub){
    const show=page==='settings'&&sub==='updates',box=q('#settings-updates');if(!box)return;box.hidden=!show;
    if(show){q('#settings-appearance').hidden=true;q('#settings-calculations').hidden=true;load();}
  }
  return {init,route,load,get state(){return state;}};
})();
