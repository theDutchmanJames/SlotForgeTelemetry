const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const output=path.join(__dirname,'../test-results');fs.mkdirSync(output,{recursive:true});app.setPath('userData',fs.mkdtempSync(path.join(output,'feedback-profile-')));app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,width:1440,height:1100,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false,backgroundThrottling:false,offscreen:true}}),errors=[];
 win.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message)});
 const run=s=>win.webContents.executeJavaScript(s,true),click=s=>run(`document.querySelector(${JSON.stringify(s)}).click()`),set=(s,v)=>run(`(()=>{const e=document.querySelector(${JSON.stringify(s)});e.value=${JSON.stringify(v)};e.dispatchEvent(new Event('input',{bubbles:true}));})()`),route=s=>run(`navigate(${JSON.stringify(s)})`);
 try{
  await win.loadFile(path.join(__dirname,'../renderer/index.html'));assert.deepEqual(errors,[]);
  assert.equal(await run("[...document.querySelectorAll('[placeholder]')].filter(e=>/example|[0-9]/i.test(e.placeholder)||(e.tagName==='TEXTAREA'&&e.placeholder!=='Optional')).length"),0);
  assert.equal(await run("document.querySelector('[name=tyreHistory]').value"),'');assert.match(await run("document.querySelector('#input-help-tyreHistory').textContent"),/Not entered.*Example only/);
  assert.equal(await run("document.querySelector('main footer').previousElementSibling.id"),'driver-feedback');
  await route('feedback');assert.equal(await run("document.querySelector('#driver-feedback').hidden"),false);assert.equal(await run("document.querySelectorAll('.main-nav a').length"),5);assert.equal(await run("document.querySelectorAll('#driver-feedback [required]').length"),0);
  await set('[name=adviceSymptom]','tip');await click('[data-feedback-action=next]');assert.match(await run("document.querySelector('#feedback-checks').textContent"),/roll stability/);
  await run("state.setup={...CalculatorModel.blank(),name:'My car',adviceUseSetup:'yes',adviceSymptom:'tip',totalWeight:'80',rearDiameter:'19',gearDiameter:'18'};fillInputs();persist();");await click('[data-feedback-step=setup]');assert.match(await run("document.querySelector('#feedback-basic').textContent"),/0.5 mm/);
  await run("state.setup.totalWeight='';state.setup.frontWeight='30';state.setup.rearWeight='50';fillInputs();");
  assert.match(await run("document.querySelector('[data-provenance=totalWeight]').textContent"),/Included from axle readings: 80 g/);
  assert.match(await run("document.querySelector('#feedback-basic').textContent"),/Car mass from front/);
  await set('[data-feedback-input=totalWeight]','85');assert.equal(await run('state.setup.totalWeight'),'85');assert.equal(await run("document.querySelector('[name=totalWeight]').value"),'85');
  await click('[data-feedback-step=measure]');await set('[name=adviceBodyMass]','22');assert.match(await run("document.querySelector('#feedback-measure-result').textContent"),/25.88|25.9/);
  await set('[name=adviceMeasurement]','proposal');await set('[name=adviceHeight]','14');await set('[name=adviceHeightBasis]','estimated');await set('[name=adviceProposal]','lower');await set('[name=advicePartMass]','5');await set('[name=adviceOldZ]','22');await set('[name=adviceNewZ]','3');assert.match(await run("document.querySelector('#feedback-measure-result').textContent"),/12.88/);assert.equal(await run('state.setup.totalWeight'),'85');
  await click('[data-feedback-step=test]');await set('[name=adviceTestChange]','Move existing ballast lower');await set('[name=adviceOutcome]','better');await run("state.setup.totalWeight='085';fillInputs()");await click('[data-feedback-action=record]');assert.match(await run("document.querySelector('#feedback-outcome').textContent"),/Recorded with/);
  await click('[data-feedback-action=save]');await run("document.querySelector('#library-entry-name').value='Driver feedback test'");await click('#library-editor-confirm');assert.equal(await run('library[0].setup.adviceOutcome'),'better');assert.match(await run("document.querySelector('#feedback-outcome').textContent"),/Recorded with/);
  await set('[name=adviceSymptom]','slide');assert.match(await run("document.querySelector('#feedback-outcome').textContent"),/changed since/);assert.equal(await run('library[0].setup.adviceSymptom'),'tip');
  await route('feedback');await run("document.querySelector('#feedback-library').value=library[0].id");await click('[data-feedback-action=load]');await click('#library-editor-confirm');assert.equal(await run('location.hash'),'#feedback');assert.equal(await run('state.setup.adviceSymptom'),'tip');assert.equal(await run('state.setup.adviceUseSetup'),'yes');
  await route('analyze/predicted');assert.equal(await run('location.hash'),'#feedback');await run("focusSetupInput('adviceHeight')");assert.equal(await run('document.activeElement.name'),'adviceHeight');assert.equal(await run('document.activeElement.checkVisibility()'),true);
  await click('[data-feedback-tool=chassisMode]');assert.equal(await run('document.activeElement.name'),'chassisMode');assert.equal(await run("document.querySelector('.df-return').hidden"),false);await route('feedback');
  await set('[name=adviceNotes]','<img src=x onerror=alert(1)>');await set('[name=adviceGoal]','<script>x</script>');assert.equal(await run("document.querySelectorAll('#driver-feedback img,#driver-feedback script').length"),0);
  await run("state.setup.tyreMode='rim';state.setup.rimDiameter='16';state.setup.tyreThickness='1.5';fillInputs();persist();");assert.equal(await run("document.querySelector('[data-feedback-input=rearDiameter]').value"),'19');assert.equal(await run("document.querySelector('[data-feedback-input=rearDiameter]').disabled"),true);
  await run("state.setup.adviceComponents='unfinished row';fillInputs();persist()");assert.match(await run("document.querySelector('#feedback-error').textContent"),/Component row/);
  await win.reload();await new Promise(r=>setTimeout(r,500));await route('feedback');assert.equal(await run('state.setup.adviceTestChange'),'Move existing ballast lower');assert.equal(await run('state.setup.adviceComponents'),'unfinished row');await set('[name=adviceComponents]','');
  for(const value of await run("PredictionModel.fields.adviceMeasurement.options.map(x=>x.split('|')[0])")){await set('[name=adviceMeasurement]',value);assert.equal(await run("[...document.querySelectorAll('[data-feedback-tool]')].every(b=>document.querySelector('[name='+b.dataset.feedbackTool+']'))"),true,'Valid tool destinations');}
  // Guided questions, persistent individual checks, full evidence and explicit test links.
  await run("state.setup={...CalculatorModel.blank(),name:'Guided review',adviceSymptom:'slide'};fillInputs();persist();");await click('[data-feedback-step=checks]');
  assert.match(await run("document.querySelector('[data-feedback-panel=checks] .feedback-next-question').textContent"),/rear step out/);
  await set('[data-feedback-panel=checks] [data-feedback-question=adviceSlideWhen]','power');assert.equal(await run('state.setup.adviceSlideWhen'),'power');
  assert.equal(await run("document.querySelector('[data-feedback-panel=checks] [data-feedback-question]').dataset.feedbackQuestion"),'adviceWheelspin');
  await click('[data-feedback-check=tyres][data-check-status=clear]');assert.equal(await run('DriverFeedbackModel.analyze(calculationInput()).checks.statuses.tyres'),'clear');
  await click('[data-feedback-check=body][data-check-status=issue]');assert.equal(await run('DriverFeedbackModel.analyze(calculationInput()).suggestions[0].id'),'check-body');
  await run("state.setup.tyreLeft='19';fillInputs();persist();");assert.match(await run("document.querySelector('#feedback-check-list').textContent"),/Some checks need another look/);
  await click('[data-feedback-check=tyres][data-check-status=clear]');assert.equal(await run('DriverFeedbackModel.analyze(calculationInput()).checks.statuses.body'),undefined);assert.equal(await run('DriverFeedbackModel.analyze(calculationInput()).checks.statuses.tyres'),'clear');
  await set('#feedback-evidence-topic','all');assert.equal(await run("document.querySelectorAll('#feedback-evidence-results>details').length"),79);
  await set('#feedback-evidence-search','Elva');assert.match(await run("document.querySelector('#feedback-evidence-results').textContent"),/exposed two-wheel lift/);
  await set('#feedback-evidence-search','<img onerror=alert(1)>');assert.equal(await run("document.querySelectorAll('#feedback-evidence-results img').length"),0);await set('#feedback-evidence-search','');
  await click('[data-feedback-check=body][data-check-status=clear]');await click('#feedback-checks [data-feedback-test]');
  assert.equal(await run('state.setup.adviceStep'),'test');assert.ok(await run('state.setup.adviceTestId'));await set('[name=adviceOutcome]',await run("state.setup.adviceTestKind==='inspection'?'clear':'same'"));await click('[data-feedback-action=record]');
  assert.equal(await run('DriverFeedbackModel.analyze(calculationInput()).resultState'),'recorded');
  await click('[data-feedback-action=save]');await run("document.querySelector('#library-entry-name').value='Guided review'");await click('#library-editor-confirm');
  assert.ok(await run("library.find(e=>e.setup.name==='Guided review').setup.adviceCheckLog"));
  await win.reload();await new Promise(r=>setTimeout(r,250));await route('feedback');assert.equal(await run('DriverFeedbackModel.analyze(calculationInput()).checks.statuses.body'),'clear');
  // Distinct routes, skippable questions, answer editing and accessible optional checks.
  const routeCases={tip:['adviceTipFirst','front','adviceGuideWhen'],slide:['adviceSlideWhen','power','adviceWheelspin'],snap:['adviceCatchResult','hop','adviceHopWhen'],guide:['adviceGuideWhen','accel','adviceGuideFirst'],hop:['adviceHopWhen','power','adviceGentle'],slow:['adviceWeakWhere','revs','adviceDriveSlip'],brake:['adviceBrakeFeel','weak','adviceBrakeAdjust'],fade:['adviceFadeWhat','grip','adviceCleaning'],consistent:['adviceConsistentWhat','times','adviceRunContext'],unknown:['adviceUnknownWhat','tip','adviceTipFirst']};
  for(const [symptom,[first,value,next]] of Object.entries(routeCases)){
   await run("state.setup={...CalculatorModel.blank(),adviceSymptom:"+JSON.stringify(symptom)+"};fillInputs();persist();");await click('[data-feedback-step=experience]');
   assert.equal(await run("document.querySelector('[data-feedback-panel=experience] [data-feedback-question]').dataset.feedbackQuestion"),first);
   await set('[data-feedback-panel=experience] [data-feedback-question='+first+']',value);
   assert.equal(await run("document.querySelector('[data-feedback-panel=experience] [data-feedback-question]').dataset.feedbackQuestion"),next);
   assert.equal(await run("document.querySelector('#feedback-answers [data-feedback-question='+"+JSON.stringify(first)+"+']').value"),value);
  }
  await run("state.setup={...CalculatorModel.blank(),name:'Route retention',adviceSymptom:'slow',adviceUseSetup:'yes',totalWeight:'80',adviceHeight:'14',rearDiameter:'19',gearDiameter:'18'};fillInputs();persist();");
  await set('[data-feedback-panel=experience] [data-feedback-question=adviceWeakWhere]','revs');
  await click('[data-feedback-panel=experience] [data-feedback-skip=adviceDriveSlip]');assert.equal(await run("FeedbackRoutes.list(state.setup.adviceRouteSkipped).includes('adviceDriveSlip')"),true);
  await click('[data-feedback-action=restore-questions]');assert.equal(await run("document.querySelector('[data-feedback-panel=experience] [data-feedback-question]').dataset.feedbackQuestion"),'adviceDriveSlip');
  await set('[data-feedback-panel=experience] [data-feedback-question=adviceDriveSlip]','rim');
  assert.match(await run("document.querySelector('#feedback-checks').textContent"),/tyre-to-rim attachment/);
  await run("focusSetupInput('adviceDriveSlip')");assert.equal(await run('document.activeElement.dataset.feedbackQuestion'),'adviceDriveSlip');assert.equal(await run('document.activeElement.checkVisibility()'),true);
  await set('[data-feedback-panel=experience] [data-feedback-question=adviceDriveSlip]','none');
  await click('[data-feedback-step=checks]');assert(await run("document.querySelector('#feedback-checks a[href=\"https://slotracer.online/manual/tuning.php\"]')!==null"));
  await click('#feedback-checks [data-feedback-unable=route-drive-slip]');assert.equal(await run("document.querySelector('#feedback-checks [data-feedback-rule=route-drive-slip]')"),null);
  assert.match(await run("document.querySelector('#feedback-checks').textContent"),/easier observation/);
  await click('[data-feedback-action=restore-actions]');await click('#feedback-checks [data-feedback-test=route-drive-slip]');assert.equal(await run('state.setup.adviceTestKind'),'inspection');
  assert.equal(await run("document.querySelector('[name=adviceOutcome] option[value=better]').disabled"),true);
  await set('[name=adviceOutcome]','uncertain');await click('[data-feedback-action=record]');assert.equal(await run('DriverFeedbackModel.analyze(calculationInput()).resultState'),'recorded');
  await set('[name=adviceOutcome]','different');await set('[name=adviceSecondary]','tip');await click('[data-feedback-action=record]');
  await click('[data-feedback-action=secondary]');assert.match(await run("document.querySelector('#library-editor-title').textContent"),/Keep this investigation/);
  await click('#library-editor-cancel');assert.equal(await run('state.setup.adviceSymptom'),'slow');
  await click('[data-feedback-action=secondary]');await click('#library-editor-confirm');
  assert.equal(await run('state.setup.adviceSymptom'),'tip');assert.equal(await run('state.setup.adviceOutcome'),'unknown');assert.equal(await run('state.setup.adviceStep'),'experience');assert.equal(await run('state.setup.adviceHeight'),'14');assert.equal(await run('state.setup.totalWeight'),'80');assert.equal(await run('activeLibraryId'),null);
  assert.equal(await run("library.find(e=>e.setup.name==='Route retention').setup.adviceOutcome"),'different');
  assert.equal(await run("library.find(e=>e.setup.name==='Route retention').setup.adviceDriveSlip"),'none');
  await win.reload();await new Promise(r=>setTimeout(r,250));await route('feedback');assert.equal(await run('state.setup.adviceSymptom'),'tip');
  // Reset is explicit, cancel-safe and preserves car measurements and saved evidence.
  await run("state.setup.adviceTipFirst='lift';state.setup.adviceNotes='Reset draft';state.setup.adviceOutcome='fault';state.setup.adviceTestChange='Inspect movement';state.setup.adviceCheckLog=FeedbackChecks.mark(calculationInput(),'body','issue');fillInputs();persist();");
  await click('[data-feedback-action=reset]');assert.match(await run("document.querySelector('#library-editor-description').textContent"),/measurements are kept/);await click('#library-editor-cancel');
  assert.equal(await run('state.setup.adviceTipFirst'),'lift');assert.equal(await run('state.setup.adviceNotes'),'Reset draft');
  await click('[data-feedback-action=reset]');await click('#library-editor-confirm');
  assert.equal(await run('state.setup.adviceSymptom'),'unknown');assert.equal(await run('state.setup.adviceStep'),'experience');assert.equal(await run('state.setup.adviceUseSetup'),'no');assert.equal(await run('state.setup.adviceCheckLog'),'');assert.equal(await run('state.setup.adviceTestChange'),'');assert.equal(await run('state.setup.adviceNotes'),'');assert.equal(await run('state.setup.adviceOutcome'),'unknown');assert.equal(await run('state.setup.adviceHeight'),'14');assert.equal(await run('state.setup.totalWeight'),'80');assert.equal(await run('activeLibraryId'),null);
  assert.equal(await run("library.find(e=>e.setup.name==='Route retention').setup.adviceOutcome"),'different');assert.equal(await run('document.activeElement.name'),'adviceSymptom');
  await win.reload();await new Promise(r=>setTimeout(r,250));await route('feedback');assert.equal(await run('state.setup.adviceSymptom'),'unknown');assert.equal(await run('state.setup.adviceHeight'),'14');
  // All unresolved numerical findings must be visible, even beyond the compact first three.
  await run("state.setup={...CalculatorModel.blank(),adviceUseSetup:'yes',adviceSymptom:'tip',rearDiameter:'19',gearDiameter:'20',tyreMinimum:'20',tyreLeft:'19',tyreRight:'18.8',rulesRows:'Mass | 85 | - | 80 | g'};fillInputs();");await click('[data-feedback-step=checks]');
  for(const id of ['gear-clearance','tyre-mismatch','tyre-minimum','class-limits'])assert.equal(await run("document.querySelector('#feedback-checks [data-feedback-rule='+"+JSON.stringify(id)+"+']').checkVisibility()"),true,id);
  await run("focusSetupInput('adviceOldZ')");assert.equal(await run('document.activeElement.checkVisibility()'),true);
  for(const width of [1440,760,390]){win.setContentSize(width,1100);for(const tone of ['light','dark']){await click('[data-tone-choice='+tone+']');for(const step of ['experience','checks','setup','measure','test']){await click('[data-feedback-step='+step+']');assert.equal(await run('document.documentElement.scrollWidth<=innerWidth'),true,width+'/'+tone+'/'+step);}await click('[data-feedback-step=experience]');fs.writeFileSync(path.join(output,'feedback-'+width+'-'+tone+'.png'),(await win.webContents.capturePage()).toPNG());}}
  await route('analyze');assert.equal(await run("document.querySelector('#driver-feedback').hidden"),true);await route('settings/calculations/predicted');await click('#help-try');await new Promise(r=>setTimeout(r,100));assert.equal(await run('location.hash'),'#feedback');assert.equal(await run('document.activeElement.name'),'adviceSymptom');assert.deepEqual(errors,[]);
  console.log('Driver Feedback UI passed: guidance, shared data, calculations, outcomes, save/reload, legacy routes, help and responsive themes.');win.destroy();app.quit();
 }catch(e){console.error(e);console.error(errors);win.destroy();app.exit(1);}
});
