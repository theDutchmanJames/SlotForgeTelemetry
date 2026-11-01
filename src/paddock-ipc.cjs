const {ipcMain,dialog}=require('electron');
const {pathToFileURL}=require('node:url');
const path=require('node:path'),fs=require('node:fs');
const {PaddockClient}=require('./paddock-client.cjs');
const discovery=require('./paddock-discovery.cjs');
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
 return client;
}
module.exports={registerPaddock};
