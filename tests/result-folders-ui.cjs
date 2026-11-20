// Paired Rows: each input topic beside the results it changes; a result opens and closes with its input folder, shows its
// summary while closed, and what changed since you saved. Drafts are kept; three widths in both themes.
const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const output=path.join(__dirname,'../test-results');fs.mkdirSync(output,{recursive:true});
const profile=fs.mkdtempSync(path.join(output,'result-folders-'));app.setPath('userData',profile);app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
 require('../src/storage-ipc.cjs').registerStorage(profile,{schedule:false});
 const win=new BrowserWindow({show:false,width:1440,height:1100,webPreferences:{preload:path.join(__dirname,'../src/preload.cjs'),sandbox:true,contextIsolation:true,nodeIntegration:false,backgroundThrottling:false,offscreen:true}}),errors=[];
 win.webContents.on('console-message',e=>{if(e.level==='error'){errors.push(e.message);console.error(e.message);}});
 const run=s=>win.webContents.executeJavaScript(s,true),pause=()=>new Promise(r=>setTimeout(r,160));
 const click=async s=>{await run(`document.querySelector(${JSON.stringify(s)}).click()`);await pause();};
 const open=key=>run(`document.querySelector('[data-result-group=${key}] details').open`);
 const folder=key=>run(`document.querySelector('[data-folder=${key}]').open`);
 const summary=key=>run(`document.querySelector('[data-result-group=${key}] .result-summary').textContent`);
 const set=(name,value)=>run(`(()=>{const e=document.querySelector('[name=${name}]');e.value=${JSON.stringify(value)};e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
 try{
  await win.loadFile(path.join(__dirname,'../renderer/index.html'));await pause();assert.deepEqual(errors,[]);
  // One row per input topic; each holds the folder on the left and its results on the right.
  assert.deepEqual(await run("[...document.querySelectorAll('.wb-pair')].map(r=>r.dataset.pair+':'+[...r.querySelectorAll('[data-result-group]')].map(g=>g.dataset.resultGroup).join('+'))"),['pinion:performance','ratedRpm:drivetrain','tyreMode:tyres','totalWeight:weight','magneticReadings:magnetic','targetRollout:gears','trackLength:laps','workshop:workshop']);
  assert.equal(await run("document.querySelector('.calculator-layout').hidden"),true);assert.equal(await run("!!document.querySelector('.wb-pairs .result-pin:not([hidden])')&&getComputedStyle(document.querySelector('.wb-pairs .result-pin')).display"),'none','no Pin buttons');
  assert.equal(await run("document.querySelector('.next-step').hidden&&document.querySelector('.df-entry').hidden"),true,'the advert cards are gone');
  // A result follows its input folder; while closed its summary still shows.
  await run(`WorkbenchLevels.set('all')`);
  assert.equal(await folder('pinion'),await open('performance'));
  await click('#workbench-close');assert.equal(await open('tyres'),false,'closing the folders closes their results');await click('[data-folder=tyreMode]>summary');assert.equal(await folder('tyreMode'),true);assert.equal(await open('tyres'),true);
  await set('rearDiameter','19');await set('gearDiameter','18');assert.match(await summary('tyres'),/0.5 mm/);
  await click('[data-folder=tyreMode]>summary');assert.equal(await open('tyres'),false);
  await set('gearDiameter','20');assert.match(await summary('tyres'),/protrudes 0.5 mm/);await set('gearDiameter','18');assert.match(await summary('tyres'),/0.5 mm/,'closed summary updates');
  // Clicking the result side opens the row too.
  await click('[data-result-group=laps] summary');assert.equal(await folder('trackLength'),true);assert.equal(await open('laps'),true);
  await set('trackLength','20');await set('lapTime','5');assert.match(await summary('laps'),/14.4 km\/h/);
  // Jumping to an input opens its row; unapplied drafts survive.
  await run(`focusSetupInput('chassisGuideSpan')`);assert.equal(await folder('chassisGuideSpan'),true);assert.equal(await open('weight'),true,'chassis geometry shares the weight row');assert.equal(await run("document.querySelector('[name=chassisGuideSpan]').closest('.wb-pair').dataset.pair"),'totalWeight');assert.equal(await run('document.activeElement.name'),'chassisGuideSpan');
  await run(`document.getElementById('chassis-part').value='Unapplied draft';document.getElementById('chassis-part-mass').value='3';`);
  await click('[data-folder=totalWeight]>summary');await click('[data-folder=totalWeight]>summary');
  assert.equal(await run(`document.getElementById('chassis-part').value`),'Unapplied draft');assert.equal(await run(`document.getElementById('chassis-part-mass').value`),'3');
  await set('magneticReadings','0');assert.match(await summary('magnetic'),/0 gf · 1 reading/);await set('magneticReadings','bad');assert.match(await summary('magnetic'),/Check magnetic/);await set('magneticReadings','');
  await run(`focusSetupInput('tyreHistory')`);assert.equal(await open('workshop'),true);
  await run(`document.getElementById('workshop-tool').value='braking';document.getElementById('workshop-tool').dispatchEvent(new Event('change'));`);assert.match(await summary('workshop'),/Braking/);
  // Since saved: save, change the pinion, and the gearing row shows what moved.
  await click('#save-library');await run("document.querySelector('#library-entry-name').value='Rows test'");await click('#library-editor-confirm');
  assert.equal(await run("document.querySelector('[data-pair=pinion] [data-since]').textContent"),'');
  await set('pinion','10');await pause();
  assert.match(await run("document.querySelector('[data-pair=pinion] [data-since]').textContent"),/since saved.*No-load speed 28\.52 km\/h \+2\.85/);
  assert.equal(await run("document.querySelector('[data-pair=pinion] .wb-delta').classList.contains('good')"),true);assert.equal(await run("document.querySelector('[data-pair=pinion]').classList.contains('wb-changed')"),true);
  assert.match(await run("document.querySelector('#workbench-next').textContent"),/Against Rows test, the workbench is quicker on the straight/);
  await click('#workbench-next [data-next=compare]');assert.equal(await run('location.hash'),'#analyze/compare');assert.deepEqual(await run("[...document.querySelectorAll('.cs-who b')].map(b=>b.textContent)"),['Rows test','The workbench now']);
  await run("location.hash='telemetry'");await pause();
  for(const width of [1440,760,390]){win.setSize(width,1100);await pause();for(const tone of ['light','dark']){
   await click('[data-tone-choice='+tone+']');await click('#workbench-close');await run(`document.querySelector('.wb-pairs').scrollIntoView({block:'start'});document.getElementById('toast').hidden=true`);await pause();
   assert.equal(await run('document.documentElement.scrollWidth<=innerWidth'),true,'closed overflow '+width);
   fs.writeFileSync(path.join(output,`result-folders-${width}-${tone}.png`),(await win.webContents.capturePage()).toPNG());
   for(const key of ['drivetrain','performance','weight','tyres','magnetic','laps','workshop']){await run(`ResultFolders.open('${key}')`);assert.equal(await run('document.documentElement.scrollWidth<=innerWidth'),true,key+' overflow '+width);}
  }}
  assert.deepEqual(errors,[]);console.log('Paired rows passed: a row per input topic with its results, results follow their folder, closed summaries, opening from either side, jumps and drafts, since saved with the verdict and Compare, no Pin or adverts, three widths in both themes.');win.destroy();app.quit();
 }catch(e){console.error(e);win.destroy();app.exit(1);}
});
