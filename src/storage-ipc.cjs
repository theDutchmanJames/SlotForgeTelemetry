'use strict';
// Setup files and backups for the renderer. Only the app's own page may call these.
const {ipcMain,dialog,shell,app}=require('electron');
const path=require('node:path'),fs=require('node:fs'),{pathToFileURL}=require('node:url');
const {DataFiles}=require('./data-files.cjs'),{Backups}=require('./backups.cjs');
const page=()=>pathToFileURL(path.join(__dirname,'../renderer/index.html')).href;
const trusted=event=>event.senderFrame&&event.senderFrame===event.sender.mainFrame&&event.senderFrame.url.split('#')[0]===page();
function registerStorage(profile,{version='0.0.0',relaunch=()=>{const portable=process.env.PORTABLE_EXECUTABLE_FILE;app.relaunch(portable?{execPath:portable,args:[]}:undefined);app.exit(0);},schedule=true,confirm=null}={}){
 const files=new DataFiles(profile),backups=new Backups(profile,{version});
 // Synchronous on purpose: the library keeps its synchronous rules; files are small and local.
 for(const [name,fn] of Object.entries({get:k=>files.get(k),set:p=>files.set(p?.key,p?.text),remove:k=>files.remove(k)}))
  ipcMain.on('data:'+name,(event,input)=>{if(!trusted(event)){event.returnValue={ok:false,error:'Unsupported caller.'};return;}try{event.returnValue={ok:true,value:fn(input)};}catch(e){event.returnValue={ok:false,error:String(e.message).slice(0,500)};}});
 const ask=confirm||(async(options)=>(await dialog.showMessageBox(options)).response);
 const restore=async checked=>{
  const when=new Date(checked.createdAt).toLocaleString();
  const answer=await ask({type:'warning',title:'Restore this backup?',message:`Replace all Telemetry data with the backup from ${when}?`,detail:`It contains: ${checked.contents.map(c=>c.label).join(', ')||'nothing'}.\n\nYour current data is saved as a "before restore" backup first, so this can be undone. Telemetry restarts afterwards.`,buttons:['Cancel','Restore and restart'],defaultId:0,cancelId:0});
  if(answer!==1)return {cancelled:true};
  let result;try{result=backups.restore(checked);}catch(e){if(e.partial)setTimeout(relaunch,1500);throw e;}
  setTimeout(relaunch,50);return {restored:true,...result};
 };
 const handlers={
  status:()=>backups.status(),
  now:()=>{const r=backups.write(backups.dir,'manual','manual');return {...backups.status(),created:path.basename(r.file)};},
  export:async()=>{const r=await dialog.showSaveDialog({title:'Back up all Telemetry data',defaultPath:`SlotForge-Telemetry-backup-${new Date().toISOString().slice(0,10)}.json`,filters:[{name:'Telemetry backup',extensions:['json']}]});if(r.canceled)return {cancelled:true};fs.writeFileSync(r.filePath,backups.bundle('export').text);return {saved:path.basename(r.filePath)};},
  restoreSaved:name=>{if(!backups.list().some(b=>b.name===name))throw Error('That backup no longer exists.');return restore(backups.readFile(path.join(backups.dir,name)));},
  restoreFile:async()=>{const r=await dialog.showOpenDialog({title:'Restore a Telemetry backup',properties:['openFile'],filters:[{name:'Telemetry backup',extensions:['json']}]});if(r.canceled||!r.filePaths[0])return {cancelled:true};return restore(backups.readFile(r.filePaths[0]));},
  chooseFolder:async()=>{const r=await dialog.showOpenDialog({title:'Also copy automatic backups to…',properties:['openDirectory','createDirectory']});if(r.canceled||!r.filePaths[0])return backups.status();backups.settings.extraFolder=r.filePaths[0];backups.settings.lastHash=null;backups.saveSettings();backups.auto();return backups.status();},
  clearFolder:()=>{backups.settings.extraFolder=null;backups.settings.lastError='';backups.saveSettings();return backups.status();},
  openFolder:async()=>{fs.mkdirSync(backups.dir,{recursive:true});const error=await shell.openPath(backups.dir);if(error)throw Error(error);return true;}
 };
 for(const [name,fn] of Object.entries(handlers))ipcMain.handle('backups:'+name,async(event,input)=>{if(!trusted(event))return {ok:false,error:'Unsupported caller.'};try{return {ok:true,value:await fn(input)};}catch(e){return {ok:false,error:String(e.message).slice(0,1000)};}});
 // Automatic backups: shortly after start (captures the previous session), hourly with a 12-hour gap, and when quitting.
 const timers=[];
 if(schedule){timers.push(setTimeout(()=>backups.auto(),15000),setInterval(()=>backups.auto({minHours:12}),3600000));app.on('before-quit',()=>backups.auto());}
 return {files,backups,dispose(){timers.forEach(t=>clearTimeout(t));}};
}
module.exports={registerStorage};
