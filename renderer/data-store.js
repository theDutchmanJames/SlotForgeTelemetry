// Where the setup library, active setup and workbench draft live.
// Desktop app: plain files in Telemetry's profile (backed up with everything else).
// Browser preview or older test harness without the bridge: the window's localStorage, as before.
const DataStore=(()=>{
  const FILES={'slotforge.telemetry.library.v1':'library','slotforge.telemetry.library.active.v1':'active','slotforge.calculator.workspace.v1':'workspace'};
  const bridge=typeof window!=='undefined'&&window.dataFiles?window.dataFiles:null;
  let migrated=false;
  function call(name,...args){const r=bridge[name](...args);if(!r?.ok){const e=Error(r?.error||'Could not use the data file.');e.name='DataFileError';throw e;}return r.value;}
  // One-time copy from localStorage. Copied as-is (even unreadable data, so recovery can still offer it);
  // the localStorage copy is left in place as a safety net for older Telemetry versions.
  function migrate(){
    if(migrated||!bridge)return;migrated=true;
    for(const [key,file] of Object.entries(FILES)){try{if(call('get',file)===null){const old=localStorage.getItem(key);if(old!==null)call('set',file,old);}}catch{/* Reported on first real use. */}}
  }
  return {
    fileBacked:!!bridge,
    getItem(key){if(!bridge||!FILES[key])return localStorage.getItem(key);migrate();return call('get',FILES[key]);},
    setItem(key,value){if(!bridge||!FILES[key])return localStorage.setItem(key,value);migrate();call('set',FILES[key],String(value));},
    removeItem(key){if(!bridge||!FILES[key])return localStorage.removeItem(key);migrate();call('remove',FILES[key]);}
  };
})();
