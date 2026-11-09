const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),fixture=require('./workshop-fixtures.cjs');
const output=path.join(__dirname,'../test-results');fs.mkdirSync(output,{recursive:true});
app.setPath('userData',fs.mkdtempSync(path.join(output,'workshop-profile-')));app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,width:1440,height:1100,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false,backgroundThrottling:false,offscreen:true}}),errors=[];
 win.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message);});
 const run=s=>win.webContents.executeJavaScript(s,true),pause=()=>new Promise(r=>setTimeout(r,150));
 const click=s=>run(`document.querySelector(${JSON.stringify(s)}).click()`);
 const set=(name,value)=>run(`(()=>{const e=document.querySelector('[name='+${JSON.stringify(name)}+']');e.value=${JSON.stringify(value)};e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
 const route=async h=>{await run(`navigate(${JSON.stringify(h)})`);await pause();};
 const tool=async(k,saved=false)=>{await run(`(()=>{const e=document.querySelector(${JSON.stringify(saved?'#workshop-analysis-tool':'#workshop-tool')});e.value=${JSON.stringify(k)};e.dispatchEvent(new Event('change'));})()`);};
 const capture=async(name,selector)=>{await run(`document.querySelector('#toast').hidden=true;document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'start',behavior:'instant'})`);await new Promise(r=>setTimeout(r,650));fs.writeFileSync(path.join(output,name+'.png'),(await win.webContents.capturePage()).toPNG());};
 try{
  await win.loadFile(path.join(__dirname,'../renderer/index.html'));await pause();
  await click('[data-input-jump=workshop-tool]');assert.equal(await run('document.activeElement.id'),'workshop-tool');
  assert.equal(await run(`document.querySelectorAll('#workshop-tool option').length`),11);
  await run(`state.setup={...state.setup,...${JSON.stringify(fixture)},totalWeight:'80',gearDiameter:'18',magneticReadings:'19,20,21'};fillInputs();persist();`);
  assert.equal(await run(`document.querySelector('#input-error').hidden`),true,await run(`document.querySelector('#input-error').textContent`));
  for(const k of ['tyres','electrical','motor','strategy','balance','experiment','rules','gears','inertia','braking','ranges']){
   await tool(k);assert.equal(await run(`document.querySelector('[data-workshop-inputs=${k}]').hidden`),false);
   assert.equal(await run(`document.querySelector('#workshop-live').textContent.includes('NaN')`),false);
   assert.equal(await run(`document.querySelector('#workshop-live').textContent.includes('Infinity')`),false);
  }
  await tool('braking');assert.match(await run(`document.querySelector('#workshop-live').textContent`),/1.5 m/);
  await click('#save-library');await run(`document.querySelector('#library-entry-name').value='Workshop measurements'`);await click('#library-editor-confirm');
  const saved=await run(`localStorage.getItem('slotforge.telemetry.library.v1')`);assert.match(saved,/tyreHistory/);
  await set('brakeRows','0,36\n0.6,0');assert.match(await run(`document.querySelector('#workshop-live').textContent`),/3 m/);
  await route('analyze');await click('[data-analysis-topic=workshop]');await tool('braking',true);
  assert.match(await run(`document.querySelector('#workshop-analysis').textContent`),/1.5 m/);
  assert.equal(await run(`document.querySelectorAll('#workshop-analysis .workshop-chart circle').length`),4);
  assert.equal(await run(`document.querySelector('[data-page=analyze]').hidden`),false);assert.equal(await run(`document.querySelector('[data-analysis-panel=workshop]').hidden`),false);await capture('workshop-braking-dark','#workshop-analysis');await click('[data-tone-choice=light]');await capture('workshop-braking-light','#workshop-analysis');
  for(const k of ['tyres','experiment']){await tool(k,true);assert.ok(await run(`document.querySelectorAll('#workshop-analysis .workshop-chart circle').length>=2`));}
  await route('settings/calculations/workshop-motor');assert.match(await run(`document.querySelector('#help-content').textContent`),/0.0000980665/);
  await click('#help-try');await pause();assert.equal(await run(`document.activeElement.name`),'motorBenchNotes');assert.equal(await run(`document.querySelector('[data-workshop-inputs=motor]').hidden`),false);
  await set('motorBenchNotes','<img src=x onerror=alert(1)>');assert.equal(await run(`document.querySelectorAll('#workshop-live img').length`),0);assert.match(await run(`document.querySelector('#workshop-live').textContent`),/<img/);
  await set('brakeRows','0,10\n0,0');assert.equal(await run(`document.querySelector('#save-library').disabled`),true);assert.equal(await run(`localStorage.getItem('slotforge.telemetry.library.v1')`),saved);
  await win.loadFile(path.join(__dirname,'../renderer/index.html'));await pause();assert.equal(await run(`document.querySelector('[name=brakeRows]').value`),'0,36\n0.6,0');
  // Exercise the real snapshot UI with a read-only source adapter; manual/Paddock adapters are covered separately.
  await run(`RaceUI.testingRuns=()=>[{id:'source-1',label:'Test car · Lane 1'}];RaceUI.testingRun=id=>id==='source-1'?{id,label:'Test car · Lane 1',times:[5,5.1,5.2]}:null;void 0;`);
  await tool('experiment');await run(`document.querySelector('#workshop-run').value='source-1'`);await click('#workshop-add-run');
  assert.match(await run(`state.setup.experimentRows`),/Test car/);assert.equal(await run('state.setup.experimentConfirmed'),'no');assert.match(await run('state.setup.experimentSources'),/source-1/);
  await capture('workshop-experiment-inputs','.workshop-inputs');
  win.setSize(760,980);await pause();
  for(const k of ['motor','electrical','experiment','rules']){await tool(k);assert.equal(await run('document.documentElement.scrollWidth<=innerWidth'),true,k);}
  await capture('workshop-inputs-760','.workshop-inputs');
  await route('analyze');await click('[data-analysis-topic=workshop]');await tool('motor',true);assert.equal(await run('document.documentElement.scrollWidth<=innerWidth'),true);
  assert.deepEqual(errors,[]);console.log('Workshop UI passed: 11 live tools, saved-only analysis, charts, help, escaping, invalid draft recovery, lap snapshots, themes and 760px layout.');win.destroy();app.quit();
 }catch(e){console.error(e);win.destroy();app.exit(1);}
});
