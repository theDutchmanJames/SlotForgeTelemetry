const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('paddock',Object.fromEntries(['read','discover','connect','disconnect','forget','sync','watch','rebuild','export','localLibraries','localConnect','localSync','localDisconnect','localForget','localRebuild'].map(name=>[name,(input)=>ipcRenderer.invoke('paddock:'+name,input)])));

// Setup library and draft files: synchronous, so the library's save rules stay exactly as they were.
contextBridge.exposeInMainWorld('dataFiles',{get:key=>ipcRenderer.sendSync('data:get',key),set:(key,text)=>ipcRenderer.sendSync('data:set',{key,text}),remove:key=>ipcRenderer.sendSync('data:remove',key)});
contextBridge.exposeInMainWorld('backups',Object.fromEntries(['status','now','export','restoreSaved','restoreFile','chooseFolder','clearFolder','openFolder'].map(name=>[name,(input)=>ipcRenderer.invoke('backups:'+name,input)])));

contextBridge.exposeInMainWorld('updates',{...Object.fromEntries(['status','check','enable','skip','open'].map(name=>[name,(input)=>ipcRenderer.invoke('updates:'+name,input)])),
  onChange:callback=>{const handler=()=>callback();ipcRenderer.on('updates:changed',handler);return ()=>ipcRenderer.removeListener('updates:changed',handler);}});

contextBridge.exposeInMainWorld('garage',Object.fromEntries(['read','saveCar','saveTrack','remove','photo','reset'].map(name=>[name,(input)=>ipcRenderer.invoke('garage:'+name,input)])));

contextBridge.exposeInMainWorld('manualLaps',Object.fromEntries(['read','save','delete','import','recover','export'].map(name=>[name,(input)=>ipcRenderer.invoke('manual-laps:'+name,input)])));
