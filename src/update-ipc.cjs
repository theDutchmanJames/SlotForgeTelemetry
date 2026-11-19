'use strict';
// "A new version is available": the main-process side of the shared SlotForge update check (see
// docs/update-check-handoff.md in SlotForge Circuit). Telemetry asks GitHub once, about 5 seconds after
// it starts; when there is a newer version the page opens a window with What's new, Skip and Download.
// Download saves the file for this copy in Downloads and checks it; Telemetry never runs or opens it.
const {ipcMain,shell,BrowserWindow}=require('electron');
const path=require('node:path'),{pathToFileURL}=require('node:url');
const {UpdateCheck}=require('./update-check.cjs');
// Only the app's own page may ask (it is a file:// page, so its address is compared, not an origin).
const page=()=>pathToFileURL(path.join(__dirname,'../renderer/index.html')).href;
const trusted=event=>!!event.senderFrame&&event.senderFrame===event.sender.mainFrame&&String(event.senderFrame.url||'').split('#')[0]===page();

/**
 * @param {string} profile   userData folder (update-check.json lives there).
 * @param {object} o         current, homepage, fetch, downloads, edition, automatic (check at start), startDelay.
 */
function registerUpdates(profile,{current,homepage,fetch,downloads,edition,automatic=false,startDelay=5000}){
 const updates=new UpdateCheck({profile,current,homepage,fetch,downloads,edition,automatic,
  appName:'Telemetry',artifactPrefix:'SlotForgeTelemetry',userAgent:'SlotForge-Telemetry',
  onChange:()=>{for(const win of BrowserWindow.getAllWindows())if(!win.isDestroyed())win.webContents.send('update:changed');}});
 // Once, at start. No timer after that: the next check is at the next start.
 const timer=automatic?setTimeout(()=>void updates.startupCheck(),startDelay):null;timer?.unref?.();
 ipcMain.handle('update:action',async(event,action,payload)=>{
  if(!trusted(event))return {error:'Unknown page.'};
  try{
   if(action==='status')return {ok:true,value:updates.status()};
   if(action==='check')return {ok:true,value:await updates.check()};
   if(action==='enable')return {ok:true,value:updates.setEnabled(payload?.enabled)};
   if(action==='skip')return {ok:true,value:updates.skip(payload?.version)};
   if(action==='download'){
    // Not awaited: progress and the result reach the window through update:changed.
    updates.startDownload().catch(()=>{});
    return {ok:true,value:updates.status()};
   }
   if(action==='cancel')return {ok:true,value:updates.cancelDownload()};
   if(action==='show'){shell.showItemInFolder(updates.downloadedFile());return {ok:true,value:{shown:true}};}
   if(action==='open'){await shell.openExternal(updates.releaseUrl());return {ok:true,value:{opened:true}};}
   throw Error('Unknown update action.');
  }catch(e){return {error:String(e.message).slice(0,500),code:e.code};}
 });
 return {updates,dispose(){clearTimeout(timer);updates.stop();ipcMain.removeHandler('update:action');}};
}
module.exports={registerUpdates};
