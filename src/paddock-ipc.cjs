const {ipcMain,dialog}=require('electron');
const {pathToFileURL}=require('node:url');
const path=require('node:path'),fs=require('node:fs');
const {PaddockClient}=require('./paddock-client.cjs');
const discovery=require('./paddock-discovery.cjs');
const {ManualLapsStore,readBackup}=require('./manual-laps-store.cjs');
function registerPaddock(profile){
 const client=new PaddockClient(path.join(profile,'paddock-results-v1.json'));let scanning=null;
 const handlers={read:()=>client.view(),discover:()=>scanning||(scanning=discovery.scan({duration:3000}).finally(()=>scanning=null)),connect:p=>client.connect(p),disconnect:()=>client.disconnect(),sync:()=>client.sync(),watch:()=>client.watch(),
  rebuild:async()=>{const answer=await dialog.showMessageBox({type:'warning',title:'Rebuild unreadable race-result cache?',message:'Archive the unreadable cache and start a fresh race-result library?',detail:'The original file will be kept beside the cache. Saved calculator setups are unaffected. Reconnect and import from Paddock afterwards.',buttons:['Cancel','Archive and rebuild'],defaultId:0,cancelId:0});return answer.response===1?client.rebuild():client.view();},
  export:async()=>{if(client.loadError)throw Error(client.loadError);const result=await dialog.showSaveDialog({title:'Export imported race results',defaultPath:'SlotForge-race-results.json',filters:[{name:'JSON',extensions:['json']}]});if(result.canceled)return {cancelled:true};fs.writeFileSync(result.filePath,JSON.stringify({format:'slotforge-telemetry-results',version:1,exportedAt:new Date().toISOString(),...client.data},null,2));return {saved:true};}
 };
 for(const [name,fn]of Object.entries(handlers))ipcMain.handle('paddock:'+name,async(event,input)=>{
  if(!event.senderFrame||event.senderFrame!==event.sender.mainFrame||event.senderFrame.url.split('#')[0]!==pathToFileURL(path.join(__dirname,'../renderer/index.html')).href)return {ok:false,error:'Unsupported caller.'};
  try{return {ok:true,value:await fn(input)};}catch(e){return {ok:false,connection:client.view().connection,error:e.name==='AbortError'||e.name==='TimeoutError'?'Connection cancelled or timed out. Existing imports are unchanged.':String(e.message).slice(0,2000)};}
 });
 const manual=new ManualLapsStore(path.join(profile,'manual-laps-v1.json'));
 const manualHandlers={read:()=>manual.view(),save:p=>manual.save(p),delete:p=>manual.delete(p),import:p=>manual.importBackup(p),recover:async p=>{readBackup(p);if(!manual.error)throw Error('The library is readable. Use Restore backup to merge sessions.');const answer=await dialog.showMessageBox({type:'warning',title:'Recover manual lap library?',message:'Archive the unreadable library and restore this backup?',detail:'The unreadable original will be kept beside the library. Only sessions in the selected backup will be restored. Paddock imports and calculator setups are unaffected.',buttons:['Cancel','Archive and restore'],defaultId:0,cancelId:0});return answer.response===1?manual.recoverBackup(p):{cancelled:true};},export:async()=>{const result=await dialog.showSaveDialog({title:'Export manual lap library',defaultPath:manual.error?'SlotForge-manual-laps-unreadable.json':'SlotForge-manual-laps.json',filters:[{name:'JSON',extensions:['json']}]});if(result.canceled)return {cancelled:true};if(manual.error)fs.copyFileSync(manual.file,result.filePath);else fs.writeFileSync(result.filePath,JSON.stringify(manual.data,null,2));return {saved:true};}};
 for(const [name,fn]of Object.entries(manualHandlers))ipcMain.handle('manual-laps:'+name,async(event,input)=>{
  if(!event.senderFrame||event.senderFrame!==event.sender.mainFrame||event.senderFrame.url.split('#')[0]!==pathToFileURL(path.join(__dirname,'../renderer/index.html')).href)return {ok:false,error:'Unsupported caller.'};
  try{return {ok:true,value:await fn(input)};}catch(error){return {ok:false,error:String(error.message).slice(0,2000)};}
 });
 return client;
}
module.exports={registerPaddock};
