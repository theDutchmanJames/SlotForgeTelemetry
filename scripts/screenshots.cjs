// README pictures: drives the real app in a throwaway profile filled with example data only.
// Run with `npm run screenshots`; pictures go to docs/screenshots (or the folder given as the first argument).
const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {hash,checkCache}=require('../src/paddock-client.cjs'),{summaries}=require('../src/paddock-statistics.cjs');
const target=path.resolve(process.argv.slice(2).find(a=>!a.startsWith('-')&&!a.endsWith('.cjs')&&a!=='.')||path.join(__dirname,'../docs/screenshots'));
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'telemetry-screenshots-'));app.setPath('userData',profile);app.disableHardwareAcceleration();
const WIDTH=1424,HEIGHT=1035;

// Repeatable lap times: steady pace with small variation and the odd slow lap.
function lapTimes(typical,count,seed){let s=seed;const r=()=>((s=(s*16807)%2147483647)/2147483647);return Array.from({length:count},(_,i)=>Math.round((typical+(r()-0.5)*0.24+(i%7===5?0.55:0))*1000));}
// Club nights imported from Timing through Paddock: the same car, track, lane and driver, getting quicker.
function clubNight(id,date,typical,gear,seed){
 const d=structuredClone(require('../integration/paddock-telemetry-v1/fixtures/original-detail.json')),p=d.payload,e=p.participants[0];
 const times=lapTimes(typical,18,seed);let t=0;const total=times.reduce((a,b)=>a+b,0);
 Object.assign(p,{sessionId:id,name:'Club night',type:'practice',startedAt:date+'T19:30:00.000Z',endedAt:new Date(Date.parse(date+'T19:30:00.000Z')+total).toISOString(),notes:''});
 p.track.name='Club circuit';p.heats[0].endedAtMs=total;e.displayName='Club GT';e.drivers[0].name='Alex';e.stints[0].endedAtMs=total;
 e.configuration.technical={motor:'21.5k',pinion:'9',gear};e.configuration.capturedAt=date+'T19:00:00.000Z';
 e.laps=times.map((ms,i)=>({id:`${id}-lap-${i+1}`,stintId:'stint-1',number:i+1,durationMs:ms,endedAtMs:(t+=ms),valid:true,pit:false,recordEligible:true,countsForDistance:true,distanceM:20,reason:''}));
 Object.assign(p.standings[0],{classifiedLaps:times.length,classifiedElapsedMs:total,points:0});
 d.receipt.sessionId=id;d.receipt.contentHash=hash(p);d.receipt.summaries=summaries(p);return {payload:p,receipt:d.receipt};
}
const results={version:1,hosts:[{id:'paddock-demo',name:'Home collection',revision:10,syncedAt:new Date().toISOString(),results:[
 clubNight('night-1','2026-09-18',10.42,'27',11),clubNight('night-2','2026-09-25',10.31,'27',23),clubNight('night-3','2026-10-02',10.26,'27',37),
 clubNight('night-4','2026-10-09',10.14,'28',41),clubNight('night-5','2026-10-16',10.08,'28',53)]}]};
checkCache(results);fs.writeFileSync(path.join(profile,'paddock-results-v1.json'),JSON.stringify(results));

