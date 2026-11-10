const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),fixture=require('./chassis-fixtures.cjs');
const output=path.join(__dirname,'../test-results');fs.mkdirSync(output,{recursive:true});
app.setPath('userData',fs.mkdtempSync(path.join(output,'chassis-profile-')));app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,width:1440,height:1100,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false,backgroundThrottling:false,offscreen:true}}),errors=[];
 win.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message);});
 const run=s=>win.webContents.executeJavaScript(s,true),pause=()=>new Promise(r=>setTimeout(r,100));
 const click=s=>run(`document.querySelector(${JSON.stringify(s)}).click()`);
 const set=(name,value)=>run(`(()=>{const e=document.querySelector('[name='+${JSON.stringify(name)}+']');e.value=${JSON.stringify(value)};e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
 const route=async h=>{await run(`navigate(${JSON.stringify(h)})`);await pause();};
 const capture=async(name,selector)=>{await run(`document.querySelector('#toast').hidden=true;document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'start',behavior:'instant'})`);await new Promise(r=>setTimeout(r,650));fs.writeFileSync(path.join(output,name+'.png'),(await win.webContents.capturePage()).toPNG());};
 try{
  await win.loadFile(path.join(__dirname,'../renderer/index.html'));await pause();
  await click('[data-input-jump=chassisGuideSpan]');assert.equal(await run('document.activeElement.name'),'chassisGuideSpan');
  await run(`state.setup={...state.setup,...${JSON.stringify(fixture)}};fillInputs();persist();`);
  assert.equal(await run(`document.querySelector('#input-error').hidden`),true,await run(`document.querySelector('#input-error').textContent`));
  assert.match(await run(`document.querySelector('#chassis-live').textContent`),/33.4/);
  assert.match(await run(`document.querySelector('#chassis-live').textContent`),/90/);
  await capture('chassis-live-dark','#chassis-live');await click('[data-tone-choice=light]');await capture('chassis-live-light','#chassis-live');
  await click('#save-library');await run(`document.querySelector('#library-entry-name').value='Chassis baseline'`);await click('#library-editor-confirm');
  const saved=await run(`localStorage.getItem('slotforge.telemetry.library.v1')`);assert.match(saved,/chassisGuideSpan/);
  await set('chassisTrack','70');await route('analyze');await click('[data-analysis-topic=chassis]');
  assert.match(await run(`document.querySelector('#chassis-analysis').textContent`),/33.4/);assert.doesNotMatch(await run(`document.querySelector('#chassis-analysis').textContent`),/38.58/);
  await capture('chassis-analysis-light','#chassis-analysis');await click('[data-tone-choice=dark]');await capture('chassis-analysis-dark','#chassis-analysis');await capture('chassis-loads-dark','.chassis-loads');
  await route('settings/calculations/chassis');assert.match(await run(`document.querySelector('#help-content').textContent`),/23 \/ 31 \/ 36/);await click('#help-try');await pause();assert.equal(await run('document.activeElement.name'),'chassisGuideSpan');
  await set('chassisMode','mixed');assert.equal(await run('ChassisModel.calculate(state.setup).baseline'),null);assert.equal(await run('state.setup.chassisConfirmed'),'no');
  await set('chassisMode','tripod');await set('chassisConfirmed','yes');await set('chassisTrack','60');
  await run(`document.querySelector('#chassis-part').value='<img src=x onerror=alert(1)>';document.querySelector('#chassis-part-mass').value='5';document.querySelector('#chassis-part-x').value='50';document.querySelector('#chassis-part-y').value='0';`);await click('#chassis-add-part');
  assert.match(await run(`document.querySelector('#chassis-parts').textContent`),/<img/);assert.equal(await run(`document.querySelectorAll('#chassis-parts img').length`),0);assert.equal(await run('ChassisModel.calculate(state.setup).planned.mass'),95);
  await click('[data-remove-chassis="1"]');assert.equal(await run('ChassisModel.calculate(state.setup).planned.mass'),90);
  // A completed move uses old and new positions while preserving mass.
  await run(`document.querySelector('#chassis-action').value='move';document.querySelector('#chassis-action').dispatchEvent(new Event('change'));document.querySelector('#chassis-part').value='Existing ballast';document.querySelector('#chassis-part-toX').value='60';document.querySelector('#chassis-part-toY').value='5';`);await click('#chassis-add-part');assert.equal(await run('ChassisModel.calculate(state.setup).planned.mass'),90);await click('[data-remove-chassis="1"]');
  await set('chassisNotes','<script>bad()</script>');assert.equal(await run(`document.querySelectorAll('#chassis-live script').length`),0);
  // Capture manually entered and recorded laps against a saved setup.
  await run(`WorkshopUI.showDraft('experiment');`);await set('experimentRows','A before | A | 5,5.1,5.2');
  await run(`document.querySelector('#chassis-test-setup').value=library[0].id;document.querySelector('#chassis-test-row').value='0';`);await click('#chassis-test-capture');
  assert.equal(await run('ChassisTestModel.records(state.setup.chassisRunSnapshots).length'),1);
  await set('experimentRows','A edited | A | 5,5.1,5.2');assert.match(await run(`document.querySelector('#workshop-live').textContent`),/DETACHED/);
  await run(`RaceUI.testingRuns=()=>[{id:'source-1',label:'Test car · Lane 1'}];RaceUI.testingRun=id=>id==='source-1'?{id,label:'Test car · Lane 1',times:[5,5.1,5.2]}:null;WorkshopUI.showDraft('experiment');`);
  await run(`document.querySelector('#workshop-run').value='source-1';document.querySelector('#chassis-test-setup').value=library[0].id;`);await click('#workshop-add-run');
  assert.equal(await run('ChassisTestModel.records(state.setup.chassisRunSnapshots).length'),2);
  await click('#save-copy');await run(`document.querySelector('#library-entry-name').value='Chassis test evidence'`);await click('#library-editor-confirm');
  await route('analyze');await click('[data-analysis-topic=workshop]');await run(`document.querySelector('#workshop-analysis-tool').value='experiment';document.querySelector('#workshop-analysis-tool').dispatchEvent(new Event('change'));`);
  assert.match(await run(`document.querySelector('#workshop-analysis').textContent`),/Captured chassis evidence/);
  await route('telemetry');await set('chassisFront','bad');assert.equal(await run(`document.querySelector('#save-library').disabled`),true);
  await win.loadFile(path.join(__dirname,'../renderer/index.html'));await pause();assert.equal(await run('ChassisTestModel.records(state.setup.chassisRunSnapshots).length'),2);
  assert.equal(await run('state.setup.chassisFront'),'20');
  for(const width of [760,390]){
   win.setSize(width,980);await pause();
   for(const tone of ['light','dark']){
    await click('[data-tone-choice='+tone+']');await route('telemetry');await click('[data-input-jump=chassisGuideSpan]');assert.equal(await run('document.documentElement.scrollWidth<=innerWidth'),true,'inputs '+width);await capture(`chassis-inputs-${width}-${tone}`,'.chassis-inputs');
    await route('analyze');await click('[data-analysis-topic=chassis]');assert.equal(await run('document.documentElement.scrollWidth<=innerWidth'),true,'analysis '+width);await capture(`chassis-analysis-${width}-${tone}`,'#chassis-analysis');
   }
  }
  assert.deepEqual(errors,[]);console.log('Chassis UI passed: geometry, modes, saving, saved-only analysis, help, ballast add/move/remove, escaping, immutable run evidence, recovery, both themes and 390/760px layouts.');win.destroy();app.quit();
 }catch(e){console.error(e);win.destroy();app.exit(1);}
});
