// Setups (Change Sheet): the shelf of setups by car, reading one setup, ticking up to two more or the workbench now,
// what you changed, the verdict, only the results that moved, and the folded rest. Isolated synthetic profile.
const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const output=path.join(__dirname,'../test-results'),profile=path.join(output,'setups-ui-'+Date.now());fs.mkdirSync(profile,{recursive:true});app.setPath('userData',profile);app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
 require('../src/storage-ipc.cjs').registerStorage(profile,{schedule:false});const paddock=require('../src/paddock-ipc.cjs').registerPaddock(profile);
 const win=new BrowserWindow({show:false,width:1440,height:1100,webPreferences:{preload:path.join(__dirname,'../src/preload.cjs'),sandbox:true,contextIsolation:true,nodeIntegration:false,backgroundThrottling:false,offscreen:true}}),errors=[];
 win.webContents.on('console-message',e=>{if(e.level==='error'){errors.push(e.message);console.error(e.message);}});
 const run=s=>win.webContents.executeJavaScript(s,true),pause=(ms=150)=>new Promise(r=>setTimeout(r,ms)),click=async s=>{await run(`document.querySelector(${JSON.stringify(s)}).click()`);await pause();};
 const text=s=>run(`document.querySelector(${JSON.stringify(s)})?.textContent||''`),shot=async n=>{await pause(250);fs.writeFileSync(path.join(output,'setups-'+n+'.png'),(await win.webContents.capturePage()).toPNG());};
 const route=async h=>{await run(`location.hash=${JSON.stringify(h)};void 0`);await pause(250);};
 const set=(name,v)=>run(`(()=>{const e=document.querySelector('[name="${name}"]');e.value=${JSON.stringify(v)};e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
 const save=async(name,copy)=>{await click(copy?'#save-copy':'#save-library');await run(`(()=>{const e=document.querySelector('#library-entry-name');e.value=${JSON.stringify(name)};e.dispatchEvent(new Event('input',{bubbles:true}));})()`);await click('#library-editor-confirm');};
 const tick=async name=>{await run(`document.querySelector('[data-shelf-tick="'+${name==='workbench'?"'workbench'":`library.find(e=>e.setup.name===${JSON.stringify(name)}).id`}+'"]').click()`);await pause(250);};
 try{
  await win.loadFile(path.join(__dirname,'../renderer/index.html'));await pause(500);
  assert.equal(await text('[data-route=analyze] .nav-word'),'Setups');
  await click('#load-example');await set('totalWeight','80');await set('name','Technical');await save('Technical');
  await set('pinion','10');await save('Fast <b>circuit</b>',true);await set('totalWeight','72');await save('Light',true);
  // Read one setup: its name on top, the topics under the shelf.
  await route('analyze');await run(`document.querySelector('[data-shelf-pick="'+library.find(e=>e.setup.name==='Technical').id+'"]').click()`);await pause();
  assert.equal(await text('#setup-title'),'Technical');assert.equal(await run("document.querySelector('.analyze-topics').hidden"),false);assert.equal(await run("document.querySelector('#analysis-compare').hidden"),true);
  assert.equal(await run("document.querySelectorAll('.shelf-pick b').length"),4);assert.equal(await run("document.querySelectorAll('.shelf-pick b b').length"),0,'names show as text');
  // Tick a second setup: the Change Sheet.
  await tick('Fast <b>circuit</b>');assert.equal(await run('location.hash'),'#analyze/compare');assert.equal(await run("document.querySelector('.analyze-topics').hidden"),true);
  assert.deepEqual(await run("[...document.querySelectorAll('.cs-who b')].map(b=>b.textContent)"),['Technical','Fast <b>circuit</b>']);
  assert.match(await text('.cs-verdict'),/B · Fast <b>circuit<\/b> is quicker on the straight \(\+11\.1% no-load speed\) and pulls less out of a corner/);
  assert.match(await text('.cs-section'),/Pinion\s*Gearing\s*9\s*9 → 10/);
  assert.equal(await run("document.querySelector('[data-sheet-metric=speedKmh] .cs-val').classList.contains('good')"),true);
  assert.match(await text('.cs-fold'),/results? did not change/);
  // A third, then the workbench now: at most three, the oldest pick makes room.
  await tick('Light');assert.equal(await run("document.querySelectorAll('.cs-who').length"),3);assert.match(await text('.cs-verdict'),/C · Light is .*8 g lighter/);
  await shot('dark');
  await tick('workbench');assert.deepEqual(await run("[...document.querySelectorAll('.cs-who b')].map(b=>b.textContent)"),['Technical','Light','The workbench now']);
  // Click another setup's name: it becomes the base.
  await run(`document.querySelector('[data-shelf-pick="'+library.find(e=>e.setup.name==='Light').id+'"]').click()`);await pause(250);
  assert.equal(await run("document.querySelector('.cs-who b').textContent"),'Light');assert.equal(await run("document.querySelectorAll('.cs-who').length"),2,'the new base leaves the ticked list');
  // Untick the last one: back to reading one setup.
  await tick('workbench');assert.equal(await run('location.hash'),'#analyze');assert.equal(await text('#setup-title'),'Light');
  // From the Library: Compare with… opens the sheet with the next setup.
  await run(`showSavedAnalysis(library.find(e=>e.setup.name==='Technical').id,true)`);await pause(250);assert.equal(await run('location.hash'),'#analyze/compare');assert.equal(await run("document.querySelectorAll('.cs-who').length"),2);
  await click('[data-tone-choice=light]');await shot('light');await click('[data-tone-choice=dark]');
  win.setSize(390,1000);await pause(300);assert.equal(await run('document.documentElement.scrollWidth>innerWidth'),false);await shot('narrow');
  assert.deepEqual(errors,[]);console.log('Setups passed: the shelf by car, reading one setup with its topics, the Change Sheet with what you changed, verdict and moved results, three at most, the workbench now, a new base, back to one setup, Compare from the Library, light/dark and narrow layouts.');
 }finally{paddock.disconnect();win.destroy();app.quit();}
}).catch(e=>{console.error(e);app.exit(1);});
