// Updates: a newer release opens the update window (What's new, Skip, and Download into Downloads), Settings → Updates,
// Check now, the check at start switched off, and an up-to-date answer. Same as SlotForge Circuit's interface test.
// GitHub is replaced by a local answer and the folder/browser by lists, so nothing leaves this computer.
const electron=require('electron'),{app,BrowserWindow}=electron,fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const output=path.join(__dirname,'../test-results'),profile=path.join(output,'updates-ui-'+Date.now());fs.mkdirSync(profile,{recursive:true});app.setPath('userData',profile);app.disableHardwareAcceleration();
const opened=[],shown=[];electron.shell.openExternal=async url=>{opened.push(url);};electron.shell.showItemInFolder=file=>{shown.push(file);};
app.whenReady().then(async()=>{
 require('../src/storage-ipc.cjs').registerStorage(profile,{schedule:false});const paddock=require('../src/paddock-ipc.cjs').registerPaddock(profile);
 const folder=fs.mkdtempSync(path.join(os.tmpdir(),'telemetry-downloads-')),bytes=Buffer.from('a pretend installer');
 let tag='v0.15.0',requests=0,attached=true;
 const name=()=>`SlotForgeTelemetry-${tag.slice(1)}-Setup-x64.exe`;
 const fetch=async(url,init)=>{
  assert.match(init.headers['User-Agent'],/^SlotForge-Telemetry\/0\.14\.0$/);
  if(url.includes('/releases/download/')){
   assert.equal(url,`https://github.com/theDutchmanJames/SlotForgeTelemetry/releases/download/${tag}/${name()}`,'the address is built, never taken from the answer');
   return {ok:true,status:200,body:{getReader:()=>{const parts=[bytes];return {read:async()=>(parts.length?{done:false,value:parts.shift()}:{done:true})};}}};
  }
  requests++;assert.equal(url,'https://api.github.com/repos/theDutchmanJames/SlotForgeTelemetry/releases/latest');
  return {ok:true,status:200,headers:{get:()=>null},text:async()=>JSON.stringify({tag_name:tag,draft:false,prerelease:false,published_at:'2026-11-20T10:00:00Z',html_url:'https://evil.example/',
   body:"Intro.\n\n## What's new\n\n- **New look:** calmer pages and a slim top bar.\n- **Gear chart:** always shows your gearing.\n\n## Verification\n\n- 249 unit tests",
   assets:attached?[{name:name(),size:bytes.length,browser_download_url:'https://evil.example/x.exe',digest:'sha256:'+crypto.createHash('sha256').update(bytes).digest('hex')}]:[]})};
 };
 const {updates:u,dispose}=require('../src/update-ipc.cjs').registerUpdates(profile,{current:'0.14.0',homepage:require('../package.json').homepage,fetch,downloads:folder,edition:{platform:'win32',arch:'x64'},automatic:true,startDelay:24*3600*1000});
 const win=new BrowserWindow({show:false,width:1440,height:1000,webPreferences:{preload:path.join(__dirname,'../src/preload.cjs'),sandbox:true,contextIsolation:true,nodeIntegration:false,backgroundThrottling:false,offscreen:true}}),errors=[];
 win.webContents.on('console-message',e=>{if(e.level==='error'){errors.push(e.message);console.error(e.message);}});
 const run=s=>win.webContents.executeJavaScript(s,true),pause=(ms=160)=>new Promise(r=>setTimeout(r,ms)),click=s=>run(`document.querySelector(${JSON.stringify(s)}).click()`);
 const text=s=>run(`document.querySelector(${JSON.stringify(s)})?.textContent||''`);
 const wait=async(s,why=s)=>{for(let i=0;i<60;i++){if(await run(s))return;await pause();}throw Error('Timed out: '+why);};
 const shot=async n=>{await pause(250);fs.writeFileSync(path.join(output,'updates-'+n+'.png'),(await win.webContents.capturePage()).toPNG());};
 const isOpen="!!document.getElementById('update-dialog')?.open";
 const dialog=()=>run(`(()=>{const d=document.getElementById('update-dialog');return d&&{open:d.open,title:d.querySelector('h2')?.textContent,news:d.querySelector('.update-news')?.textContent,text:d.textContent,buttons:[...d.querySelectorAll('.dialog-actions button')].map(b=>b.textContent)};})()`);
 const reload=async hash=>{await win.loadFile(path.join(__dirname,'../renderer/index.html'));await pause(300);if(hash)await run(`location.hash=${JSON.stringify(hash)}`);await pause();};
 try{
  await reload();
  assert.equal(requests,0,'opening the app does not check by itself here');assert.equal(await run(isOpen),false);
  assert.equal(await run("!!document.querySelector('.workspace-bar,.update-notice')"),false,'no old notice line under the menu');
  // At start: the check opens the window by itself (startupCheck is off in automated runs, so the test calls check()).
  await u.check();await wait(isOpen,'the update window');
  let d=await dialog();
  assert.equal(d.title,'Telemetry 0.15.0');
  assert.match(d.news,/New look: calmer pages and a slim top bar\./);assert.match(d.news,/Gear chart: always shows your gearing\./);assert.doesNotMatch(d.news,/unit tests/,'the technical section stays out');
  assert.match(d.text,/You have version 0\.14\.0/);assert.match(d.text,/Windows · installer/);assert.match(d.text,/SlotForgeTelemetry-0\.15\.0-Setup-x64\.exe/);
  assert.doesNotMatch(d.text,/null|undefined/,'no stray words');
  assert.deepEqual(d.buttons,['Skip this version','Download']);
  await shot('window-dark');
  await click('[data-tone-choice=light]');await shot('window-light');await click('[data-tone-choice=dark]');
  // Download: saved in Downloads and checked; Show in folder reveals it, nothing is run or opened.
  await click('#update-download');await wait("!!document.getElementById('update-show')",'the finished download');
  assert.ok(fs.readFileSync(path.join(folder,name())).equals(bytes),'the downloaded file is the release file');
  assert.equal(fs.existsSync(path.join(folder,name()+'.part')),false,'no part file left');
  d=await dialog();assert.match(d.text,/Saved in Downloads/);assert.match(d.text,/Close Telemetry, then open the installer/);assert.match(d.text,/your setups, laps, cars and backups stay where they are/);
  await shot('saved');
  await click('#update-show');for(let i=0;i<20&&!shown.length;i++)await pause();assert.deepEqual(shown,[path.join(folder,name())]);assert.deepEqual(opened,[],'nothing is opened');
  await run("document.getElementById('update-dialog').close()");
  // Closed: it stays away for this session. Settings → Updates shows the new version (a restart forgets the finished download).
  u.download={state:'idle'};await reload('settings/updates');
  await wait("!document.querySelector('#settings-updates').hidden");assert.equal(await run("document.querySelector('#settings-appearance').hidden"),true);
  assert.match(await text('#settings-updates .update-card'),/This version.*0\.14\.0/);assert.match(await text('#settings-updates .update-card'),/Version 0\.15\.0 is available/);
  assert.equal(await text('[data-rail-status=updates]'),'0.15.0 is available');
  await shot('settings');
  // Check now shows the window again; Skip keeps it away until a newer version.
  await click('#update-check-now');await wait(isOpen,'the window from Check now');
  await click('#update-skip');await wait(`!${isOpen}`,'the window to close after Skip');
  await reload('settings/updates');await u.check();await pause(600);assert.equal(await run(isOpen),false,'a skipped version came back');
  assert.equal(await run("!!document.getElementById('update-open-dialog')"),true,'Settings still offers the skipped version');
  tag='v0.15.1';await u.check();await wait(`${isOpen}&&/0\\.15\\.1/.test(document.querySelector('#update-dialog h2').textContent)`,'the window for the newer version');
  await run("document.getElementById('update-dialog').close()");
  // Without this copy's file attached yet, nothing opens by itself; the release page is offered instead of Download.
  tag='v0.15.2';attached=false;await u.check();await reload();await pause(600);assert.equal(await run(isOpen),false,'waits for this copy’s file');
  await run("location.hash='settings/updates'");await pause();await click('#update-open-dialog');await wait(isOpen);
  assert.deepEqual((await dialog()).buttons,['Skip this version','Open release page']);await click('#update-open');for(let i=0;i<20&&!opened.length;i++)await pause();
  assert.deepEqual(opened,['https://github.com/theDutchmanJames/SlotForgeTelemetry/releases/tag/v0.15.2'],'opens this app’s release page, never the address in the answer');
  await run("document.getElementById('update-dialog').close()");attached=true;
  // The check at start switched off; Check now still works.
  await click('#update-toggle');await wait("!document.getElementById('update-toggle').checked");assert.equal(u.status().enabled,false);
  assert.equal(await u.startupCheck(),null,'no check at start when off');
  const before=requests;await click('#update-check-now');await wait(isOpen);assert.equal(requests,before+1);await run("document.getElementById('update-dialog').close()");
  // Up to date.
  tag='v0.14.0';await click('#update-check-now');await wait("document.querySelector('#settings-updates .update-card').textContent.includes('You have the latest version')");
  assert.equal(await text('[data-rail-status=updates]'),'0.14.0 · up to date');
  await shot('settings-wide');
  win.setSize(390,1000);await pause();assert.equal(await run('document.documentElement.scrollWidth>innerWidth'),false);await shot('settings-narrow');
  assert.deepEqual(errors,[]);console.log('Updates passed: the window at start, What’s new without the technical part, the kind of copy, Download into Downloads with a checked file, Show in folder, Settings → Updates, Check now, Skip until a newer version, waiting for this copy’s file, release page address, check at start off, up to date, light/dark and narrow layouts.');
 }finally{dispose();paddock.disconnect();win.destroy();fs.rmSync(folder,{recursive:true,force:true});app.quit();}
}).catch(e=>{console.error(e);app.exit(1);});
