// Calculations explained (Calculation Map): the map with your values, a path that lights up, the formula with your
// numbers, the ? next to a number opening it, the grouped index with search, and the full explanation below.
const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const output=path.join(__dirname,'../test-results'),profile=fs.mkdtempSync(path.join(output,'calc-map-'));app.setPath('userData',profile);app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
 require('../src/storage-ipc.cjs').registerStorage(profile,{schedule:false});
 const win=new BrowserWindow({show:false,width:1440,height:1100,webPreferences:{preload:path.join(__dirname,'../src/preload.cjs'),sandbox:true,contextIsolation:true,nodeIntegration:false,backgroundThrottling:false,offscreen:true}}),errors=[];
 win.webContents.on('console-message',e=>{if(e.level==='error'&&!/No handler registered/.test(e.message)){errors.push(e.message);console.error(e.message);}});
 const run=s=>win.webContents.executeJavaScript(s,true),pause=(ms=200)=>new Promise(r=>setTimeout(r,ms)),click=async s=>{await run(`document.querySelector(${JSON.stringify(s)}).click()`);await pause();};
 const text=s=>run(`document.querySelector(${JSON.stringify(s)}).textContent`),shot=async n=>{await pause(250);fs.writeFileSync(path.join(output,'calc-map-'+n+'.png'),(await win.webContents.capturePage()).toPNG());};
 try{
  await win.loadFile(path.join(__dirname,'../renderer/index.html'));await pause(500);
  await run("state.setup={...CalculatorModel.EXAMPLE,pinion:'10',totalWeight:'80'};fillInputs();persist();location.hash='settings/calculations/gearing'");await pause(400);
  // The map, with the workbench values on its boxes.
  assert.equal(await run("document.querySelectorAll('#cm-svg [data-node]').length"),14);
  assert.match(await run("document.querySelector('#cm-svg [data-node=rollout]').textContent"),/Rollout23\.27 mm\/rev/);
  assert.match(await run("document.querySelector('#cm-svg [data-node=pinion]').textContent"),/Pinion10/);
  // The selected number: its path lights up; the formula shows with your numbers.
  assert.equal(await run("document.querySelector('#cm-svg [data-node=rollout]').classList.contains('sel')"),true);
  assert.deepEqual(await run("[...document.querySelectorAll('#cm-svg .cm-node.on')].map(g=>g.dataset.node).sort()"),['circ','gear','pinion','ratio','rollout','tyre']);
  assert.match(await text('#cm-detail'),/rollout = circumference ÷ ratio/);assert.match(await text('#cm-detail'),/With your numbers: circumference 62\.83 mm, gear ratio 2\.7:1 → 23\.27 mm\/rev/);assert.match(await text('#cm-detail'),/Assumes no tyre slip/);
  await run("document.querySelector('#cm-svg [data-node=powerToWeight]').dispatchEvent(new MouseEvent('click',{bubbles:true}))");await pause();
  assert.deepEqual(await run("[...document.querySelectorAll('#cm-svg .cm-node.on')].map(g=>g.dataset.node).sort()"),['peakPowerW','powerToWeight','rpm','torque','weight']);
  await run("document.querySelector('#cm-svg [data-node=pinion]').focus();document.querySelector('#cm-svg [data-node=pinion]').dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}))");await pause();
  assert.match(await text('#cm-detail'),/YOUR INPUT.*Pinion.*Used by: Gear ratio/s);
  await shot('dark');
  // Full explanation: the topic below.
  await run("CalcMapUI.select('forceN')");await click('#cm-full');assert.equal(await run('location.hash'),'#settings/calculations/torque');assert.match(await text('#help-content'),/Torque & driving force/i);
  // The index: grouped by area, searchable.
  assert.deepEqual(await run("[...document.querySelectorAll('#help-topics .cm-group>b')].map(b=>b.textContent)"),['Gearing & speed','Motor & power','Weight, tyres & magnets','Testing & advice']);
  assert.match(await run("[...document.querySelectorAll('#help-topics .cm-group')][2].textContent"),/Magnetic downforce/);
  await run("{const s=document.getElementById('help-search');s.value='clearance';s.dispatchEvent(new Event('input'));}");
  const found=await run("[...document.querySelectorAll('#help-topics a')].filter(a=>!a.hidden).map(a=>a.textContent.trim())");assert.ok(found.includes('Driven gear clearance'));assert.ok(!found.includes('Gear finder'),'search narrows the list');
  await run("{const s=document.getElementById('help-search');s.value='';s.dispatchEvent(new Event('input'));}");
  // A ? next to a number on the workbench opens the map at that number.
  await run("location.hash='telemetry'");await pause();
  await run("document.querySelector('[data-folder=pinion]').open=true");await pause();
  await click('#live-performance [data-calc-node=speedKmh]');await pause(300);
  assert.equal(await run('location.hash'),'#settings/calculations/speed');assert.equal(await run('CalcMapUI.state()'),'speedKmh');assert.match(await text('#cm-detail'),/No-load speed 30\.02 km\/h/);
  await click('[data-tone-choice=light]');await run('scrollTo(0,0)');await shot('light');await click('[data-tone-choice=dark]');
  win.setSize(390,1000);await pause(300);assert.equal(await run('document.documentElement.scrollWidth>innerWidth'),false);await shot('narrow');
  assert.deepEqual(errors,[]);console.log('Calculation map passed: values from the workbench, path and formula with your numbers, mouse and keyboard, full explanation, grouped index and search, ? from the workbench, light/dark and narrow layouts.');
 }finally{win.destroy();app.quit();}
}).catch(e=>{console.error(e);app.exit(1);});
