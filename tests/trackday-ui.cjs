// Track day: the change → drive → laps → compare loop through the real preload/IPC manual-lap storage.
const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const output=path.join(__dirname,'../test-results'),profile=path.join(output,'trackday-'+Date.now());fs.mkdirSync(profile,{recursive:true});app.setPath('userData',profile);app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
 const paddock=require('../src/paddock-ipc.cjs').registerPaddock(profile);
 const win=new BrowserWindow({show:false,width:1440,height:1100,webPreferences:{preload:path.join(__dirname,'../src/preload.cjs'),sandbox:true,contextIsolation:true,nodeIntegration:false,backgroundThrottling:false,offscreen:true}}),errors=[];
 win.webContents.on('console-message',e=>{if(e.level==='error'){errors.push(e.message);console.error(e.message);}});
 const run=s=>win.webContents.executeJavaScript(s,true),pause=()=>new Promise(r=>setTimeout(r,160)),click=s=>run(`document.querySelector(${JSON.stringify(s)}).click()`);
 const type=(sel,value)=>run(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});e.value=${JSON.stringify(value)};e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
 const text=s=>run(`document.querySelector(${JSON.stringify(s)}).textContent`);
 const wait=async s=>{for(let i=0;i<80;i++){if(await run(s))return;await pause();}throw Error('Timed out: '+s);};
 const shot=async name=>{await pause();fs.writeFileSync(path.join(output,'trackday-'+name+'.png'),(await win.webContents.capturePage()).toPNG());};
 try{
  await win.loadFile(path.join(__dirname,'../renderer/index.html'));await pause();
  assert.equal(await run("document.querySelectorAll('.main-nav a').length"),6);
  await run("location.hash='trackday'");await pause();assert.equal(await run("document.querySelector('[data-page=trackday]').hidden"),false);
  assert.match(await text('#trackday-setup'),/9 : 27/);assert.match(await text('#trackday-compare'),/Enter the car, track and lane/);
  assert.equal(await run("document.querySelector('#trackday-save').disabled"),true);
  await type('#trackday-car','Club GT');await type('#trackday-track','Home track');await type('#trackday-lane','2');await type('#trackday-driver','Alex');
  await run("document.querySelector('#trackday-sequence').click()");
  // Baseline run.
  await type('#trackday-laps','10.20\n10.10\n10.30\n10.25\n10.15');await pause();
  assert.match(await text('#trackday-preview'),/5 lap\(s\) · best 10\.100 s · typical 10\.200 s/);assert.match(await text('#trackday-compare'),/becomes your baseline/);
  await type('#trackday-laps','10.20\nabc');await pause();assert.match(await text('#trackday-error'),/Line 2/);assert.equal(await run("document.querySelector('#trackday-save').disabled"),true);
  await type('#trackday-laps','10.20\n10.10\n10.30\n10.25\n10.15');await click('#trackday-save');
  await wait("document.querySelectorAll('#trackday-today tbody tr').length===1");assert.match(await text('#trackday-today'),/Run 1 · no change/);assert.equal(await run("document.querySelector('#trackday-laps').value"),'');
  // Change the pinion on the workbench, then log a faster run.
  await run("location.hash='telemetry'");await pause();await type('[name=pinion]','10');await run("location.hash='trackday'");await pause();
  assert.match(await text('#trackday-setup'),/10 : 27/);
  await type('#trackday-change','pinion 9 → 10');await type('#trackday-laps','9.95\n9.90\n10.00\n9.92\n9.98');await pause();
  assert.match(await text('#trackday-compare .trackday-verdict'),/Typical pace faster by 0\.2\d\d s; best lap faster by 0\.200 s/);
  assert.match(await text('#trackday-compare'),/Pinion 9 → 10/);assert.ok(await run("document.querySelectorAll('#trackday-compare td.good').length>=2"));
  await shot('compare-dark');
  await click('#trackday-save');await wait("document.querySelectorAll('#trackday-today tbody tr').length===2");
  assert.match(await text('#trackday-today'),/Run 2 · pinion 9 → 10/);assert.match(await text('#trackday-compare'),/Run 2 · pinion 9 → 10 compared with Run 1/);
  // Saved runs are ordinary manual sessions: Lap analysis opens them.
  await click('[data-trackday-open]');await pause();assert.equal(await run("location.hash"),'#analyze/races');assert.equal(await run("document.querySelector('#race-analysis').hidden"),false);
  assert.match(await run("document.querySelector('#race-run').selectedOptions[0].textContent"),/Run 2/);
  // The session context is remembered; runs persist.
  await win.loadFile(path.join(__dirname,'../renderer/index.html'));await pause();await run("location.hash='trackday'");await pause();
  assert.equal(await run("document.querySelector('#trackday-car').value"),'Club GT');assert.equal(await run("document.querySelector('#trackday-lane').value"),'2');assert.equal(await run("document.querySelector('#trackday-sequence').checked"),true);
  await wait("document.querySelectorAll('#trackday-today tbody tr').length===2");
  await click('[data-tone-choice=light]');await shot('light');
  win.setSize(390,1000);await pause();assert.equal(await run('document.documentElement.scrollWidth>innerWidth'),false);await shot('narrow');
  assert.deepEqual(errors,[]);console.log('Track day passed: context, live preview, invalid laps, baseline, setup change, faster verdict and differences, today’s runs, Lap analysis, persistence, light/dark and narrow layouts.');
 }finally{paddock.disconnect();win.destroy();app.quit();}
}).catch(e=>{console.error(e);app.exit(1);});
