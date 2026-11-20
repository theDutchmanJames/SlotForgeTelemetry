// Library (Setup Binder): setups in a section per car with their columns, the best lap with this gearing, favourites and
// filters, ticking for compare, export and delete (with undo), the spec card, and cars and tracks below. Isolated profile.
const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const output=path.join(__dirname,'../test-results'),profile=path.join(output,'binder-ui-'+Date.now());fs.mkdirSync(profile,{recursive:true});app.setPath('userData',profile);app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
 require('../src/storage-ipc.cjs').registerStorage(profile,{schedule:false});const paddock=require('../src/paddock-ipc.cjs').registerPaddock(profile);
 const win=new BrowserWindow({show:false,width:1440,height:1100,webPreferences:{preload:path.join(__dirname,'../src/preload.cjs'),sandbox:true,contextIsolation:true,nodeIntegration:false,backgroundThrottling:false,offscreen:true}}),errors=[],downloads=[];
 win.webContents.session.on('will-download',(e,item)=>{downloads.push(item.getFilename());e.preventDefault();});
 win.webContents.on('console-message',e=>{if(e.level==='error'){errors.push(e.message);console.error(e.message);}});
 const run=s=>win.webContents.executeJavaScript(s,true),pause=(ms=150)=>new Promise(r=>setTimeout(r,ms)),click=async s=>{await run(`document.querySelector(${JSON.stringify(s)}).click()`);await pause();};
 const text=s=>run(`document.querySelector(${JSON.stringify(s)})?.textContent||''`),shot=async n=>{await pause(250);fs.writeFileSync(path.join(output,'binder-'+n+'.png'),(await win.webContents.capturePage()).toPNG());};
 const route=async h=>{await run(`location.hash=${JSON.stringify(h)};void 0`);await pause(250);};
 const type=(s,v)=>run(`(()=>{const e=document.querySelector(${JSON.stringify(s)});e.value=${JSON.stringify(v)};e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));})()`);
 const set=(name,v)=>type(`[name="${name}"]`,v);
 const save=async(name,copy)=>{await click(copy?'#save-copy':'#save-library');await type('#library-entry-name',name);await click('#library-editor-confirm');};
 const idOf=name=>`library.find(e=>e.setup.name===${JSON.stringify(name)}).id`;
 const act=(action,name)=>run(`document.querySelector('#library-list [data-library-action=${action}][data-library-id="'+${idOf(name)}+'"]').click()`).then(()=>pause());
 try{
  await win.loadFile(path.join(__dirname,'../renderer/index.html'));await pause(500);
  // A car in the garage, three setups for it, one setup without a car, and a run driven with 9/27.
  await route('library/garage');await click('#garage-add-car');await type('#garage-f-name','Club GT');await type('#garage-f-maker','Home build');await click('#garage-editor-save');await pause(300);
  await click('#garage-add-car');await type('#garage-f-name','Rally special');await click('#garage-editor-save');await pause(300);
  await route('telemetry');await click('#load-example');await run(`(()=>{const s=document.querySelector('[name=carRef]'),o=[...s.options].find(o=>o.textContent.startsWith('Club GT'));s.value=o.value;s.dispatchEvent(new Event('input',{bubbles:true}));})()`);
  await set('totalWeight','80');await save('Technical');await set('pinion','10');await save('Fast <b>circuit</b>',true);await set('totalWeight','72');await save('Light',true);
  await run(`(()=>{const s=document.querySelector('[name=carRef]');s.value='';s.dispatchEvent(new Event('input',{bubbles:true}));})()`);await save('Bench test',true);
  const laps=[10.1,9.95,10.02,10.2,9.99].map((t,i)=>({number:i+1,durationMs:Math.round(t*1000),valid:true,pit:false}));
  assert.equal((await run(`window.manualLaps.save({values:${JSON.stringify({name:'Run 1',car:'Club GT',track:'Club circuit',driver:'Alex',source:'Track day',notes:'',startedAt:'2026-11-20T10:00:00.000Z',type:'practice',lane:1,lengthM:20,sequenceConfirmed:true,technical:{pinion:'9',gear:'27',rearDiameter:'',weight:'',ratedRpm:''},laps})}})`)).ok,true);
  await win.reload();await pause(600);await route('library');
  // Sections by car: Club GT with three setups, Rally special without, then the setup without a car.
  assert.deepEqual(await run("[...document.querySelectorAll('.binder-group b')].map(b=>b.textContent)"),['Club GT','Rally special','Without a car']);
  assert.match(await text('.binder-group small'),/Home build · 3 setups/);
  const row=name=>run(`[...document.querySelector('[data-library-id="'+${idOf(name)}+'"]').closest('.binder-row').querySelectorAll('.binder-num')].map(e=>e.textContent)`);
  assert.deepEqual(await row('Technical'),['9/27','20 mm','80 g','27.02','9.950'],'the best lap driven with 9/27');
  assert.deepEqual((await row('Light')).slice(2),['72 g','30.02','—']);
  assert.equal(await run("document.querySelectorAll('.binder-name b b').length"),0,'names show as text');
  // The spec card of the selected setup.
  await act('select','Technical');assert.equal(await text('#library-detail .library-detail-title'),'Technical');assert.match(await text('.binder-usage'),/best 9\.950 s on Club circuit lane 1, 1 run with 9\/27/);
  await act('select','Bench test');assert.match(await text('.binder-usage'),/Choose a car for this setup/);
  // Favourites and filters.
  await act('star','Light');assert.equal(await run(`library.find(e=>e.setup.name==='Light').favourite`),true);
  await click('[data-binder-filter=favourites]');assert.deepEqual(await run("[...document.querySelectorAll('.binder-name b')].map(b=>b.textContent)"),['Light']);
  await click('[data-binder-filter=driven]');assert.deepEqual(await run("[...document.querySelectorAll('.binder-name b')].map(b=>b.textContent)"),['Technical']);
  await click('[data-binder-filter=new]');assert.equal(await run("document.querySelectorAll('.binder-name').length"),3);await click('[data-binder-filter=all]');
  // Tick two: the action bar, Compare on the Setups page.
  await act('tick','Technical');await act('tick','Light');assert.equal(await run("document.getElementById('binder-actions').hidden"),false);assert.match(await text('#binder-actions'),/2 ticked/);
  await shot('dark');
  await click('#binder-compare');await pause(300);assert.equal(await run('location.hash'),'#analyze/compare');assert.deepEqual(await run("[...document.querySelectorAll('.cs-who b')].map(b=>b.textContent)"),['Technical','Light']);
  // Export files: one file each.
  await route('library');await click('#binder-export');await pause(500);assert.deepEqual(downloads.sort(),['Light.slotforge-calculator.json','Technical.slotforge-calculator.json']);
  // Delete both with one confirmation, then undo.
  await click('#binder-delete');assert.match(await text('#library-editor-title'),/Delete 2 saved setups/);await click('#library-editor-confirm');await pause(300);
  assert.equal(await run('library.length'),2);assert.equal(await run("document.getElementById('binder-actions').hidden"),true);
  await click('#library-undo');assert.equal(await run('library.length'),4);assert.equal(await run(`library.find(e=>e.setup.name==='Light').favourite`),true,'undo keeps the star');
  // Cars and tracks below; the old Garage link scrolls there.
  await route('library/garage');assert.equal(await run("document.getElementById('garage').hidden"),false);assert.equal(await run("document.getElementById('setup-library').hidden"),false);
  await click('[data-tone-choice=light]');await route('library');await shot('light');await click('[data-tone-choice=dark]');
  win.setSize(390,1000);await pause(300);assert.equal(await run('document.documentElement.scrollWidth>innerWidth'),false);await shot('narrow');
  assert.deepEqual(errors,[]);console.log('Library passed: sections by car, columns, best lap with this gearing, spec card, favourites and filters, tick to compare, export and delete with undo, cars and tracks below, light/dark and narrow layouts.');
 }finally{paddock.disconnect();win.destroy();app.quit();}
}).catch(e=>{console.error(e);app.exit(1);});
