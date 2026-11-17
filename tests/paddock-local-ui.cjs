// Desktop flow for "Paddock on this computer": real preload/IPC bridge, real private-folder discovery,
// a stand-in shared-history host serving Paddock's own fixtures, and an isolated profile.
const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const output=path.join(__dirname,'../test-results'),profile=path.join(output,'paddock-local-ui-'+Date.now());fs.mkdirSync(profile,{recursive:true});app.setPath('userData',profile);app.disableHardwareAcceleration();
const {createHost,read}=require('./support/shared-history-host.cjs');
// Paddock publishes descriptors only in a folder private to this user; make the test folder private the same way.
function privateFolder(folder){
 fs.mkdirSync(folder,{recursive:true,mode:0o700});
 if(process.platform!=='win32'){fs.chmodSync(folder,0o700);return;}
 const script=`$ErrorActionPreference='Stop';$ProgressPreference='SilentlyContinue';$d=$env:TEST_DIR;$sid=[Security.Principal.WindowsIdentity]::GetCurrent().User;$acl=New-Object Security.AccessControl.DirectorySecurity;$acl.SetOwner($sid);$acl.SetAccessRuleProtection($true,$false);$acl.AddAccessRule((New-Object Security.AccessControl.FileSystemAccessRule($sid,'FullControl','ContainerInherit,ObjectInherit','None','Allow')));[IO.Directory]::SetAccessControl($d,$acl)`;
 execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-EncodedCommand',Buffer.from(script,'utf16le').toString('base64')],{env:{...process.env,TEST_DIR:folder},windowsHide:true,stdio:'ignore'});
}
app.whenReady().then(async()=>{
 const host=await createHost(),folder=path.join(profile,'discovery');privateFolder(folder);
 fs.writeFileSync(path.join(folder,'d'.repeat(64)+'.json'),JSON.stringify(host.descriptor()),{mode:0o600});
 const paddock=require('../src/paddock-ipc.cjs').registerPaddock(profile,{localFolder:folder});
 const win=new BrowserWindow({show:false,width:1280,height:1100,webPreferences:{preload:path.join(__dirname,'../src/preload.cjs'),sandbox:true,contextIsolation:true,nodeIntegration:false,backgroundThrottling:false,offscreen:true}}),errors=[];
 win.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message);});
 const run=s=>win.webContents.executeJavaScript(s,true),pause=()=>new Promise(r=>setTimeout(r,80)),route=async h=>{await run(`location.hash=${JSON.stringify(h)};void 0`);await pause();};
 const wait=async s=>{for(let i=0;i<150;i++){if(await run(s))return;await pause();}throw Error('Timed out: '+s+' · message: '+await run("document.querySelector('#paddock-local-message')?.textContent"));};
 const raceName=read('history-create').bundle.race.name;
 try{
  await win.loadFile(path.join(__dirname,'../renderer/index.html'));await pause();
  await route('settings/paddock');assert.equal(await run("document.querySelector('#paddock-local').offsetParent!==null"),true);
  assert.match(await run("document.querySelector('#paddock-local-message').textContent"),/Not connected/);
  await run("document.querySelector('#paddock-local-connect').click()");
  await wait("document.querySelector('#paddock-local-message').textContent.includes('Races up to date')");
  assert.match(await run("document.querySelector('#paddock-local-message').textContent"),/2 session\(s\), 2 new or changed/);
  assert.match(await run("document.querySelector('#paddock-global-status').textContent"),/Paddock on this computer · Home collection/);
  assert.equal(await run("document.querySelector('#paddock-local-connect').hidden"),true);
  // The Shared-library race is now analysable like any other.
  await route('analyze/races');
  assert.ok(await run(`[...document.querySelectorAll('#race-run option')].some(o=>o.textContent.includes(${JSON.stringify(raceName)}))`),'history-v1 race listed in Lap analysis');
  // "Example prototype" only raced in the history-v1 session; records combine both formats per car/track/lane.
  await route('analyze/records');assert.match(await run("document.querySelector('#race-record-table').textContent"),/Example prototype/);
  assert.match(await run("document.querySelector('#race-connection-status').textContent"),/Paddock on this computer/);
  assert.equal(await run("document.querySelector('#race-analysis [data-race-sync]').disabled"),false,'Refresh works without a network connection');
  const before=host.s.requests.length;await run("document.querySelector('#race-analysis [data-race-sync]').click()");await wait("document.querySelector('#toast').textContent.includes('Races up to date')");assert.ok(host.s.requests.length>before);
  fs.writeFileSync(path.join(output,'paddock-local-records.png'),(await win.webContents.capturePage()).toPNG());
  // Reopening Telemetry reconnects and refreshes by itself.
  await win.loadFile(path.join(__dirname,'../renderer/index.html'));await pause();
  await wait("document.querySelector('#paddock-global-status').textContent.includes('Paddock on this computer')");
  await route('settings/paddock');await wait("!document.querySelector('#paddock-local-sync').disabled");
  await run("document.querySelector('#paddock-local-disconnect').click()");await wait("document.querySelector('#paddock-local-message').textContent.includes('Disconnected')");
  await route('analyze/races');assert.ok(await run(`[...document.querySelectorAll('#race-run option')].some(o=>o.textContent.includes(${JSON.stringify(raceName)}))`),'imported races stay available offline');
  // No credential reaches the renderer or the profile.
  assert.equal(await run(`document.documentElement.outerHTML.includes(${JSON.stringify(host.s.token)})`),false);
  for(const f of fs.readdirSync(profile).filter(n=>n.endsWith('.json')))assert.equal(fs.readFileSync(path.join(profile,f),'utf8').includes(host.s.token),false,f);
  win.setSize(390,1000);await route('settings/paddock');await pause();assert.equal(await run('document.documentElement.scrollWidth>innerWidth'),false);
  assert.deepEqual(errors,[]);console.log('Paddock on this computer: discovery, one-click import of both formats, records, automatic reconnect, disconnect, offline races and no credential exposure passed.');
 }finally{paddock.disconnect();host.close();win.destroy();app.quit();}
}).catch(e=>{console.error(e);app.exit(1);});
