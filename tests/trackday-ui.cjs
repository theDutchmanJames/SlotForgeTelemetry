// Track day (Pit Board): the session from the garage, runs as columns with verdicts and the quickest marked, the next run
// with setup steppers, lap boxes and a live verdict, Keep this change, through the real preload/IPC manual-lap storage.
const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const output=path.join(__dirname,'../test-results'),profile=path.join(output,'trackday-'+Date.now());fs.mkdirSync(profile,{recursive:true});app.setPath('userData',profile);app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
 require('../src/storage-ipc.cjs').registerStorage(profile,{schedule:false});
 const paddock=require('../src/paddock-ipc.cjs').registerPaddock(profile);
 const win=new BrowserWindow({show:false,width:1440,height:1100,webPreferences:{preload:path.join(__dirname,'../src/preload.cjs'),sandbox:true,contextIsolation:true,nodeIntegration:false,backgroundThrottling:false,offscreen:true}}),errors=[];
 win.webContents.on('console-message',e=>{if(e.level==='error'){errors.push(e.message);console.error(e.message);}});
 const run=s=>win.webContents.executeJavaScript(s,true),pause=()=>new Promise(r=>setTimeout(r,160)),click=async s=>{await run(`document.querySelector(${JSON.stringify(s)}).click()`);await pause();};
 const type=(sel,value)=>run(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});e.value=${JSON.stringify(value)};e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
 const text=s=>run(`document.querySelector(${JSON.stringify(s)}).textContent`);
 const runs=()=>run("document.querySelectorAll('.td-run[data-run]').length");
 const wait=async(s,why=s)=>{for(let i=0;i<80;i++){if(await run(s))return;await pause();}throw Error('Timed out: '+why+' · '+await run("document.querySelector('#trackday-error')?.textContent+' / '+document.querySelector('#trackday-preview')?.textContent"));};
 const shot=async name=>{await pause();fs.writeFileSync(path.join(output,'trackday-'+name+'.png'),(await win.webContents.capturePage()).toPNG());};
 try{
  await win.loadFile(path.join(__dirname,'../renderer/index.html'));await pause();
  await run("location.hash='trackday'");await pause();assert.equal(await run("document.querySelector('[data-page=trackday]').hidden"),false);
  assert.match(await text('#trackday-setup'),/9 : 27/);assert.match(await text('#trackday-board'),/Choose the car, track and lane/);
  assert.equal(await run("document.querySelector('#trackday-save').disabled"),true);
  await type('#trackday-car','Club GT');await type('#trackday-track','Home track');await type('#trackday-lane','2');await type('#trackday-driver','Alex');
  await click('#trackday-sequence');
  // Baseline run, typed one box at a time; a bad box shows its line.
  assert.match(await text('.td-next'),/This run becomes your baseline/);
  for(const [i,v] of ['10.20','10.10','10.30','10.25','10.15'].entries())await type(`[data-lap="${i}"]`,v);
  assert.match(await text('#trackday-preview'),/So far: 5 laps · typical 10\.200 · best 10\.100/);
  await type('[data-lap="5"]','abc');assert.match(await text('#trackday-error'),/Line 6/);assert.equal(await run("document.querySelector('#trackday-save').disabled"),true);
  await type('[data-lap="5"]','');await click('#trackday-save');
  await wait(`document.querySelectorAll('.td-run[data-run]').length===1`,'first run');assert.match(await text('.td-run[data-run]'),/Run 1.*No change/s);assert.match(await text('.td-run[data-run] .td-verdict'),/The baseline/);
  assert.equal(await run("document.querySelector('[data-lap=\"0\"]').value"),'','the boxes are empty for the next run');
  // The pinion up one with the stepper: the workbench changes and the change is read from it.
  await click('[data-step=pinion][data-dir="1"]');assert.equal(await run('state.setup.pinion'),'10');assert.equal(await run("document.querySelector('[name=pinion]').value"),'10');
  assert.match(await text('#trackday-auto'),/Change: pinion 9 → 10/);
  await type('#trackday-change','cleaned the tyres');
  // Pasting into one box fills the next ones.
  await type('[data-lap="0"]','9.95 9.90 10.00 9.92 9.98');assert.equal(await run("[...document.querySelectorAll('[data-lap]')].slice(0,5).map(e=>e.value).join()"),'9.95,9.90,10.00,9.92,9.98');
  assert.match(await text('#trackday-preview'),/▲ 0\.2\d\d s vs run 1/);assert.equal(await run("document.querySelector('#trackday-preview').classList.contains('good')"),true);
  await click('#trackday-save');await wait("document.querySelectorAll('.td-run[data-run]').length===2",'second run');
  assert.match(await text('.td-run[data-run]:nth-child(2)'),/pinion 9 → 10, cleaned the tyres/);assert.match(await text('.td-run[data-run]:nth-child(2) .td-verdict'),/▲ 0\.2\d\d s quicker than run 1/);
  assert.equal(await run("document.querySelector('.td-run.quickest .td-run-head b').textContent"),'Run 2');
  // Up again and slower: run 2 stays the quickest, and the workbench is offered its pinion back.
  await click('[data-step=pinion][data-dir="1"]');await type('#trackday-laps','10.10\n10.05\n10.20\n10.08\n10.12');await click('#trackday-save');await wait("document.querySelectorAll('.td-run[data-run]').length===3",'third run');
  assert.match(await text('.td-run[data-run]:nth-child(3) .td-verdict'),/▼ .* slower than run 2/);
  assert.equal(await run("document.getElementById('trackday-keep').hidden"),false);assert.match(await text('#trackday-keep'),/Run 2 is your quickest today.*The workbench has pinion 11; that run had pinion 10/s);
  await shot('board-dark');
  await click('#trackday-keep [data-keep=yes]');assert.equal(await run('state.setup.pinion'),'10');assert.equal(await run("document.getElementById('trackday-keep').hidden"),true);
  // Saved runs land on the Laps wall.
  await click('[data-trackday-open]');assert.equal(await run("location.hash"),'#laps');assert.match(await run("document.querySelector('#lw-drawer h2').textContent"),/Run 1/);
  assert.match(await run("document.querySelector('#lw-wall').textContent"),/changed: pinion 9 → 10/);
  // The session is remembered; runs persist.
  await win.loadFile(path.join(__dirname,'../renderer/index.html'));await pause();await run("location.hash='trackday'");await pause();
  assert.equal(await run("document.querySelector('#trackday-car').value"),'Club GT');assert.equal(await run("document.querySelector('#trackday-lane').value"),'2');assert.equal(await run("document.querySelector('#trackday-sequence').checked"),true);
  await wait("document.querySelectorAll('.td-run[data-run]').length===3",'runs after a restart');
  // Typing in the pasted list keeps it open, line after line.
  await click('#trackday-paste-toggle');await type('#trackday-laps','10.1');await type('#trackday-laps','10.1\n10.2');
  assert.equal(await run("document.querySelector('#trackday-paste').hidden"),false);assert.equal(await run("document.activeElement.id"),'trackday-laps');
  assert.equal(await run("document.querySelector('[data-lap=\"1\"]').value"),'10.2');await type('#trackday-laps','');
  await click('[data-tone-choice=light]');await shot('light');
  win.setSize(390,1000);await pause();assert.equal(await run('document.documentElement.scrollWidth>innerWidth'),false);await shot('narrow');
  assert.deepEqual(errors,[]);console.log('Track day passed: session, lap boxes and paste, live verdict, invalid laps, baseline, stepper changes the workbench, change read from the setup, run columns with verdicts, quickest, Keep this change, Laps wall, persistence, light/dark and narrow layouts.');
 }finally{paddock.disconnect();win.destroy();app.quit();}
}).catch(e=>{console.error(e);app.exit(1);});
