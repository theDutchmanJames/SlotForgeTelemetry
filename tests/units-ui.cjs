// Display units in the desktop app: Settings choice, unit-aware inputs stored as metric, converted results, persistence.
const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const output=path.join(__dirname,'../test-results');fs.mkdirSync(output,{recursive:true});
app.setPath('userData',fs.mkdtempSync(path.join(output,'units-ui-')));app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,width:1440,height:1100,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false,backgroundThrottling:false,offscreen:true}}),errors=[];
 win.webContents.on('console-message',e=>{if(e.level==='error'){errors.push(e.message);console.error(e.message);}});
 const run=s=>win.webContents.executeJavaScript(s,true),pause=()=>new Promise(r=>setTimeout(r,160)),click=s=>run(`document.querySelector(${JSON.stringify(s)}).click()`);
 const set=(name,value)=>run(`(()=>{const e=document.querySelector('[name=${name}]');e.value=${JSON.stringify(value)};e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
 const value=name=>run(`document.querySelector('[name=${name}]').value`),stored=name=>run(`state.setup.${name}`),text=s=>run(`document.querySelector(${JSON.stringify(s)}).textContent`);
 try{
  await win.loadFile(path.join(__dirname,'../renderer/index.html'));await pause();
  // Metric by default: nothing changes for existing users.
  assert.equal(await value('rearDiameter'),'20');assert.match(await text('[data-performance-result=speedKmh]'),/27\.02 km\/h/);
  await run("location.hash='settings'");await pause();assert.equal(await run("document.querySelector('[data-unit-preset=metric]').getAttribute('aria-pressed')"),'true');
  await click('[data-unit-preset=imperial]');await pause();
  await run("location.hash='telemetry'");await pause();
  // Inputs show the chosen unit; the saved setup keeps metric values until a field is edited.
  assert.equal(await value('rearDiameter'),'0.787');assert.equal(await value('motorTorque'),'3.958');assert.equal(await stored('rearDiameter'),'20');
  assert.equal(await run("document.querySelector('[name=rearDiameter]').closest('label').querySelector('[data-unit]').textContent"),'in');
  assert.equal(await run("document.querySelector('[name=totalWeight]').closest('label').querySelector('[data-unit]').textContent"),'oz');
  await set('rearDiameter','0.8');await set('totalWeight','2.82');await pause();
  assert.equal(await stored('rearDiameter'),'20.32');assert.equal(await stored('totalWeight'),'79.94566');
  assert.match(await text('[data-performance-result=speedKmh]'),/mph/);assert.match(await text('#flow-tyre'),/0\.8 in/);
  // Out-of-range checks use the converted limits and explain them in the chosen unit.
  await set('rearDiameter','2');await pause();assert.equal(await run("document.querySelector('[name=rearDiameter]').getAttribute('aria-invalid')"),'true');assert.match(await text('#input-error'),/in and .* in\./);
  await set('rearDiameter','0.8');await pause();assert.equal(await text('#input-error'),'');
  // Saved data and exported files stay metric.
  assert.match(await run("CalculatorModel.encode(state.setup,null)"),/"rearDiameter": "20.32"/);
  // Analyze and comparison follow the choice.
  await click('#save-library');await pause();await click('#library-editor-confirm');await pause();
  await run("location.hash='analyze'");await pause();assert.match(await text('#analysis-stats'),/mph/);assert.match(await text('#analysis-stats'),/oz·in/);
  await run("location.hash='analyze/compare'");await pause();assert.match(await text('#comparison'),/Car weight · oz/);
  // The choice is remembered on this device.
  await win.loadFile(path.join(__dirname,'../renderer/index.html'));await pause();assert.equal(await value('rearDiameter'),'0.8');assert.match(await text('[data-performance-result=speedKmh]'),/mph/);
  // A custom mix: only speed in mph.
  await run("location.hash='settings'");await pause();await run("const s=document.querySelector('[data-unit-quantity=length]');s.value='mm';s.dispatchEvent(new Event('change'))");await pause();
  assert.equal(await run("document.querySelector('[data-unit-preset=custom]').getAttribute('aria-pressed')"),'true');
  await run("location.hash='telemetry'");await pause();assert.equal(await value('rearDiameter'),'20.32');
  await run("location.hash='settings'");await pause();await click('[data-unit-preset=metric]');await pause();await run("location.hash='telemetry'");await pause();assert.match(await text('[data-performance-result=speedKmh]'),/km\/h/);
  assert.deepEqual(errors,[]);console.log('Units UI passed: metric default, imperial and custom choices, unit-aware inputs stored as metric, converted limits, Analyze/compare, persistence.');
 }finally{win.destroy();app.quit();}
}).catch(e=>{console.error(e);app.exit(1);});