app.whenReady().then(async()=>{
 const storage=require('../src/storage-ipc.cjs').registerStorage(profile,{schedule:false}),paddock=require('../src/paddock-ipc.cjs').registerPaddock(profile);
 const win=new BrowserWindow({show:false,width:WIDTH,height:HEIGHT,useContentSize:true,webPreferences:{preload:path.join(__dirname,'../src/preload.cjs'),sandbox:true,contextIsolation:true,nodeIntegration:false,backgroundThrottling:false,offscreen:true}}),errors=[];
 win.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message);});
 const run=s=>win.webContents.executeJavaScript(s,true),pause=(ms=200)=>new Promise(r=>setTimeout(r,ms));
 const click=async s=>{await run(`document.querySelector(${JSON.stringify(s)}).click()`);await pause();};
 const type=(s,v)=>run(`(()=>{const e=document.querySelector(${JSON.stringify(s)});e.value=${JSON.stringify(v)};e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
 const set=(name,v)=>type(`[name="${name}"]`,v);
 const route=async h=>{await run(`location.hash=${JSON.stringify(h)};void 0`);await pause(300);};
 const wait=async(s,why=s)=>{for(let i=0;i<100;i++){if(await run(s))return;await pause(150);}throw Error('Timed out: '+why);};
 const shot=async(name,selector)=>{
  await run(selector?`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'start'})`:'window.scrollTo(0,0)');
  await run('(()=>{const t=document.querySelector("#toast");if(t)t.hidden=true;return new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));})()');await pause(400);
  fs.writeFileSync(path.join(target,name+'.png'),(await win.webContents.capturePage()).toPNG());console.log('  '+name+'.png');
 };
 const saveAs=async(name,copy)=>{await click(copy?'#save-copy':'#save-library');await type('#library-entry-name',name);await click('#library-editor-confirm');};
 try{
  fs.mkdirSync(target,{recursive:true});console.log('Pictures for '+target);
  await win.loadFile(path.join(__dirname,'../renderer/index.html'));await pause(600);await click('[data-tone-choice=dark]');
  // Garage first, so setups and runs can belong to a car: three cars and the club track with its lane lengths.
  await route('library/garage');await wait("!!document.querySelector('#garage-add-car')",'garage page');
  for(const [name,maker] of [['Club GT','Home build'],['Vintage Le Mans','Kit'],['Rally special','Home build']]){await click('#garage-add-car');await type('#garage-f-name',name);await type('#garage-f-maker',maker);await click('#garage-editor-save');}
  await wait("document.querySelectorAll('[data-garage-car]').length===3",'three cars');
  await click('#garage-add-track');await type('#garage-f-name','Club circuit');await type('#garage-f-lanes','2');await pause();
  await run(`(()=>{const [a,b]=document.querySelectorAll('#garage-f-lengths input');for(const [e,v] of [[a,'20'],[b,'20.3']]){e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));}})()`);await click('#garage-editor-save');
  await wait("document.querySelector('#garage-tracks').textContent.includes('Club circuit')",'track saved');
  // Workbench: the example setup for the Club GT, with weight, wear and track details filled in.
  await route('telemetry');
  await run(`(()=>{const s=document.querySelector('[name=carRef]'),o=[...s.options].find(o=>o.textContent.startsWith('Club GT'));s.value=o.value;s.dispatchEvent(new Event('input',{bubbles:true}));})()`);
  for(const [k,v] of Object.entries({totalWeight:'80',ballast:'20',frontWeight:'32',rearWeight:'48',wornDiameter:'19',trackLength:'20',lapTime:'5',scaleFactor:'32',wheelbase:'80',ballastPosition:'60',gearDiameter:'18'}))await set(k,v);
  await set('name','Club GT · technical');await pause();await shot('telemetry');await saveAs('Club GT · technical');
  // Analyze a saved setup.
  await route('analyze/overview');await click('[data-analysis-topic=performance]');await shot('analyze');
  await click('[data-analysis-topic=weight]');await shot('balance','#weight-results .calculation-detail');
  await click('[data-analysis-topic=wear]');await shot('clearance');
  // A second setup, compared with the first; then the library.
  await route('telemetry');await set('pinion','10');await set('name','Club GT · fast circuit');await saveAs('Club GT · fast circuit',true);
  await route('analyze/compare');await shot('compare');await route('library');await shot('library');
  // Track day: a baseline run, then a gearing change compared before saving.
  await route('telemetry');await set('pinion','9');await set('name','Club GT · technical');
  await route('trackday');await type('#trackday-car','Club GT');await type('#trackday-track','Club circuit');await type('#trackday-lane','1');await type('#trackday-driver','Alex');
  await run("(()=>{const c=document.querySelector('#trackday-sequence');if(!c.checked)c.click();})()");
  await type('#trackday-laps',lapTimes(10.06,10,71).map(ms=>(ms/1000).toFixed(3)).join('\n'));await pause();await click('#trackday-save');
  await wait("document.querySelectorAll('#trackday-today tbody tr').length===1",'first run');
  await route('telemetry');await set('pinion','10');await route('trackday');
  await type('#trackday-change','pinion 9 → 10');await type('#trackday-laps',lapTimes(9.93,10,89).map(ms=>(ms/1000).toFixed(3)).join('\n'));await pause();
  await shot('trackday');await click('#trackday-save');await wait("document.querySelectorAll('#trackday-today tbody tr').length===2",'second run');
  await route('library/garage');await click('[data-garage-car]');await shot('garage');
  // Track laps: one club night in detail, then the history.
  await route('analyze/races');await wait("document.querySelector('#race-run')?.options.length>0",'runs listed');
  await run(`(()=>{const s=document.querySelector('#race-run'),o=[...s.options].find(o=>o.textContent.includes('Club night')&&o.textContent.includes('16 Oct'));if(o){s.value=o.value;s.dispatchEvent(new Event('change',{bubbles:true}));}})()`);await pause(400);
  await shot('lap-analysis');
  await route('analyze/progress');await wait("!document.querySelector('#race-progress').hidden",'progress shown');await shot('progress','#race-progress');
  if(errors.length)throw Error('Console errors:\n'+errors.join('\n'));
  console.log('Screenshots done.');
 }finally{storage.dispose();paddock.disconnect();win.destroy();app.quit();try{fs.rmSync(profile,{recursive:true,force:true});}catch{/* Temporary folder; Windows may still hold it. */}}
}).catch(e=>{console.error(e);app.exit(1);});
