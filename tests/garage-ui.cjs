// Garage: Paddock cars and photos via the local connection, local cars and tracks, setup links, Track day lane lengths.
const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const output=path.join(__dirname,'../test-results'),profile=path.join(output,'garage-ui-'+Date.now());fs.mkdirSync(profile,{recursive:true});app.setPath('userData',profile);app.disableHardwareAcceleration();
const {createHost}=require('./support/shared-history-host.cjs'),{publishDescriptor}=require('./support/local-descriptor.cjs');
app.whenReady().then(async()=>{
 require('../src/storage-ipc.cjs').registerStorage(profile,{schedule:false});
 const host=await createHost(),folder=path.join(profile,'discovery');publishDescriptor(folder,host.descriptor());
 const paddock=require('../src/paddock-ipc.cjs').registerPaddock(profile,{localFolder:folder});
 const win=new BrowserWindow({show:false,width:1440,height:1100,webPreferences:{preload:path.join(__dirname,'../src/preload.cjs'),sandbox:true,contextIsolation:true,nodeIntegration:false,backgroundThrottling:false,offscreen:true}}),errors=[];
 win.webContents.on('console-message',e=>{if(e.level==='error'){errors.push(e.message);console.error(e.message);}});
 const run=s=>win.webContents.executeJavaScript(s,true),pause=()=>new Promise(r=>setTimeout(r,160)),click=s=>run(`document.querySelector(${JSON.stringify(s)}).click()`);
 const type=(sel,value)=>run(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});e.value=${JSON.stringify(value)};e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
 const text=s=>run(`document.querySelector(${JSON.stringify(s)}).textContent`);
 const wait=async(s,why=s)=>{for(let i=0;i<100;i++){if(await run(s))return;await pause();}throw Error('Timed out: '+why);};
 const shot=async name=>{await pause();fs.writeFileSync(path.join(output,'garage-'+name+'.png'),(await win.webContents.capturePage()).toPNG());};
 try{
  await win.loadFile(path.join(__dirname,'../renderer/index.html'));await pause();
  await run("location.hash='settings/paddock'");await pause();await click('#paddock-local-connect');
  await wait("document.querySelector('#paddock-local-message').textContent.includes('Races up to date')");
  // Paddock cars arrive with the import, including a verified photo.
  await run("location.hash='library/garage'");await wait("document.querySelectorAll('[data-garage-car]').length===2",'Paddock cars listed');
  assert.match(await text('#garage-cars'),/Renamed example[\s\S]*PADDOCK/);assert.match(await text('#garage-source'),/Paddock cars from Home collection/);
  await wait("[...document.querySelectorAll('#garage-cars img')].some(i=>!i.hidden&&i.src.startsWith('data:image/png'))",'photo shown');
  // A local car and a track with lane lengths.
  await click('#garage-add-car');await pause();await type('#garage-f-name','Hand-built special');await type('#garage-f-maker','Home');await click('#garage-editor-save');
  await wait("document.querySelectorAll('[data-garage-car]').length===3");assert.match(await text('#garage-cars'),/Hand-built special[\s\S]*TELEMETRY/);
  await click('#garage-add-track');await pause();await type('#garage-f-name','Home track');await type('#garage-f-lanes','2');await pause();
  await run(`(()=>{const [a,b]=document.querySelectorAll('#garage-f-lengths input');a.value='20.1';b.value='20.4';})()`);await click('#garage-editor-save');
  await wait("document.querySelector('#garage-tracks').textContent.includes('Home track')");assert.match(await text('#garage-tracks'),/1: 20\.1 m · 2: 20\.4 m/);
  // A setup linked to a Paddock car.
  await run("location.hash='telemetry'");await pause();
  assert.ok(await run("[...document.querySelectorAll('[name=carRef] option')].some(o=>o.textContent==='Renamed example · Paddock')"));
  await run(`(()=>{const s=document.querySelector('[name=carRef]');s.value='paddock:paddock-demo:car-a';s.dispatchEvent(new Event('input',{bubbles:true}));})()`);
  assert.equal(await run('state.setup.carRef'),'paddock:paddock-demo:car-a');assert.match(await run('CalculatorModel.encode(state.setup,null)'),/"carRef": "paddock:paddock-demo:car-a"/);
  await click('#save-library');await pause();await click('#library-editor-confirm');await pause();
  await run("location.hash='library/garage'");await pause();await click('[data-garage-car="paddock:paddock-demo:car-a"]');await pause();
  assert.match(await text('#garage-detail'),/FROM PADDOCK/);assert.match(await text('#garage-detail'),/pinion9/);assert.match(await text('#garage-detail .garage-list'),/Example · 21,500 RPM/);
  assert.match(await text('#garage-detail'),/Club circuit · lane 1/,'best laps from imported races of this Paddock car');
  await shot('detail-dark');
  // Track day with this car on the garage track: the lane length comes from the garage.
  await click('#garage-trackday');await pause();assert.equal(await run("location.hash"),'#trackday');assert.equal(await run("document.querySelector('#trackday-car').value"),'Renamed example');
  await type('#trackday-track','Home track');await type('#trackday-lane','2');await pause();assert.match(await text('#trackday-lane-info'),/lane 2: 20\.4 m per lap/);
  assert.ok(await run("[...document.querySelectorAll('#trackday-track-list option')].some(o=>o.value==='Home track')"));
  await type('#trackday-laps','10.2\n10.1');await click('#trackday-save');await wait("document.querySelectorAll('#trackday-today tbody tr').length===1");
  assert.equal(await run("RaceUI.runs().find(r=>r.entryKind==='manual').laneLengthM"),20.4);
  // The linked car survives a restart.
  await win.loadFile(path.join(__dirname,'../renderer/index.html'));await pause();await wait("document.querySelector('[name=carRef]').value==='paddock:paddock-demo:car-a'",'linked car after reload');
  await run("location.hash='library/garage'");await wait("document.querySelectorAll('[data-garage-car]').length===3");
  await click('[data-tone-choice=light]');await click('[data-garage-car="paddock:paddock-demo:car-a"]');await shot('light');
  win.setSize(390,1000);await pause();assert.equal(await run('document.documentElement.scrollWidth>innerWidth'),false);await shot('narrow');
  assert.deepEqual(errors,[]);console.log('Garage passed: Paddock cars and photos, local car and track, setup link and export, car detail with setups and best laps, Track day lane length, persistence, light/dark and narrow layouts.');
 }finally{paddock.disconnect();host.close();win.destroy();app.quit();}
}).catch(e=>{console.error(e);app.exit(1);});
