// Synthetic offline evidence only; never opens the user's application profile.
const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {hash,checkCache}=require('../src/paddock-client.cjs'),{summaries}=require('../src/paddock-statistics.cjs');
const output=path.join(__dirname,'../test-results'),profile=path.join(output,'stint-ui-'+Date.now());fs.mkdirSync(profile,{recursive:true});app.setPath('userData',profile);app.disableHardwareAcceleration();
function evidence(label,count,offset){
 const d=structuredClone(require('../integration/paddock-telemetry-v1/fixtures/original-detail.json')),p=d.payload,entry=p.participants[0];
 p.sessionId='stint-test-'+label;p.name='Test '+label;p.endedAt=new Date(Date.parse(p.startedAt)+360000).toISOString();p.heats[0].endedAtMs=360000;p.heats[0].name='Heat <b>one</b>';
 entry.stints=[{...entry.stints[0],id:'s1',endedAtMs:180000},{...entry.stints[0],id:'s2',startedAtMs:180000,endedAtMs:360000},{...entry.stints[0],id:'empty',startedAtMs:360000,endedAtMs:360000}];
 let elapsed=0;const template=entry.laps[0];entry.laps=Array.from({length:count},(_,i)=>({...template,id:label+'-'+i,stintId:i<15?'s1':'s2',number:i+1,endedAtMs:elapsed=(i===15?180000:elapsed)+11000-(i%15)*70+offset,durationMs:11000-(i%15)*70+offset}));
 if(count>19){entry.laps[18].pit=true;entry.laps[18].recordEligible=false;entry.laps[18].reason='Pit lane';}
 p.standings[0].classifiedLaps=count;p.standings[0].classifiedElapsedMs=count*12000;
 d.receipt.sessionId=p.sessionId;d.receipt.contentHash=hash(p);d.receipt.summaries=summaries(p);return {payload:p,receipt:d.receipt};
}
const data={version:1,hosts:[{id:'paddock-demo',name:'Synthetic collection',revision:10,syncedAt:new Date().toISOString(),results:[evidence('A',30,0),evidence('B',12,-200)]}]};checkCache(data);fs.writeFileSync(path.join(profile,'paddock-results-v1.json'),JSON.stringify(data));
app.whenReady().then(async()=>{
 const client=require('../src/paddock-ipc.cjs').registerPaddock(profile),win=new BrowserWindow({show:false,width:1280,height:1100,webPreferences:{preload:path.join(__dirname,'../src/preload.cjs'),sandbox:true,contextIsolation:true,nodeIntegration:false,backgroundThrottling:false,offscreen:true}}),errors=[];
 win.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message);});
 const run=s=>win.webContents.executeJavaScript(s,true),pause=()=>new Promise(r=>setTimeout(r,100)),click=s=>run(`document.querySelector(${JSON.stringify(s)}).click()`);
 const route=async hash=>{await run(`location.hash=${JSON.stringify(hash)};void 0`);await pause();};
 const change=(id,value)=>run(`{const e=document.getElementById(${JSON.stringify(id)});e.value=${JSON.stringify(value)};e.dispatchEvent(new Event('change'));}`);
 try{
  await win.loadFile(path.join(__dirname,'../renderer/index.html'));await pause();await route('analyze/races');
  assert.equal(await run("document.querySelectorAll('#race-stints tbody tr').length"),3);assert.equal(await run("document.querySelectorAll('#race-stints b').length"),0);
  assert.match(await run("document.querySelector('#race-stints').textContent"),/Closing pace 0.700 s lower/);
  await change('race-stint','s1');assert.match(await run("document.querySelector('#race-run-findings').textContent"),/15 of 15 recorded laps/);assert.match(await run("document.querySelector('#race-stats').textContent"),/15 valid/);assert.equal(await run("document.querySelectorAll('#race-chart circle').length"),15);
  await change('race-stint','empty');assert.match(await run("document.querySelector('#race-run-findings').textContent"),/0 of 0 recorded laps/);assert.match(await run("document.querySelector('#race-chart').textContent"),/No included laps/);assert.equal(await run("document.querySelectorAll('#race-lap-table tbody tr').length"),0);
  await change('race-stint','s2');assert.match(await run("document.querySelector('#race-stats').textContent"),/14 valid/);assert.equal(await run("document.querySelectorAll('#race-chart circle').length"),14);
  await change('race-stint','');await run("document.querySelector('#race-stints').scrollIntoView({block:'center'})");await pause();fs.writeFileSync(path.join(output,'stint-analysis.png'),(await win.webContents.capturePage()).toPNG());
  await route('analyze/racecompare');assert.equal(await run("document.querySelector('#race-overlay').hidden"),true);assert.equal(await run("document.querySelectorAll('#race-comparison svg').length"),0);
  await click('#race-compare-detail');assert.equal(await run("document.querySelector('#race-overlay').hidden"),false);
  assert.equal(await run("document.querySelectorAll('#race-overlay-chart .race-overlay-line').length"),2);assert.equal(await run("document.querySelectorAll('#race-overlay-chart .race-series-b circle').length"),0);
  assert.equal(await run("document.querySelectorAll('#race-overlay-chart circle.race-series-a').length"),29);assert.equal(await run("document.querySelectorAll('#race-overlay-chart circle.race-series-b').length"),12);
  assert.equal(await run("Number([...document.querySelectorAll('#race-overlay-chart circle.race-series-b')].at(-1).getAttribute('cx'))<Number([...document.querySelectorAll('#race-overlay-chart circle.race-series-a')].at(-1).getAttribute('cx'))"),true);
  await run("document.querySelector('#race-overlay-sequence').value='19';document.querySelector('#race-overlay-sequence').dispatchEvent(new Event('input'))");assert.match(await run("document.querySelector('#race-overlay-inspection').textContent"),/Pit lap · excluded/);assert.match(await run("document.querySelector('#race-overlay-inspection').textContent"),/No recorded lap/);
  await run("document.querySelector('#race-overlay').scrollIntoView({block:'center'})");await pause();fs.writeFileSync(path.join(output,'run-overlay.png'),(await win.webContents.capturePage()).toPNG());
  await click('#race-compare-summary');assert.equal(await run("document.querySelector('#race-overlay').hidden"),true);
  win.setSize(390,1000);await pause();await click('#race-compare-detail');assert.equal(await run('document.documentElement.scrollWidth>innerWidth'),false);
  await run("document.querySelector('#race-overlay').scrollIntoView({block:'center'})");await pause();fs.writeFileSync(path.join(output,'run-overlay-mobile.png'),(await win.webContents.capturePage()).toPNG());
  await route('analyze/races');assert.equal(await run('document.documentElement.scrollWidth>innerWidth'),false);
  await run("document.querySelector('[data-tone-choice=light]').click()");assert.equal(await run("document.documentElement.dataset.tone"),'light');
  await change('race-stint','s1');await run("document.querySelector('#race-stints').scrollIntoView({block:'center'})");await pause();fs.writeFileSync(path.join(output,'stint-analysis-light.png'),(await win.webContents.capturePage()).toPNG());
  await run("document.querySelector('#race-search').value='no such result';document.querySelector('#race-search').dispatchEvent(new Event('input'))");assert.equal(await run("document.querySelector('#race-stints').hidden"),true);await route('analyze/racecompare');assert.equal(await run("document.querySelector('#race-overlay').hidden"),true);
  assert.deepEqual(errors,[]);console.log('Stint scope, empty stints, pace windows, optional overlay, unequal runs, inspection, themes and responsive layout passed.');
 }finally{client.disconnect();win.destroy();app.quit();}
}).catch(e=>{console.error(e);app.exit(1);});
