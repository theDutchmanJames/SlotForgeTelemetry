const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('paddock',Object.fromEntries(['read','discover','connect','disconnect','sync','watch','rebuild','export'].map(name=>[name,(input)=>ipcRenderer.invoke('paddock:'+name,input)])));
