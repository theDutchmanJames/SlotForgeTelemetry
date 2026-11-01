// Exercise real page workflows in an isolated Electron profile.
const {app,BrowserWindow}=require('electron'),path=require('node:path'),fs=require('node:fs'),assert=require('node:assert/strict');
const output=path.join(__dirname,'../test-results');fs.mkdirSync(output,{recursive:true});
app.setPath('userData',path.join(output,'pages-profile'));app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,width:1440,height:1100,webPreferences:{contextIsolation:true,nodeIntegration:false,sandbox:true,backgroundThrottling:false}});
 const errors=[];win.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message);});
 const run=s=>win.webContents.executeJavaScript(s,true),pause=()=>new Promise(r=>setTimeout(r,100));
 const click=s=>run(`document.querySelector(${JSON.stringify(s)}).click()`);
 const value=(s,v,event='input')=>run(`(()=>{const e=document.querySelector(${JSON.stringify(s)});e.value=${JSON.stringify(v)};e.dispatchEvent(new Event('${event}',{bubbles:true}));})()`);
 const set=(name,v)=>value('[name="'+name+'"]',v);
 const text=s=>run(`document.querySelector(${JSON.stringify(s)}).textContent`);
 const route=async s=>{await run(`location.hash=${JSON.stringify(s)};void 0;`);await pause();};
 const capture=async (name,selector)=>{if(selector)await run(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'start'})`);else await run('window.scrollTo(0,0)');await run('document.querySelector("#toast").hidden=true;new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');await pause();fs.writeFileSync(path.join(output,name+'.png'),(await win.webContents.capturePage()).toPNG());};
 const reload=()=>win.loadFile(path.join(__dirname,'../renderer/index.html'));
 const data=()=>run(`JSON.parse(localStorage.getItem('slotforge.telemetry.library.v1')).entries`);
 const save=async name=>{await click('#save-library');await value('#library-entry-name',name);await click('#library-editor-confirm');};
 const importFile=async(id,body)=>{await run(`(()=>{const t=new DataTransfer();t.items.add(new File([${JSON.stringify(body)}],'import.json'));const e=document.querySelector(${JSON.stringify(id)});e.files=t.files;e.dispatchEvent(new Event('change'));})()`);await pause();};
 const download=async(selector,name)=>{const done=new Promise((resolve,reject)=>win.webContents.session.once('will-download',(_e,item)=>{item.setSavePath(path.join(output,name));item.once('done',(_e,status)=>status==='completed'?resolve():reject(Error(status)));}));await click(selector);await done;return fs.readFileSync(path.join(output,name),'utf8');};
 try{
  await reload();await run('localStorage.clear()');await reload();
  assert.equal(await text('#ratio-inline'),'3.000:1');assert.match(await text('#stats'),/27.02/);
  assert.equal(await run(`document.querySelectorAll('[data-page=telemetry] .performance-curve').length`),0);
  assert.equal(await run(`document.querySelectorAll('.main-nav a').length`),4);
  assert.equal(await run(`document.querySelectorAll('[data-input-jump]').length`),6);
  assert.equal(await run(`document.querySelector('[name=wheelbase]').closest('details')`),null);
  assert.equal(await run(`document.querySelector('[name=gearDiameter]').closest('.input-column')!==null`),true);
  await click('[data-input-jump=trackLength]');assert.equal(await run('document.activeElement.name'),'trackLength');
  await click('[data-input-jump=totalWeight]');assert.equal(await run('document.activeElement.name'),'totalWeight');
  assert.deepEqual(await run(`Array.from(document.querySelectorAll('.part-illustration svg')).map(i=>i.dataset.paddockIcon)`),['short-can-motor','motor-pinion','spur-gear','wheel-tyre-set']);
  assert.equal(await run(`getComputedStyle(document.querySelector('[data-category=motor] .icon-tile')).color===getComputedStyle(document.querySelector('.drive-flow [data-category=motor] .part-illustration')).color`),true);
  assert.equal(await run(`document.querySelector('.drive-flow [data-category=tyres] svg circle').getAttribute('r')`),'93');
  await route('analyze');assert.equal(await run(`document.querySelector('#analysis-empty').hidden`),false);
  await route('telemetry');await set('totalWeight','80');await set('ballast','20');await set('frontWeight','32');await set('rearWeight','48');await set('wornDiameter','19');await set('trackLength','20');await set('lapTime','5');await set('scaleFactor','32');
  await set('wheelbase','80');await set('ballastPosition','60');await set('gearDiameter','18');
  assert.match(await text('#stats [data-telemetry=ballast-front]'),/37 g/);assert.match(await text('#stats [data-telemetry=ballast-cg]'),/50.4 mm/);assert.match(await text('#stats [data-telemetry=clearance]'),/1 mm/);
  await set('ballastPosition','81');assert.equal(await run("document.querySelector('#save-library').disabled"),true);assert.match(await text('#input-error'),/between/);await set('ballastPosition','60');
  await set('gearDiameter','20');assert.match(await text('#stats'),/no clearance/);await set('gearDiameter','21');assert.match(await text('#stats'),/below the tyre contact plane/);await set('gearDiameter','18');
  await set('name','Club GT · technical');await capture('telemetry-v4');await save('Club GT · technical');
  assert.equal((await data()).length,1);
  for(const [topic,field] of [['weight','totalWeight'],['wear','wornDiameter'],['gears','targetRollout'],['laps','trackLength']]){
    await route('analyze');await click('[data-analysis-topic='+topic+']');await click('[data-edit-inputs='+field+']');await click('#library-editor-confirm');await pause();
    assert.equal(await run('location.hash'),'#telemetry');assert.equal(await run('document.activeElement.name'),field);
  }
  await route('analyze');await click('[data-analysis-topic=performance]');
  await route('analyze');assert.equal(await run(`document.querySelectorAll('#curve-results .performance-curve').length`),2);
  assert.match(await text('#analysis-stats'),/27.02/);await capture('analyze-v4');
  await value('#build-curve-speed','0');assert.match(await text('#build-curve-readout'),/0 motor RPM/);
  await value('#build-curve-speed','50');
  await click('[data-analysis-topic=weight]');assert.match(await text('#weight-results'),/196.64/);assert.match(await text('[data-telemetry=acceleration]'),/52.4/);assert.match(await text('#weight-results [data-telemetry=ballast-cg]'),/50.4 mm/);await capture('balance-v6','#weight-results .calculation-detail');
  await click('[data-analysis-topic=wear]');assert.match(await text('[data-telemetry=ride-height]'),/-0.5/);assert.match(await text('#wear-results [data-telemetry=worn-clearance]'),/0.5 mm/);await capture('clearance-v6');
  await click('[data-analysis-topic=laps]');assert.match(await text('#laps-results'),/460.8/);
  await click('[data-analysis-topic=gears]');await click('[data-gearing="8,24"]');await click('#library-editor-confirm');
  assert.equal(await run('state.setup.pinion'),'8');assert.equal((await data())[0].setup.pinion,'9');
  await set('pinion','9');await set('gear','27');
  await route('telemetry');await set('pinion','10');assert.equal((await data())[0].setup.pinion,'9');
  await route('analyze');assert.match(await text('#analysis-stats'),/27.02/);
  await route('telemetry');await click('#save-copy');await value('#library-entry-name','Club GT · fast circuit');await click('#library-editor-confirm');
  assert.equal((await data()).length,2);await route('analyze/compare');
  assert.equal(await run(`document.querySelectorAll('#analysis-compare svg').length`),0);
  assert.equal(await run(`document.querySelector('[data-compare-metric=speedKmh] td:last-child').className`),'good');
  assert.equal(await run(`document.querySelector('[data-compare-metric=forceN] td:last-child').className`),'bad');
  await capture('compare-v4');await route('library');await capture('library-v4');
  await click('[data-library-action=duplicate]');assert.equal((await data()).length,3);
  await click('[data-library-action=rename]');await value('#library-entry-name','<b>Race trim</b>');await click('#library-editor-confirm');assert.match(await text('#library-list'),/<b>Race trim<\/b>/);assert.equal(await run(`document.querySelectorAll('#library-list b').length`),0);
  await value('#library-search','Race trim');assert.equal(await run(`document.querySelectorAll('.select-setup').length`),1);
  await click('[data-library-action=delete]');await click('#library-editor-cancel');assert.equal((await data()).length,3);
  await click('[data-library-action=delete]');await click('#library-editor-confirm');assert.equal((await data()).length,2);await click('#library-undo');assert.equal((await data()).length,3);
  await value('#library-search','');
  assert.equal((await data())[0].setup.gearDiameter,'18');assert.equal((await data())[0].setup.ballastPosition,'60');
  const backup=await download('#library-backup','library-v4.json');assert.equal(require('../renderer/library-model.js').decode(backup).length,3);
  await importFile('#library-file',backup);assert.equal((await data()).length,6);await importFile('#library-file','{}');assert.equal((await data()).length,6);
  await click('[data-library-action=load]');await click('#library-editor-confirm');await pause();assert.equal(await run('location.hash'),'#telemetry');
  await set('pinion','11');await save('Updated setup');assert.equal((await data()).find(e=>e.setup.name==='Updated setup').setup.pinion,'11');
  await set('tyreMode','rim');await set('rimDiameter','17');await set('tyreThickness','2');assert.match(await text('#flow-tyre'),/21 mm/);
  await set('pinion','-1');assert.equal(await run(`document.querySelector('#save-library').disabled`),true);await set('pinion','10');
  const exported=await download('#save-setup','setup-v4.json');assert.equal(require('../renderer/calculator-model.js').decode(exported).setup.pinion,'10');
  await importFile('#setup-file','{}');assert.equal(await run(`state.setup.pinion`),'10');
  await set('pinion','12');await importFile('#setup-file',exported);assert.equal(await run(`state.setup.pinion`),'12');await click('#library-editor-cancel');assert.equal(await run(`state.setup.pinion`),'12');await importFile('#setup-file',exported);await click('#library-editor-confirm');assert.equal(await run(`state.setup.pinion`),'10');
  await route('settings');await click('[data-theme-choice=midnight]');await click('[data-tone-choice=light]');await click('[data-theme-choice=ocean]');await click('[data-tone-choice=dark]');assert.equal(await run('document.documentElement.dataset.theme'),'midnight');
  await reload();await click('[data-tone-choice=light]');assert.equal(await run('document.documentElement.dataset.theme'),'ocean');
  await route('settings');await click('[data-theme-choice=custom]');await value('[data-color=accent]','#00ff00');assert.equal(await run(`getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()`),'#00ff00');
  await click('[data-theme-choice=dark]');await capture('settings-v4');
  await route('settings/calculations/balance');assert.match(await text('#help-content'),/50.4/);await route('settings/calculations/clearance');assert.match(await text('#help-content'),/tooth count/);
  await route('settings/calculations/gearing');assert.match(await text('#help-content'),/20.94/);
  await click('[data-tone-choice=light]');await capture('help-v4');await click('#help-try');await pause();assert.equal(await run('document.activeElement.name'),'pinion');
  // A failed library write never replaces the saved snapshots.
  await click('#save-library');await value('#library-entry-name','Quota test');
  await run(`window.originalSet=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='slotforge.telemetry.library.v1')throw new DOMException('Full','QuotaExceededError');return window.originalSet.call(this,k,v);};void 0;`);
  await click('#library-editor-confirm');assert.match(await text('#library-editor-error'),/Could not save/);assert.equal((await data()).length,6);
  await run('Storage.prototype.setItem=window.originalSet;void 0;');await click('#library-editor-cancel');
  const valid=await run(`localStorage.getItem('slotforge.telemetry.library.v1')`);
  await run(`localStorage.setItem('slotforge.telemetry.library.v1','broken')`);await reload();assert.equal(await run(`document.querySelector('#save-library').disabled`),true);assert.equal(await run(`localStorage.getItem('slotforge.telemetry.library.v1')`),'broken');
  await run(`localStorage.setItem('slotforge.telemetry.library.v1',${JSON.stringify(valid)})`);await reload();
  // Review regressions: notation, bounds, correct Analyze destination and draft protection.
  await route('telemetry');await set('ratedRpm','2.15e4');await set('pinion','1e1');assert.equal(await run("document.querySelector('#input-error').hidden"),true);
  await set('pinion','1000000');assert.equal(await run("document.querySelector('#save-library').disabled"),true);await set('pinion','10');
  const numericImport=JSON.stringify({format:'slotforge-calculator',version:1,setup:{...require('../renderer/calculator-model.js').EXAMPLE,pinion:'+9',gear:'27.',ratedRpm:'+21500',rearDiameter:'20.',tyreMode:'rim',rimDiameter:'16.',tyreThickness:'+2',totalWeight:'+80',ballast:'-0'}});
  await importFile('#setup-file',numericImport);if(await run("document.querySelector('#library-editor').open"))await click('#library-editor-confirm');
  for(const [field,expected] of [['pinion','9'],['gear','27'],['ratedRpm','21500'],['rimDiameter','16'],['tyreThickness','2'],['totalWeight','80'],['ballast','0']])assert.equal(await run('document.querySelector('+JSON.stringify('[name='+field+']')+').value'),expected);
  assert.match(await text('#flow-tyre'),/20 mm/);assert.equal(await run("document.querySelector('#input-error').hidden"),true);
  await save('Review setup');const reviewId=await run('activeLibraryId');
  await run('analysisId=library.find(e=>e.id!==activeLibraryId).id;void 0;');await click('.next-step a');await pause();assert.equal(await run('analysisId'),reviewId);
  await route('telemetry');await set('pinion','11');await click('#new-setup');await click('#library-editor-cancel');assert.equal(await run('state.setup.pinion'),'11');
  await click('#load-example');await click('#library-editor-cancel');assert.equal(await run('state.setup.pinion'),'11');
  await click('#new-setup');await click('#library-editor-confirm');assert.equal(await run('state.setup.pinion'),'');await click('#load-example');
  // Failed or cancelled recovery never destroys the original unreadable bytes.
  await run("localStorage.setItem('slotforge.telemetry.library.v1','damaged-data')");await reload();await route('library');
  assert.equal(await run('library.length'),0);assert.equal(await download('#library-recover-export','unreadable-library.txt'),'damaged-data');
  await importFile('#library-file','{}');assert.equal(await run("localStorage.getItem('slotforge.telemetry.library.v1')"),'damaged-data');
  await importFile('#library-file',valid);await click('#library-editor-cancel');assert.equal(await run("localStorage.getItem('slotforge.telemetry.library.v1')"),'damaged-data');
  await importFile('#library-file',valid);
  await run("window.originalSet=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='slotforge.telemetry.library.v1')throw new DOMException('Full','QuotaExceededError');return window.originalSet.call(this,k,v);};void 0;");
  await click('#library-editor-confirm');assert.match(await text('#library-editor-error'),/Could not save/);assert.equal(await run("localStorage.getItem('slotforge.telemetry.library.v1')"),'damaged-data');
  await run('Storage.prototype.setItem=window.originalSet;void 0;');await click('#library-editor-confirm');assert.equal((await data()).length,6);assert.equal(await run('libraryError'),'');
  // A concurrently replaced library is reloaded, never overwritten from a stale dialog.
  await route('telemetry');await click('#save-library');await value('#library-entry-name','Concurrent write');
  await run("localStorage.setItem('slotforge.telemetry.library.v1',JSON.stringify({format:'slotforge-telemetry-library',version:1,entries:[]}))");
  await click('#library-editor-confirm');assert.match(await text('#library-editor-error'),/changed/);assert.equal((await data()).length,0);await click('#library-editor-cancel');
  await run('localStorage.setItem("slotforge.telemetry.library.v1",'+JSON.stringify(valid)+')');await reload();
  // Invalid remembered modes cannot trap the Light/Dark switch in the wrong tone.
  await run("localStorage.setItem('slotforge.calculator.appearance.v1',JSON.stringify({theme:'light',preferredThemes:{dark:'ocean',light:'dark'}}))");await reload();
  await click('[data-tone-choice=dark]');assert.equal(await run('document.documentElement.dataset.tone'),'dark');await click('[data-tone-choice=light]');assert.equal(await run('document.documentElement.dataset.tone'),'light');
  win.setContentSize(390,844);
  for(const page of ['telemetry','analyze','analyze/compare','library','settings','settings/calculations/weight']){await route(page);assert.ok(await run('document.documentElement.scrollWidth<=window.innerWidth'),page+' overflows');}
  await route('analyze');for(const topic of ['weight','wear']){await click('[data-analysis-topic='+topic+']');assert.ok(await run('document.documentElement.scrollWidth<=window.innerWidth'),topic+' overflows');}
  await route('telemetry');await capture('mobile-v4');
  assert.deepEqual(errors,[],'Renderer errors');
  console.log('UI checks passed: four pages, saved-only analysis, comparison, all calculation topics, library lifecycle, file round trips, storage protection, themes, help and responsive layouts.');app.exit(0);
 }catch(e){console.error(e);app.exit(1);}
});
