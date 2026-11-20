// Workbench levels: Quick setup / Measure the car / Plan & test / Everything.
const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const output=path.join(__dirname,'../test-results');fs.mkdirSync(output,{recursive:true});
app.setPath('userData',fs.mkdtempSync(path.join(output,'workbench-levels-')));app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,width:1440,height:1100,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false,backgroundThrottling:false,offscreen:true}}),errors=[];
 win.webContents.on('console-message',e=>{if(e.level==='error'){errors.push(e.message);console.error(e.message);}});
 const run=s=>win.webContents.executeJavaScript(s,true),pause=()=>new Promise(r=>setTimeout(r,160)),click=s=>run(`document.querySelector(${JSON.stringify(s)}).click()`);
 const visible=sel=>run(`[...document.querySelectorAll(${JSON.stringify(sel)})].filter(e=>!e.hidden).map(e=>e.dataset.folder||e.dataset.resultGroup)`);
 const shot=async name=>{await pause();fs.writeFileSync(path.join(output,'workbench-'+name+'.png'),(await win.webContents.capturePage()).toPNG());};
 try{
  await win.loadFile(path.join(__dirname,'../renderer/index.html'));await pause();
  // A first visit shows only the essentials.
  assert.equal(await run("document.querySelector('[data-workbench-level=setup]').getAttribute('aria-pressed')"),'true');
  assert.deepEqual(await visible('.workbench-folder'),['pinion','ratedRpm','tyreMode','totalWeight']);
  assert.deepEqual(await visible('[data-result-group]'),['performance','drivetrain','tyres','weight','gears']);
  assert.deepEqual(await run("[...document.querySelectorAll('.wb-pair')].filter(e=>!e.hidden).map(e=>e.dataset.pair)"),['pinion','ratedRpm','tyreMode','totalWeight'],'Paired Rows: a row per input topic of the level');
  await shot('quick-setup-dark');
  await click('[data-workbench-level=measure]');await pause();
  assert.deepEqual((await visible('.workbench-folder')).sort(),['chassisGuideSpan','magneticReadings','tyreMode','totalWeight'].sort());
  assert.ok((await visible('[data-result-group]')).includes('magnetic'));await shot('measure');
  await click('[data-workbench-level=plan]');await pause();
  assert.deepEqual(await visible('.workbench-folder'),['targetRollout','trackLength','workshop']);
  assert.ok(await run("[...document.querySelectorAll('.workbench-folder')].some(f=>!f.hidden&&f.open)"),'a level never opens with every folder closed');
  // Values in hidden folders stay and keep counting: a target rollout entered here still drives the gear chart.
  await run("(()=>{const e=document.querySelector('[name=targetRollout]');e.value='22';e.dispatchEvent(new Event('input',{bubbles:true}));})()");
  await click('[data-workbench-level=setup]');await pause();
  assert.equal(await run('state.setup.targetRollout'),'22');assert.match(await run("document.querySelector('[data-result-group=gears] .result-summary').textContent"),/combinations/);
  // Jumping to a hidden input (help, Analyze, Driver Feedback) switches level and opens it.
  await run("focusSetupInput('magneticReadings')");await pause();
  assert.equal(await run('WorkbenchLevels.get()'),'measure');assert.equal(await run("document.querySelector('[data-folder=magneticReadings]').open"),true);
  await run("focusSetupInput('totalWeight')");await pause();assert.equal(await run('WorkbenchLevels.get()'),'measure','a level that already shows the input is kept');
  await run("focusSetupInput('pinion')");await pause();assert.equal(await run('WorkbenchLevels.get()'),'setup');
  await run("focusSetupInput('trackLength')");await pause();assert.equal(await run('WorkbenchLevels.get()'),'plan');
  // SlotForge Restyle: the levels are one row of view tabs above inputs and results; the setup bar is a Pit Board.
  assert.equal(await run("document.querySelector('.workbench-levels').nextElementSibling.classList.contains('wb-pairs')"),true);
  assert.equal(await run("document.querySelectorAll('.level-tabs [data-workbench-level] small').length"),4);
  assert.deepEqual(await run("[...document.querySelectorAll('.pit-actions .pit-tools .btn')].map(b=>b.id)"),['new-setup','load-example','open-setup','save-setup','setup-sheet']);
  assert.deepEqual(await run("[...document.querySelectorAll('.pit-actions .pit-save .btn')].map(b=>b.id)"),['save-copy','save-library']);
  assert.equal(await run("!!document.querySelector('.setup-name-edit #name')&&!!document.querySelector('.setup-car-row [name=carRef]')"),true);
  // The gear chart always marks the current gearing, even outside the Gear finder ranges.
  await run("(()=>{for(const [n,v] of [['pinion','13'],['gear','30']]){const e=document.querySelector('[name='+n+']');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));}})()");
  await run("ResultFolders.open('gears')");await pause();
  assert.equal(await run("document.querySelector('#live-gears td.gear-cell-current button').dataset.pinion+'/'+document.querySelector('#live-gears td.gear-cell-current button').dataset.gear"),'13/30');
  await click('[data-workbench-level=all]');await pause();assert.equal((await visible('.workbench-folder')).length,9);assert.equal((await visible('[data-result-group]')).length,8);
  // The choice is remembered on this device.
  await win.loadFile(path.join(__dirname,'../renderer/index.html'));await pause();assert.equal(await run('WorkbenchLevels.get()'),'all');
  await click('[data-workbench-level=setup]');await pause();
  // Example text: one line while empty, folded away once a value is entered.
  assert.equal(await run("document.querySelector('#input-help-name').classList.contains('input-help-filled')"),true);
  await run("(()=>{const e=document.querySelector('[name=name]');e.value='';e.dispatchEvent(new Event('input',{bubbles:true}));})()");await pause();
  assert.match(await run("document.querySelector('#input-help-name').textContent"),/Not entered\..*Example, not used:/);
  await run("(()=>{const e=document.querySelector('[name=name]');e.value='Club GT';e.dispatchEvent(new Event('input',{bubbles:true}));})()");
  await click('[data-tone-choice=light]');await shot('quick-setup-light');
  win.setSize(390,1000);await pause();assert.equal(await run('document.documentElement.scrollWidth>innerWidth'),false);await shot('quick-setup-narrow');
  assert.deepEqual(errors,[]);console.log('Workbench levels passed: essentials first, measure/plan/everything, hidden values kept, automatic level on jumps, persistence, compact examples, light/dark and narrow layouts.');
 }finally{win.destroy();app.quit();}
}).catch(e=>{console.error(e);app.exit(1);});
