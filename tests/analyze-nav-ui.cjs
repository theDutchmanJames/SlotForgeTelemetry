// Analyze navigation: grouped modes and topics, dimmed topics without saved data, unchanged routing.
const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const output=path.join(__dirname,'../test-results');fs.mkdirSync(output,{recursive:true});
app.setPath('userData',fs.mkdtempSync(path.join(output,'analyze-nav-')));app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,width:1440,height:1100,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false,backgroundThrottling:false,offscreen:true}}),errors=[];
 win.webContents.on('console-message',e=>{if(e.level==='error'){errors.push(e.message);console.error(e.message);}});
 const run=s=>win.webContents.executeJavaScript(s,true),pause=()=>new Promise(r=>setTimeout(r,160)),click=s=>run(`document.querySelector(${JSON.stringify(s)}).click()`);
 const set=(name,value)=>run(`(()=>{const e=document.querySelector('[name=${name}]');e.value=${JSON.stringify(value)};e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
 const dimmed=()=>run(`[...document.querySelectorAll('[data-analysis-topic].topic-empty')].map(b=>b.dataset.analysisTopic).sort()`);
 const shot=async name=>{await pause();fs.writeFileSync(path.join(output,'analyze-'+name+'.png'),(await win.webContents.capturePage()).toPNG());};
 try{
  await win.loadFile(path.join(__dirname,'../renderer/index.html'));await pause();
  await click('#save-library');await pause();await click('#library-editor-confirm');await pause();
  await run("location.hash='analyze'");await pause();
  // Modes: two labelled groups with short names; every original link is still present.
  assert.deepEqual(await run(`[...document.querySelectorAll('.analyze-modes>.nav-group')].map(g=>g.querySelector('.nav-group-label').textContent+': '+[...g.querySelectorAll('a')].map(a=>a.textContent.trim()).join(' / '))`),['Setups: Analysis / Compare','Track laps: Laps / Compare / Progress / Records']);
  assert.equal(await run(`document.querySelectorAll('[data-analysis-mode]').length`),6);
  // SlotForge Restyle: the modes are a side list beside the page, with the topics nested right under Analysis.
  assert.equal(await run(`!!document.querySelector('.analyze-shell>.analyze-rail .analyze-modes')&&!!document.querySelector('.analyze-shell>.analyze-main #analysis-content')&&!!document.querySelector('.analyze-main #race-analysis')`),true);
  assert.equal(await run(`document.querySelector('[data-analysis-mode=overview]').nextElementSibling.classList.contains('analyze-topics')`),true);
  assert.equal(await run(`document.querySelector('.analyze-topics').hidden`),false);
  // Topics: three clusters holding all eight topics.
  assert.deepEqual(await run(`[...document.querySelectorAll('.analyze-topics .nav-group')].map(g=>g.querySelector('.nav-group-label').textContent+':'+g.querySelectorAll('[data-analysis-topic]').length)`),['Essentials:2','Measurements:4','Planning:2']);
  // The example has no weight, wear, chassis, magnetic, lap or test data saved: those topics are dimmed.
  assert.deepEqual(await dimmed(),['chassis','laps','magnetic','wear','weight','workshop']);
  await shot('topics-dark');
  // Dimmed topics stay usable.
  await click('[data-analysis-topic=magnetic]');await pause();assert.equal(await run(`document.querySelector('[data-analysis-panel=magnetic]').hidden`),false);
  // Saving a weight and a lap measurement lifts the dimming for those topics.
  await run("location.hash='telemetry'");await pause();await set('totalWeight','80');await set('trackLength','20');await set('lapTime','5');
  await click('#save-library');await pause();await click('#library-editor-confirm');await pause();
  await run("location.hash='analyze'");await pause();assert.deepEqual(await dimmed(),['chassis','magnetic','wear','workshop']);
  // Routing is unchanged.
  await click('[data-analysis-mode=races]');await pause();assert.equal(await run(`document.querySelector('#race-analysis').hidden`),false);assert.equal(await run(`document.querySelector('[data-analysis-mode=races]').getAttribute('aria-current')`),'page');
  assert.equal(await run(`document.querySelector('.analyze-topics').hidden`),true,'topics belong to Analysis only');
  await click('[data-analysis-mode=compare]');await pause();assert.equal(await run(`document.querySelector('#analysis-compare').hidden`),false);assert.equal(await run(`document.querySelector('.analyze-topics').hidden`),true);
  await click('[data-analysis-mode=overview]');await pause();assert.equal(await run(`document.querySelector('.analyze-topics').hidden`),false);
  await click('[data-tone-choice=light]');await shot('topics-light');
  win.setSize(390,1000);await pause();assert.equal(await run('document.documentElement.scrollWidth>innerWidth'),false);await shot('topics-narrow');
  assert.deepEqual(errors,[]);console.log('Analyze navigation passed: grouped modes and topics, dimmed topics without data, usable dimmed topics, routing, side list with nested topics, light/dark and narrow layouts.');
 }finally{win.destroy();app.quit();}
}).catch(e=>{console.error(e);app.exit(1);});
