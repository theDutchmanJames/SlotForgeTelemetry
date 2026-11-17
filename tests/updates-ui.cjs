// Updates: the top-bar notice, Download, Not now, Settings → Updates and turning automatic checks off.
// GitHub is replaced by a local answer and the browser by a list, so nothing leaves this computer.
const electron=require('electron'),{app,BrowserWindow}=electron,fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const output=path.join(__dirname,'../test-results'),profile=path.join(output,'updates-ui-'+Date.now());fs.mkdirSync(profile,{recursive:true});app.setPath('userData',profile);app.disableHardwareAcceleration();
const opened=[];electron.shell.openExternal=async url=>{opened.push(url);};
app.whenReady().then(async()=>{
 require('../src/storage-ipc.cjs').registerStorage(profile,{schedule:false});const paddock=require('../src/paddock-ipc.cjs').registerPaddock(profile);
 let tag='v0.14.0',requests=0;
 const fetch=async(url,init)=>{requests++;assert.equal(url,'https://api.github.com/repos/theDutchmanJames/SlotForgeTelemetry/releases/latest');assert.match(init.headers['User-Agent'],/^SlotForge-Telemetry\/0\.13\.0$/);
  return {ok:true,status:200,headers:{get:()=>null},text:async()=>JSON.stringify({tag_name:tag,published_at:'2026-01-01T00:00:00Z',draft:false,prerelease:false,html_url:'https://evil.example/'})};};
 const {updates,dispose}=require('../src/update-ipc.cjs').registerUpdates(profile,{current:'0.13.0',homepage:require('../package.json').homepage,fetch,automatic:true,schedule:false});
 const win=new BrowserWindow({show:false,width:1440,height:1000,webPreferences:{preload:path.join(__dirname,'../src/preload.cjs'),sandbox:true,contextIsolation:true,nodeIntegration:false,backgroundThrottling:false,offscreen:true}}),errors=[];
 win.webContents.on('console-message',e=>{if(e.level==='error'){errors.push(e.message);console.error(e.message);}});
 const run=s=>win.webContents.executeJavaScript(s,true),pause=()=>new Promise(r=>setTimeout(r,160)),click=s=>run(`document.querySelector(${JSON.stringify(s)}).click()`);
 const text=s=>run(`document.querySelector(${JSON.stringify(s)})?.textContent||''`);
 const wait=async(s,why=s)=>{for(let i=0;i<60;i++){if(await run(s))return;await pause();}throw Error('Timed out: '+why);};
 const shot=async name=>{await pause();fs.writeFileSync(path.join(output,'updates-'+name+'.png'),(await win.webContents.capturePage()).toPNG());};
 try{
  await win.loadFile(path.join(__dirname,'../renderer/index.html'));await pause();
  assert.equal(await run("!!document.querySelector('.update-notice')"),false,'no notice before a check');assert.equal(requests,0,'opening the app does not check by itself here');
  // The automatic check (as the hourly tick does) finds 0.14.0: the notice appears without a reload.
  await updates.tick();await wait("!!document.querySelector('.update-notice')",'notice');
  assert.match(await text('.update-notice'),/Telemetry 0\.14\.0 is available/);await shot('notice');
  await click('[data-update=open]');for(let i=0;i<30&&!opened.length;i++)await pause();
  assert.deepEqual(opened,['https://github.com/theDutchmanJames/SlotForgeTelemetry/releases/tag/v0.14.0'],'opens this app’s release page, never the address in the answer');
  // Settings → Updates.
  await run("location.hash='settings/updates'");await wait("!document.querySelector('#settings-updates').hidden");
  assert.equal(await run("document.querySelector('#settings-appearance').hidden"),true);
  assert.match(await text('#update-facts'),/This version0\.13\.0/);assert.match(await text('#update-facts'),/Version 0\.14\.0 is available/);
  assert.match(await text('#update-download'),/Download 0\.14\.0/);assert.match(await text('#update-summary'),/twice a day at most/);
  await shot('settings');
  // Not now: hidden until a newer version, still offered in Settings.
  await click('[data-update=skip]');await wait("!document.querySelector('.update-notice')",'notice hidden');
  assert.equal(await run("document.querySelector('#update-download').hidden"),false);
  await win.loadFile(path.join(__dirname,'../renderer/index.html'));await pause();await wait("UpdatesUI.state!==null");assert.equal(await run("!!document.querySelector('.update-notice')"),false,'Not now survives a restart');
  tag='v0.15.0';await run("location.hash='settings/updates'");await pause();await click('#update-check');await wait("!!document.querySelector('.update-notice')",'newer version shows again');
  assert.match(await text('.update-notice'),/0\.15\.0/);
  // Turning automatic checks off hides the notice and stops the timer checks; Check now still works.
  await click('#update-toggle');await wait("!document.querySelector('.update-notice')");assert.match(await text('#update-summary'),/^Off:/);
  const before=requests;await updates.tick();assert.equal(requests,before,'no automatic check when off');
  await click('#update-check');await wait(`document.querySelector('#update-facts').textContent.includes('0.15.0')`);assert.equal(requests,before+1);
  // Up to date.
  tag='v0.13.0';await click('#update-check');await wait("document.querySelector('#update-facts').textContent.includes('You have the latest version')");
  assert.equal(await run("document.querySelector('#update-download').hidden"),true);
  win.setSize(390,1000);await pause();assert.equal(await run('document.documentElement.scrollWidth>innerWidth'),false);
  assert.deepEqual(errors,[]);console.log('Updates passed: automatic check notice, Download opens only this app’s release page, Settings → Updates, Not now across restarts, newer version reappears, automatic checks off, Check now, up to date, narrow layout.');
 }finally{dispose();paddock.disconnect();win.destroy();app.quit();}
}).catch(e=>{console.error(e);app.exit(1);});
