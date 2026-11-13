const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const output=path.join(__dirname,'../test-results');fs.mkdirSync(output,{recursive:true});
app.setPath('userData',fs.mkdtempSync(path.join(output,'result-folders-')));app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,width:1440,height:1100,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false,backgroundThrottling:false,offscreen:true}}),errors=[];
 win.webContents.on('console-message',e=>{if(e.level==='error'){errors.push(e.message);console.error(e.message);}});
 const run=s=>win.webContents.executeJavaScript(s,true),pause=()=>new Promise(r=>setTimeout(r,160));
 const click=s=>run(`document.querySelector(${JSON.stringify(s)}).click()`);
 const open=key=>run(`document.querySelector('[data-result-group=${key}] details').open`);
 const summary=key=>run(`document.querySelector('[data-result-group=${key}] .result-summary').textContent`);
 const set=(name,value)=>run(`(()=>{const e=document.querySelector('[name=${name}]');e.value=${JSON.stringify(value)};e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
 try{
  await win.loadFile(path.join(__dirname,'../renderer/index.html'));await pause();assert.deepEqual(errors,[]);
  assert.equal(await run(`document.querySelectorAll('.result-group').length`),7);
  assert.equal(await open('drivetrain'),true);assert.equal(await run(`document.querySelectorAll('.result-folder[open]').length`),1);
  await click('[data-folder=tyreMode]>summary');await pause();assert.equal(await open('tyres'),true);assert.equal(await open('drivetrain'),false);
  await set('rearDiameter','19');await set('gearDiameter','18');assert.match(await summary('tyres'),/0.5 mm/);
  await click('[data-result-group=tyres] .result-pin');await click('[data-folder=ratedRpm]>summary');
  assert.equal(await open('tyres'),true);assert.equal(await open('performance'),true);
  await click('#results-collapse');assert.equal(await open('tyres'),true);assert.equal(await open('performance'),false);
  await set('gearDiameter','20');assert.match(await summary('tyres'),/protrudes 0.5 mm/);assert.doesNotMatch(await summary('tyres'),/-0.5/);
  await click('[data-result-group=tyres] .result-pin');assert.equal(await open('tyres'),false);
  await set('gearDiameter','18');assert.match(await summary('tyres'),/0.5 mm/,'closed summary updates');
  await run(`focusSetupInput('chassisGuideSpan')`);assert.equal(await open('weight'),true);assert.equal(await run('document.activeElement.name'),'chassisGuideSpan');
  await run(`document.getElementById('chassis-part').value='Unapplied draft';document.getElementById('chassis-part-mass').value='3';`);
  await click('[data-result-group=laps] summary');await click('[data-result-group=weight] summary');
  assert.equal(await run(`document.getElementById('chassis-part').value`),'Unapplied draft');assert.equal(await run(`document.getElementById('chassis-part-mass').value`),'3');
  await click('[data-result-group=weight] .result-pin');
  await run(`focusSetupInput('trackLength')`);await set('trackLength','20');await set('lapTime','5');assert.match(await summary('laps'),/14.4 km\/h/);
  await click('[data-result-group=magnetic] summary');assert.equal(await open('laps'),false);assert.equal(await open('weight'),true);
  await set('magneticReadings','0');assert.match(await summary('magnetic'),/0 gf · 1 reading/);
  await set('magneticReadings','bad');assert.match(await summary('magnetic'),/Check magnetic/);await set('magneticReadings','');assert.match(await summary('magnetic'),/Not available/);
  await run(`focusSetupInput('tyreHistory')`);assert.equal(await open('workshop'),true);
  await run(`document.getElementById('workshop-tool').value='braking';document.getElementById('workshop-tool').dispatchEvent(new Event('change'));`);assert.match(await summary('workshop'),/Braking/);
  await set('brakeRows','0,36\n0.3,0');assert.match(await run(`document.querySelector('#workshop-live').textContent`),/1.5 m/);
  await win.reload();await pause();assert.equal(await open('weight'),true);assert.equal(await open('workshop'),true);
  assert.equal(await run(`document.querySelector('[data-result-group=weight] .result-pin').getAttribute('aria-pressed')`),'true');
  // Keyboard Enter uses the same accordion action as clicking the heading.
  await run(`document.querySelector('[data-result-group=performance] summary').focus()`);
  win.webContents.focus();win.webContents.sendInputEvent({type:'keyDown',keyCode:'Space'});win.webContents.sendInputEvent({type:'keyUp',keyCode:'Space'});await pause();assert.equal(await open('performance'),true);assert.equal(await open('workshop'),false);
  await click('[data-result-group=weight] summary');assert.equal(await open('weight'),false);assert.equal(await run(`document.querySelector('[data-result-group=weight] .result-pin').getAttribute('aria-pressed')`),'false');
  for(const width of [1440,760,390]){win.setSize(width,1100);await pause();for(const tone of ['light','dark']){
   await click('[data-tone-choice='+tone+']');await click('#workbench-close');await click('#results-collapse');await run(`document.querySelector('.calculator-layout').scrollIntoView({block:'start'});document.getElementById('toast').hidden=true`);await pause();
   assert.equal(await run('document.documentElement.scrollWidth<=innerWidth'),true,'closed overflow '+width);
   fs.writeFileSync(path.join(output,`result-folders-${width}-${tone}.png`),(await win.webContents.capturePage()).toPNG());
   for(const key of ['drivetrain','performance','weight','tyres','magnetic','laps','workshop']){await run(`ResultFolders.open('${key}')`);assert.equal(await run('document.documentElement.scrollWidth<=innerWidth'),true,key+' overflow '+width);}
  }}
  assert.deepEqual(errors,[]);console.log('Result folders passed: linked inputs, exclusive opening, pinning, persistent preferences, keyboard, draft retention, live summaries, unknown/zero/interference values and seven groups at three widths in both themes.');win.destroy();app.quit();
 }catch(e){console.error(e);win.destroy();app.exit(1);}
});
