const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('paddock',Object.fromEntries(['read','discover','connect','disconnect','forget','sync','watch','rebuild','export','localLibraries','localConnect','localSync','localDisconnect','localForget','localRebuild'].map(name=>[name,(input)=>ipcRenderer.invoke('paddock:'+name,input)])));

contextBridge.exposeInMainWorld('manualLaps',Object.fromEntries(['read','save','delete','import','recover','export'].map(name=>[name,(input)=>ipcRenderer.invoke('manual-laps:'+name,input)])));
