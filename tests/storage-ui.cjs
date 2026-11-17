// Setup files and backups: migration from window storage, file-backed saving, Back up now, restore, damaged-file recovery.
const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const output=path.join(__dirname,'../test-results'),profile=path.join(output,'storage-ui-'+Date.now());fs.mkdirSync(profile,{recursive:true});app.setPath('userData',profile);app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
 const paddock=require('../src/paddock-ipc.cjs').registerPaddock(profile);let relaunched=0,answer=1,hold=null;
 // The restore question can be held open, to type while it is shown, and answered with Restore (1) or Cancel (0).
 const storage=require('../src/storage-ipc.cjs').registerStorage(profile,{schedule:false,relaunch:()=>{relaunched++;},confirm:async()=>{if(hold)await hold.promise;return answer;}});
 const holdRestore=()=>{let release;hold={promise:new Promise(r=>release=r)};return ()=>{hold=null;release();};};
 const make=preload=>new BrowserWindow({show:false,width:1440,height:1100,webPreferences:{...(preload?{preload:path.join(__dirname,'../src/preload.cjs')}:{}),sandbox:true,contextIsolation:true,nodeIntegration:false,backgroundThrottling:false,offscreen:true}});
 const errors=[];let win;
 const run=s=>win.webContents.executeJavaScript(s,true),pause=()=>new Promise(r=>setTimeout(r,160)),click=s=>run(`document.querySelector(${JSON.stringify(s)}).click()`);
 const wait=async(s,why=s)=>{for(let i=0;i<100;i++){if(await run(s))return;await pause();}throw Error('Timed out: '+why);};
 const file=name=>path.join(profile,name),read=name=>fs.existsSync(file(name))?fs.readFileSync(file(name),'utf8'):null;
 // A linked setup is updated by "Save setup"; "Save as copy" adds a new entry.
 const saveSetup=async(name,copy=false)=>{await run(`(()=>{const e=document.querySelector('[name=name]');e.value=${JSON.stringify(name)};e.dispatchEvent(new Event('input',{bubbles:true}));})()`);await click(copy?'#save-copy':'#save-library');await pause();await run(`document.querySelector('#library-entry-name').value=${JSON.stringify(name)}`);await click('#library-editor-confirm');await pause();};
 try{
  // 1. An older Telemetry: no file bridge, data in window storage.
  win=make(false);win.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message);});
  await win.loadFile(path.join(__dirname,'../renderer/index.html'));await pause();assert.equal(await run('DataStore.fileBacked'),false);
  await saveSetup('Saved before the update');assert.equal(read('setups-library-v1.json'),null);
  // 2. This version: the library moves into a file on first use; window storage keeps its copy as a safety net.
  // (Open the new window before closing the old one: closing the last window would start quitting.)
  const old=win;win=make(true);old.destroy();win.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message);});
  await win.loadFile(path.join(__dirname,'../renderer/index.html'));await pause();assert.equal(await run('DataStore.fileBacked'),true);
  assert.equal(await run('library.length'),1);assert.match(read('setups-library-v1.json'),/Saved before the update/);assert.ok(read('workbench-draft-v1.json'));
  await saveSetup('Saved after the update',true);assert.equal(await run('library.length'),2);assert.match(read('setups-library-v1.json'),/Saved after the update/);
  assert.doesNotMatch(await run("localStorage.getItem('slotforge.telemetry.library.v1')"),/Saved after the update/,'new saves go to the file');
  // 3. Back up now, change something, restore.
  await run("location.hash='settings/backups'");await wait("document.querySelector('#backup-summary').textContent.includes('Last automatic backup')");
  await click('#backup-now');await wait("document.querySelectorAll('[data-backup-restore]').length===1");assert.match(await run("document.querySelector('#backup-list').textContent"),/Made by you/);
  fs.writeFileSync(path.join(output,'storage-backups.png'),(await win.webContents.capturePage()).toPNG());
  await run("location.hash='library'");await pause();await saveSetup('Added after the backup',true);assert.equal(await run('library.length'),3);
  await run("location.hash='settings/backups'");await wait("document.querySelectorAll('[data-backup-restore]').length===1");
  await click('[data-backup-restore]');await wait("document.querySelector('#backup-message').textContent.includes('restarting')");await new Promise(r=>setTimeout(r,120));
  assert.equal(relaunched,1);assert.doesNotMatch(read('setups-library-v1.json'),/Added after the backup/);
  assert.ok(storage.backups.list().some(b=>b.kind==='before-restore'),'a safety backup was made');
  await win.loadFile(path.join(__dirname,'../renderer/index.html'));await pause();assert.equal(await run('library.length'),2);
  // 3b. Typing saves the draft shortly afterwards, and straight away when the page unloads.
  const typeName=v=>run(`(()=>{const e=document.querySelector('[name=name]');e.value=${JSON.stringify(v)};e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
  await run("location.hash='telemetry'");await pause();await typeName('Typed just before closing');
  await win.loadFile(path.join(__dirname,'../renderer/index.html'));await pause();
  assert.match(read('workbench-draft-v1.json'),/Typed just before closing/,'a pending draft is written on unload');assert.equal(await run("document.querySelector('[name=name]').value"),'Typed just before closing');
  // 3c. Typing while a restore is being confirmed never overwrites the restored draft; after Cancel it is kept.
  const restoreWhileTyping=async(text,choice)=>{
   answer=choice;const release=holdRestore();await run("location.hash='settings/backups'");await wait("document.querySelectorAll('[data-backup-restore]').length>0");
   await click('[data-backup-restore]');await pause();await typeName(text);await new Promise(r=>setTimeout(r,700));
   assert.doesNotMatch(read('workbench-draft-v1.json'),new RegExp(text),'no draft is written while a restore is open');
   release();await wait("!document.querySelector('[data-backup-restore]').disabled",'restore finished');await new Promise(r=>setTimeout(r,150));};
  await restoreWhileTyping('Typed during cancelled restore',0);assert.match(read('workbench-draft-v1.json'),/Typed during cancelled restore/,'edits are saved after Cancel');
  const before=relaunched;await restoreWhileTyping('Typed during restore',1);assert.equal(relaunched,before+1);
  assert.doesNotMatch(read('workbench-draft-v1.json'),/Typed during restore/,'the restored draft is not overwritten');
  await win.loadFile(path.join(__dirname,'../renderer/index.html'));await pause();assert.doesNotMatch(read('workbench-draft-v1.json'),/Typed during restore/,'nor on unload after the restore');
  answer=1;
  // 4. A damaged library file is never overwritten; the existing recovery tools still offer it.
  fs.writeFileSync(file('setups-library-v1.json'),'damaged-data');await win.loadFile(path.join(__dirname,'../renderer/index.html'));await pause();
  await run("location.hash='library'");await pause();assert.equal(await run("document.querySelector('#library-recover-export').hidden"),false);assert.equal(read('setups-library-v1.json'),'damaged-data');
  win.setSize(390,1000);await run("location.hash='settings/backups'");await pause();assert.equal(await run('document.documentElement.scrollWidth>innerWidth'),false);
  assert.deepEqual(errors,[]);console.log('Storage passed: migration from window storage, file-backed library and draft, Back up now, restore with safety backup, damaged-file recovery, narrow layout.');
 }finally{storage.dispose();paddock.disconnect();win?.destroy();app.quit();}
}).catch(e=>{console.error(e);app.exit(1);});
