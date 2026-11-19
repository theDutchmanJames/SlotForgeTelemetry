// Settings → Backups: automatic backups of all Telemetry data, an optional extra folder, and restore.
const BackupsUI=(()=>{
  const q=s=>document.querySelector(s),KIND={auto:'Automatic','manual':'Made by you','before-restore':'Before a restore'};
  let status=null,busy=false;
  const size=n=>n<1024*1024?Math.max(1,Math.round(n/1024))+' KB':(n/1024/1024).toFixed(1)+' MB';
  const when=iso=>iso?new Date(iso).toLocaleString('en-GB',{dateStyle:'medium',timeStyle:'short'}):'never';
  async function call(name,input){if(!window.backups)throw Error('Backups require the desktop app.');const r=await window.backups[name](input);if(!r?.ok)throw Error(r?.error||'Backup action failed.');return r.value;}
  function message(text,error=false){const m=q('#backup-message');m.textContent=text;m.hidden=!text;m.classList.toggle('race-error-note',error);}
  async function act(name,input,done){
    if(busy)return;busy=true;render();
    // Backups include the latest draft. During a restore no draft is written, so it cannot overwrite restored data;
    // edits made meanwhile are saved if the restore is cancelled or fails.
    const restoring=name.startsWith('restore');if(typeof flushPersist==='function')flushPersist();if(restoring&&typeof suspendPersist==='function')suspendPersist(true);let restored=false;
    try{const r=await call(name,input);restored=restoring&&!!r?.restored;if(r&&!r.cancelled){if(r.backups)status=r;else status=await call('status');message(done(r));}}
    catch(e){message(e.message,true);}finally{if(restoring&&!restored&&typeof suspendPersist==='function')suspendPersist(false);busy=false;render();}
  }
  function render(){
    const box=q('#settings-backups');if(!box)return;
    for(const b of box.querySelectorAll('button'))b.disabled=busy||!window.backups;
    if(!window.backups){q('#backup-summary').textContent='Backups are available in the desktop app.';return;}
    if(!status)return;
    q('#backup-summary').innerHTML=`Last automatic backup: <strong>${esc(when(status.lastAt))}</strong>. Telemetry backs up when your data has changed: at start-up, every 12 hours while open, and when you quit. The newest ${status.keep} automatic backups are kept.`;
    q('#backup-error').textContent=status.lastError||'';q('#backup-error').hidden=!status.lastError;
    q('#backup-extra').innerHTML=status.extraFolder?`Each automatic backup is also copied to <strong>${esc(status.extraFolder)}</strong>.`:'No extra folder chosen.';
    q('#backup-clear').hidden=!status.extraFolder;
    q('#backup-list').innerHTML=status.backups.length?`<div class="table-wrap"><table><thead><tr><th>Made</th><th>Kind</th><th>Size</th><th></th></tr></thead><tbody>${status.backups.map(b=>`<tr><th>${esc(when(b.createdAt))}</th><td>${KIND[b.kind]||esc(b.kind)}</td><td>${size(b.size)}</td><td><button type="button" class="btn small" data-backup-restore="${esc(b.name)}">Restore</button></td></tr>`).join('')}</tbody></table></div>`:'<p class="hint">No backups yet. The first automatic backup is made shortly after Telemetry starts.</p>';
    for(const b of box.querySelectorAll('[data-backup-restore]')){b.disabled=busy;b.onclick=()=>act('restoreSaved',b.dataset.backupRestore,()=> 'Restored. Telemetry is restarting…');}
  }
  async function refresh(){if(!window.backups){render();return;}try{status=await call('status');}catch(e){message(e.message,true);}render();}
  function init(){
    q('.settings-nav').insertAdjacentHTML('beforeend','<a href="#settings/backups">Backups</a>');
    q('#settings-appearance').parentElement.insertAdjacentHTML('beforeend',`<section class="panel" id="settings-backups" hidden><h2>Backups</h2>
     <p class="muted">One backup holds all your Telemetry data: saved setups and the workbench draft, manual and Track day laps, the garage, and races imported from Paddock.</p>
     <p id="backup-summary" class="hint"></p><p id="backup-error" class="note" role="alert" hidden></p>
     <div class="actions"><button type="button" class="btn primary" id="backup-now">Back up now</button><button type="button" class="btn" id="backup-export">Save a backup as…</button><button type="button" class="btn" id="backup-restore-file">Restore from a file…</button><button type="button" class="btn ghost" id="backup-open">Open backup folder</button></div>
     <p id="backup-message" class="note" role="status" hidden></p>
     <h3>Extra copy</h3><p class="hint">Keep a copy away from this computer: choose a USB stick or a cloud-synced folder, and every automatic backup is copied there too.</p><p id="backup-extra" class="hint"></p>
     <div class="actions"><button type="button" class="btn ghost" id="backup-choose">Choose folder…</button><button type="button" class="btn ghost" id="backup-clear">Stop copying</button></div>
     <h3>Backups on this computer</h3><div id="backup-list"></div>
     <p class="hint">Restoring replaces all Telemetry data with the backup’s, after saving your current data as a “before a restore” backup, then restarts Telemetry. Every file in a backup is checked before anything is replaced. Appearance, units and layout preferences are not part of backups.</p></section>`);
    q('#backup-now').onclick=()=>act('now',undefined,()=>'Backup made.');
    q('#backup-export').onclick=()=>act('export',undefined,r=>`Saved ${r.saved}.`);
    q('#backup-restore-file').onclick=()=>act('restoreFile',undefined,()=>'Restored. Telemetry is restarting…');
    q('#backup-open').onclick=()=>act('openFolder',undefined,()=>'');
    q('#backup-choose').onclick=()=>act('chooseFolder',undefined,r=>r.extraFolder?'Automatic backups will also be copied there.':'');
    q('#backup-clear').onclick=()=>act('clearFolder',undefined,()=>'Automatic backups are no longer copied to an extra folder.');
  }
  function route(page,sub){
    const show=page==='settings'&&sub==='backups',box=q('#settings-backups');if(!box)return;box.hidden=!show;
    if(show){q('#settings-appearance').hidden=true;q('#settings-calculations').hidden=true;refresh();}
  }
  return {init,route,refresh};
})();
