'use strict';
// "A new version is available" for the renderer. Only the app's own page may call these.
const {ipcMain,shell,BrowserWindow}=require('electron');
const path=require('node:path'),{pathToFileURL}=require('node:url');
const {UpdateCheck}=require('./update-check.cjs');
const page=()=>pathToFileURL(path.join(__dirname,'../renderer/index.html')).href;
const trusted=event=>event.senderFrame&&event.senderFrame===event.sender.mainFrame&&event.senderFrame.url.split('#')[0]===page();
const ACTIONS=['status','check','enable','skip','open'];
/**
 * Installed and portable apps check by themselves: 15 seconds after start-up, then the hourly
 * tick checks at most every 12 hours. Development copies and tests only check on "Check now".
 */
function registerUpdates(profile,{current,homepage,fetch,automatic=false,schedule=automatic}){
 const updates=new UpdateCheck({profile,current,homepage,fetch,automatic,
  onChange:()=>{for(const win of BrowserWindow.getAllWindows())if(!win.isDestroyed())win.webContents.send('updates:changed');}});
 const run={status:()=>updates.status(),check:()=>updates.check(),enable:p=>updates.setEnabled(p?.enabled),skip:p=>updates.skip(p?.version),
  open:async()=>{await shell.openExternal(updates.releaseUrl());return {opened:true};}};
 for(const name of ACTIONS)ipcMain.handle('updates:'+name,async(event,input)=>{if(!trusted(event))return {ok:false,error:'Unsupported caller.'};try{return {ok:true,value:await run[name](input)};}catch(e){return {ok:false,error:String(e.message).slice(0,500),code:e.code};}});
 let timer=null;
 if(schedule){timer=setTimeout(()=>{void updates.tick();timer=setInterval(()=>void updates.tick(),60*60*1000);timer.unref?.();},15000);timer.unref?.();}
 return {updates,dispose(){clearTimeout(timer);clearInterval(timer);updates.stop();for(const name of ACTIONS)ipcMain.removeHandler('updates:'+name);}};
}
module.exports={registerUpdates};
