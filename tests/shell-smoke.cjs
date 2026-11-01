// Exercise the actual main process without accessing the user's application profile.
const {app,BrowserWindow}=require('electron');
const path=require('node:path'),fs=require('node:fs'),assert=require('node:assert/strict'),{spawn}=require('node:child_process');
const profile=path.join(__dirname,'../test-results/shell-app-data');fs.mkdirSync(profile,{recursive:true});
app.setPath('appData',profile);app.disableHardwareAcceleration();
app.on('browser-window-created',(_event,win)=>win.hide());
require('../src/main.cjs');
if(!process.argv.includes('--second')){
  const watchdog=setTimeout(()=>{console.error('Desktop shell check timed out');app.exit(1);},30000);
  app.whenReady().then(async()=>{
    try{
      const win=BrowserWindow.getAllWindows()[0];assert.ok(win);
      await new Promise((resolve,reject)=>{win.webContents.once('did-finish-load',resolve);win.webContents.once('did-fail-load',(_event,code,message)=>reject(Error(code+': '+message)));});
      const preferences=win.webContents.getLastWebPreferences();
      assert.equal(preferences.sandbox,true);assert.equal(preferences.contextIsolation,true);assert.equal(preferences.nodeIntegration,false);
      assert.ok(app.getPath('userData').startsWith(profile));
      assert.equal(await win.webContents.executeJavaScript('typeof require'),'undefined');
      assert.equal(await win.webContents.executeJavaScript('Notification.requestPermission()',true),'denied');
      await win.webContents.executeJavaScript("window.open('https://example.com');void 0;");
      assert.equal(BrowserWindow.getAllWindows().length,1);
      const exportPath=path.join(profile,'setup-export.json');
      const downloaded=new Promise((resolve,reject)=>win.webContents.session.once('will-download',(_event,item)=>{
        item.setSavePath(exportPath);item.once('done',(_e,status)=>status==='completed'?resolve():reject(Error(status)));
      }));
      await win.webContents.executeJavaScript("document.querySelector('#save-setup').click()");await downloaded;
      assert.equal(JSON.parse(fs.readFileSync(exportPath,'utf8')).format,'slotforge-calculator');
      const second=new Promise(resolve=>app.once('second-instance',resolve));
      const child=spawn(process.execPath,[__filename,'--second'],{windowsHide:true,stdio:'ignore'});
      const exit=new Promise((resolve,reject)=>{child.once('error',reject);child.once('exit',code=>code===0?resolve():reject(Error('Second process exit '+code)));});
      await Promise.all([second,exit]);assert.equal(BrowserWindow.getAllWindows().length,1);
      console.log('Desktop shell passed: isolated profile, sandbox, no Node access, denied permissions/windows, setup download, one app instance.');
      clearTimeout(watchdog);app.exit(0);
    }catch(error){console.error(error);clearTimeout(watchdog);app.exit(1);}
  });
}
