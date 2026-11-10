const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const output=path.join(__dirname,'../test-results');fs.mkdirSync(output,{recursive:true});
app.setPath('userData',fs.mkdtempSync(path.join(output,'prediction-profile-')));app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,width:1440,height:1100,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false,backgroundThrottling:false,offscreen:true}}),errors=[];
 win.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message);});
 const run=s=>win.webContents.executeJavaScript(s,true).catch(e=>{console.error('Failed renderer check:',s,'Console:',errors);throw e;}),pause=()=>new Promise(r=>setTimeout(r,120));
 const click=s=>run(`document.querySelector(${JSON.stringify(s)}).click()`);
 const set=(name,value)=>run(`(()=>{const e=document.querySelector('[name='+${JSON.stringify(name)}+']');e.value=${JSON.stringify(value)};e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
 const route=async h=>{await run(`navigate(${JSON.stringify(h)})`);await pause();};
 const capture=async (name,selector='#prediction-page')=>{await run(`document.querySelector('#toast').hidden=true;document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'start',behavior:'instant'})`);await pause();fs.writeFileSync(path.join(output,name+'.png'),(await win.webContents.capturePage()).toPNG());};
 try{
  await win.loadFile(path.join(__dirname,'../renderer/index.html'));await pause();assert.deepEqual(errors,[]);
  assert.equal(await run("[...document.querySelectorAll('[placeholder]')].filter(e=>/example|192|[0-9]/i.test(e.placeholder)||(e.tagName==='TEXTAREA'&&e.placeholder!=='Optional')).length"),0);
  assert.equal(await run("document.querySelector('[name=tyreHistory]').value"),'');
  assert.match(await run("document.querySelector('#input-help-tyreHistory').textContent"),/Not entered.*Example only/);
  assert.match(await run("document.querySelector('#input-help-tyreHistory code').textContent"),/500, 20.2/);
  await set('tyreHistory','0,19');assert.match(await run("document.querySelector('#input-help-tyreHistory').textContent"),/Your input is entered/);
  await set('tyreHistory','');
  await set('magneticReadings','0');assert.match(await run("document.querySelector('#input-help-magneticReadings').textContent"),/Your input is entered/);await set('magneticReadings','');
  await run("focusSetupInput('tyreHistory')");
  for(const tone of ['light','dark']){await click('[data-tone-choice='+tone+']');await capture('input-help-'+tone,'#input-help-tyreHistory');}
  assert.equal(await run("[...document.querySelectorAll('[data-input-example]')].every(e=>(e.getAttribute('aria-describedby')||'').includes('input-help-'+(e.name||e.id)))"),true);
  await route('analyze/predicted');assert.equal(await run(`document.querySelector('#prediction-page').hidden`),false);assert.equal(await run(`document.querySelector('#analysis-empty').hidden`),true);
  await set('adviceSymptom','tip');assert.match(await run(`document.querySelector('#prediction-recommendations').textContent`),/Investigate roll stability/);assert.doesNotMatch(await run(`document.querySelector('#prediction-evidence').textContent`),/7\.16|27\.02/);
  assert.equal(await run(`document.querySelectorAll('#prediction-page [required]').length`),0);
  await set('adviceNotes','<img src=x onerror=alert(1)>');await set('adviceGoal','<script>no()</script>');assert.equal(await run(`document.querySelectorAll('#prediction-page img,#prediction-page script').length`),0);
  assert.equal(await run(`document.querySelector('[name=adviceUseSetup]').checkVisibility()`),true);
  assert.match(await run(`document.querySelector('#prediction-hint-adviceTrack').textContent`),/Saved notes only/);
  await click('[data-prediction-area=drive]');assert.equal(await run(`document.querySelectorAll('#prediction-recommendations table').length`),0);
  await run(`state.setup={...CalculatorModel.blank(),adviceSymptom:'tip',adviceUseSetup:'yes',totalWeight:'80',pinion:'10',gear:'30',rearDiameter:'19',ratedRpm:'18000'};fillInputs();persist();`);
  assert.match(await run(`document.querySelector('#prediction-recommendations').textContent`),/No-load speed/);assert.doesNotMatch(await run(`document.querySelector('#prediction-recommendations').textContent`),/Unknown mm|Compound gears & geometry/);
  await capture('prediction-stock-results','#prediction-recommendations');
  await click('[data-prediction-area=handling]');await click('[data-prediction-field=adviceHeight]');assert.equal(await run('document.activeElement.name'),'adviceHeight');assert.equal(await run(`document.activeElement.checkVisibility()`),true);
  await run(`focusSetupInput('adviceComponents')`);assert.equal(await run(`document.activeElement.checkVisibility()`),true);
  await click('[data-prediction-area=control]');assert.equal(await run(`document.querySelectorAll('#prediction-recommendations table').length`),0);
  await click('[data-prediction-field=brakeRows]');assert.equal(await run('document.activeElement.name'),'brakeRows');assert.equal(await run(`document.activeElement.checkVisibility()`),true);
  await route('analyze/predicted');await set('gearDiameter','18');await set('tyreRequiredGap','17');await click('[data-prediction-area=tyres]');assert.doesNotMatch(await run(`document.querySelector('#prediction-recommendations').textContent`),/52 mm|−33|-33/);assert.match(await run(`document.querySelector('#prediction-recommendations').textContent`),/0.5 mm/);
  assert.match(await run("document.querySelector('.prediction-input-state').textContent"),/Wear history: Not entered/);
  await set('tyreHistory','0,19.2\n100,19');await set('tyreMinimum','18');await set('tyreRequiredGap','');
  assert.match(await run("document.querySelector('.prediction-input-state').textContent"),/Wear history: 2 recorded/);
  assert.equal(await run("document.querySelectorAll('.prediction-next [data-prediction-field=tyreHistory]').length"),0);
  await set('tyreHistory','');
  await capture('prediction-tyre-limits','#prediction-recommendations');
  await click('[data-prediction-field=rearDiameter]');assert.equal(await run('document.activeElement.name'),'rearDiameter');
  await run(`state.setup.tyreMode='rim';fillInputs();persist();focusSetupInput('rearDiameter')`);assert.equal(await run('document.activeElement.name'),'rimDiameter');assert.equal(await run(`document.activeElement.checkVisibility()`),true);
  await route('analyze/predicted');await click('[data-prediction-area=handling]');
  await run(`state.setup={...CalculatorModel.blank(),adviceSymptom:'tip',adviceUseSetup:'yes',totalWeight:'80',adviceHeight:'14',adviceHeightBasis:'estimated',adviceProposal:'lower',advicePartMass:'5',adviceOldZ:'22',adviceNewZ:'3'};fillInputs();persist();`);
  await click('[data-prediction-tab=change]');assert.match(await run(`document.querySelector('#prediction-comparison').textContent`),/12\.81/);assert.equal(await run('state.setup.totalWeight'),'80');
  await click('#prediction-plan-test');await set('adviceTestChange','Move existing ballast lower');await set('adviceTestObservations','A: tipped twice; B: not tested yet.');
  await click('#prediction-save');await run(`document.querySelector('#library-entry-name').value='Tipping investigation'`);await click('#library-editor-confirm');
  assert.equal(await run('library[0].setup.adviceTestChange'),'Move existing ballast lower');
  await set('adviceHeight','15');assert.equal(await run('library[0].setup.adviceHeight'),'14');
  await route('analyze/predicted');await run(`document.querySelector('#prediction-library').value=library[0].id`);await click('#prediction-load');await click('#library-editor-confirm');await pause();assert.equal(await run('location.hash'),'#analyze/predicted');assert.equal(await run('state.setup.adviceHeight'),'14');
  await click('#prediction-open-tests');assert.equal(await run('document.activeElement.name'),'experimentRows');
  await set('experimentRows','A before | A | 5,5.1,5.2\nB trial | B | 5.1,5.0,5.3\nA return | A | 5,5.2,5.1');
  await run(`document.querySelector('#chassis-test-setup').value=library[0].id;document.querySelector('#chassis-test-row').value='0'`);await click('#chassis-test-capture');
  assert.equal(await run('ChassisTestModel.records(state.setup.chassisRunSnapshots)[0].prediction.adviceHeight'),'14');
  await route('analyze/predicted');await click('[data-prediction-tab=test]');assert.match(await run(`document.querySelector('#prediction-test-evidence').textContent`),/A/);
  await run(`state.setup.adviceComponents='unfinished row';fillInputs();persist();`);assert.match(await run(`document.querySelector('#prediction-status').textContent`),/Component row/);assert.equal(await run(`document.querySelector('#prediction-save').disabled`),false);
  await win.loadFile(path.join(__dirname,'../renderer/index.html'));await pause();assert.equal(await run('state.setup.adviceComponents'),'unfinished row');await set('adviceComponents','');
  await route('settings/calculations/predicted');await click('#help-try');await pause();assert.equal(await run('location.hash'),'#analyze/predicted');assert.equal(await run('document.activeElement.name'),'adviceSymptom');
  for(const width of [1440,760,390]){win.setSize(width,1100);await pause();for(const tone of ['light','dark']){await click('[data-tone-choice='+tone+']');for(const tab of ['outlook','change','test']){await click('[data-prediction-tab='+tab+']');assert.equal(await run('document.documentElement.scrollWidth<=innerWidth'),true,width+'/'+tone+'/'+tab);}
    await click('[data-prediction-tab=outlook]');await capture('prediction-'+width+'-'+tone);}}
  for(const area of ['drive','tyres','control','race','checks'])await click('[data-prediction-area='+area+']');
  await route('analyze/races');assert.equal(await run(`document.querySelector('#prediction-page').hidden`),true);await route('analyze');assert.equal(await run(`document.querySelector('#prediction-page').hidden`),true);assert.equal(await run(`document.querySelector('#analysis-content').hidden`),false);
  assert.deepEqual(errors,[]);console.log('Prediction UI passed: no-setup guidance, optional fields, escaping, proposals, library round-trip, immutable evidence, incomplete input recovery, help, routing and both themes at 390/760/1440px.');win.destroy();app.quit();
 }catch(e){console.error(e);win.destroy();app.exit(1);}
});
