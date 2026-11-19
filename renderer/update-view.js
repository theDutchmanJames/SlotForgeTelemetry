// Settings → Updates in Telemetry's Settings sheet. The rows and the update window come from the shared
// SlotForge update-ui.js (the same file as in Circuit): Telemetry checks once when it starts and, when a newer
// version is out, a window shows What's new with Skip this version and Download. Download saves the file for this
// copy in Downloads; people install it themselves. This file only gives it a page: the title, the side-list link
// and its status line. The browser edition has no update check, so the page says so.
const UpdatesUI=(()=>{
  const q=s=>document.querySelector(s),desktop=window.slotforgeDesktop;
  async function status(){
    if(!desktop?.updateCheck)return;
    try{const r=await desktop.updateCheck('status');const s=r?.value;if(!s)return;
      SettingsUI.status('updates',s.latest?`${s.latest.version} is available`:`${s.current}${s.upToDate?' · up to date':''}`);
    }catch{/* The status line is optional. */}
  }
  function init(){
    q('.settings-nav').insertAdjacentHTML('beforeend','<a href="#settings/updates">Updates</a>');
    q('#settings-appearance').parentElement.insertAdjacentHTML('beforeend',`<section class="panel" id="settings-updates" hidden>${SettingsUI.head('updates','Updates','Telemetry looks for a new version when it starts and shows what is new. It downloads only when you ask, and never installs anything by itself.')}</section>`);
    const box=q('#settings-updates');
    if(!desktop?.updateCheck){box.insertAdjacentHTML('beforeend','<p class="ss-note">Update checks are available in the desktop app.</p>');return;}
    UpdateUI.start({settings:box,say:message=>toast(message),appName:'Telemetry',keeps:'your setups, laps, cars and backups stay where they are'});
    desktop.onUpdateChange?.(status);status();
  }
  function route(page,sub){
    const show=page==='settings'&&sub==='updates',box=q('#settings-updates');if(!box)return;box.hidden=!show;
    if(show){q('#settings-appearance').hidden=true;q('#settings-calculations').hidden=true;status();}
  }
  return {init,route,status};
})();
