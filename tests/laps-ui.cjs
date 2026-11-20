// Laps (Pace Wall): car tiles, track and lane, the scoreboard, the wall with change markers, the colour switch, older
// runs, what moved the pace, the selected run with its note and tag, and the full analysis and comparison from it.
// Isolated synthetic profile: never reads or writes the user's app profile.
const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const output=path.join(__dirname,'../test-results'),profile=path.join(output,'laps-ui-'+Date.now());fs.mkdirSync(profile,{recursive:true});app.setPath('userData',profile);app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
 require('../src/storage-ipc.cjs').registerStorage(profile,{schedule:false});const paddock=require('../src/paddock-ipc.cjs').registerPaddock(profile);
 const win=new BrowserWindow({show:false,width:1440,height:1100,webPreferences:{preload:path.join(__dirname,'../src/preload.cjs'),sandbox:true,contextIsolation:true,nodeIntegration:false,backgroundThrottling:false,offscreen:true}}),errors=[];
 win.webContents.on('console-message',e=>{if(e.level==='error'){errors.push(e.message);console.error(e.message);}});
 const run=s=>win.webContents.executeJavaScript(s,true),pause=(ms=150)=>new Promise(r=>setTimeout(r,ms)),click=s=>run(`document.querySelector(${JSON.stringify(s)}).click()`);
 const text=s=>run(`document.querySelector(${JSON.stringify(s)})?.textContent||''`),shot=async n=>{await pause(250);fs.writeFileSync(path.join(output,'laps-'+n+'.png'),(await win.webContents.capturePage()).toPNG());};
 const route=async h=>{await run(`location.hash=${JSON.stringify(h)};void 0`);await pause(250);};
 const reload=async()=>{await win.loadFile(path.join(__dirname,'../renderer/index.html'));await pause(500);};
 const pick=(selector,match)=>run(`[...document.querySelectorAll(${JSON.stringify(selector)})].find(b=>b.textContent.includes(${JSON.stringify(match)})).click()`);
 try{
  await reload();await route('laps');
  assert.equal(await run("document.querySelector('[data-route=laps]').closest('.nav-group').getAttribute('aria-label')"),'Understand');
  assert.equal(await run("document.getElementById('lw-empty').hidden"),false,'an empty page says how laps get here');await shot('empty');
  // Fourteen club runs of one car (a pinion change halfway), one run on lane 2 and one of another car.
  const base={driver:'Alex',source:'Notebook',notes:'',type:'practice',lengthM:20,sequenceConfirmed:true};
  const laps=(typical,count,seed)=>{let s=seed;const r=()=>((s=(s*16807)%2147483647)/2147483647);return Array.from({length:count},(_,i)=>({number:i+1,durationMs:Math.round((typical+(r()-.5)*.2+(i%7===5?.5:0))*1000),valid:i!==8,pit:false}));};
  const save=values=>run(`window.manualLaps.save({values:${JSON.stringify(values)}})`).then(r=>assert.equal(r.ok,true,r.error));
  for(let i=0;i<14;i++)await save({...base,name:'Club night '+(i+1),car:'Club GT',track:'Club circuit',lane:1,startedAt:new Date(Date.UTC(2026,8,1+i*5,19)).toISOString(),technical:{pinion:i<7?'9':'10',gear:'27',rearDiameter:'',weight:'',ratedRpm:''},laps:laps(10.4-i*.03,i===13?52:16,11+i)});
  await save({...base,name:'Lane two',car:'Club GT',track:'Club circuit',lane:2,startedAt:'2026-11-01T19:00:00.000Z',technical:{pinion:'9',gear:'27',rearDiameter:'',weight:'',ratedRpm:''},laps:laps(10.6,12,5)});
  await save({...base,name:'Vintage <b>run</b>',car:'Vintage Le Mans',track:'Club circuit',lane:1,startedAt:'2026-10-01T19:00:00.000Z',technical:{pinion:'',gear:'',rearDiameter:'',weight:'',ratedRpm:''},laps:laps(11.4,10,7)});
  await reload();await route('laps');
  // Cars, newest first, then the track and lane of the chosen car.
  assert.deepEqual(await run("[...document.querySelectorAll('[data-lw-car] b')].map(b=>b.textContent)"),['Club GT','Vintage Le Mans']);
  assert.match(await text('[data-lw-car][aria-pressed=true]'),/15 runs · 2 tracks & lanes/);
  assert.deepEqual(await run("[...document.querySelectorAll('[data-lw-line]')].map(b=>b.textContent.trim())"),['Club circuit · lane 1 14','Club circuit · lane 2 1']);
  // Scoreboard and wall: 12 newest runs, a marker where the pinion changed, the record lap marked once.
  assert.match(await text('#lw-score'),/Record\s*\d+\.\d{3}/);assert.match(await text('#lw-score'),/Gained\s*−/);
  assert.equal(await run("document.querySelectorAll('[data-lw-run]').length"),12);assert.equal(await run("document.getElementById('lw-older').hidden"),false);
  assert.match(await text('#lw-older'),/Show 2 older runs/);await click('#lw-older');assert.equal(await run("document.querySelectorAll('[data-lw-run]').length"),14);
  assert.deepEqual(await run("[...document.querySelectorAll('.lw-change')].map(e=>e.textContent)"),['▼ changed: pinion 9 → 10']);
  assert.equal(await run("document.querySelectorAll('#lw-wall .lw-record').length"),1);
  assert.ok(await run("document.querySelectorAll('#lw-wall .lw-out').length>=14"),'excluded laps keep their place, hatched');
  assert.match(await text('#lw-wall .lw-more'),/^\+13$/,'a long run shows its first laps and how many more');
  assert.match(await run("document.querySelector('#lw-wall .lw-cell[title]').title"),/^Lap 1: \d+\.\d{3} s/);
  // Colours: against the record, or against each run's own typical lap.
  const colours=()=>run("[...document.querySelectorAll('#lw-wall .lw-cell')].slice(0,40).map(c=>c.style.background).join()");
  const before=await colours();await click('[data-lw-mode=median]');assert.notEqual(await colours(),before);assert.equal(await run("document.querySelector('[data-lw-mode=median]').getAttribute('aria-pressed')"),'true');assert.match(await text('#lw-legend'),/own typical lap/);await click('[data-lw-mode=record]');
  // What moved the pace.
  assert.match(await text('#lw-ledger'),/pinion 9 → 10/);assert.match(await text('#lw-ledger'),/[−+]\d\.\d{3} s/);
  await run("document.getElementById('lw-ledger').scrollIntoView()");await shot('ledger');await run('scrollTo(0,0)');
  // The selected run: newest by default, its chart, what changed, raced with.
  assert.match(await text('#lw-drawer h2'),/Club night 14/);assert.equal(await run("document.querySelectorAll('#lw-drawer .lw-chart rect').length"),52);
  await pick('[data-lw-run]','Club night 8');assert.match(await text('#lw-drawer'),/after pinion 9 → 10/);assert.match(await text('#lw-drawer .lw-specs'),/Gearing10 \/ 27/);
  assert.equal(await run("document.querySelector('[data-lw-run][aria-pressed=true]').textContent.includes('Club night 8')"),true);
  await shot('dark');
  // Note and tag: saved on their own, kept after a restart, never changing the laps.
  await click('[data-lw-tag=club]');assert.match(await text('#lw-drawer h2'),/Club night/);assert.equal(await run("document.querySelector('[data-lw-tag=club]').getAttribute('aria-pressed')"),'true');
  await run("{const t=document.getElementById('lw-note');t.value='Fresh grip after cleaning';t.dispatchEvent(new Event('input'));t.dispatchEvent(new Event('blur'));}");await pause(500);
  const notes=JSON.parse(fs.readFileSync(path.join(profile,'run-notes-v1.json'),'utf8'));assert.equal(Object.values(notes.runs)[0].note,'Fresh grip after cleaning');assert.equal(Object.values(notes.runs)[0].tag,'club');
  const manualBefore=fs.readFileSync(path.join(profile,'manual-laps-v1.json'),'utf8');
  await reload();await route('laps');await click('#lw-older');await pick('[data-lw-run]','Club night 8');
  assert.equal(await run("document.getElementById('lw-note').value"),'Fresh grip after cleaning');assert.match(await text('[data-lw-run][aria-pressed=true]'),/Club night ·/);
  assert.equal(fs.readFileSync(path.join(profile,'manual-laps-v1.json'),'utf8'),manualBefore,'notes never touch the laps');
  // Another car and its own wall; names show as text.
  await pick('[data-lw-car]','Vintage');assert.match(await text('#lw-drawer h2'),/Vintage <b>run<\/b>/);assert.equal(await run("document.querySelectorAll('#lw-drawer h2 b').length"),0);
  assert.match(await text('#lw-ledger'),/No setup changes recorded/);assert.match(await text('#lw-drawer'),/The first run on this track and lane/);
  // Full lap analysis and comparison open from the run, with a way back.
  await pick('[data-lw-car]','Club GT');await click('#lw-compare');await pause(300);assert.equal(await run('location.hash'),'#laps/compare');assert.equal(await run("document.getElementById('lw-view').hidden"),true);assert.equal(await run("document.getElementById('race-compare').hidden"),false);
  assert.match(await text('#lw-crumb'),/Back to the wall.*Club GT · Club circuit · lane 1/);
  await click('#lw-crumb a');await pause(300);assert.equal(await run('location.hash'),'#laps');await click('#lw-detail');await pause(300);
  assert.equal(await run('location.hash'),'#laps/run');assert.match(await run("document.querySelector('#race-run').selectedOptions[0].textContent"),/Club night 14/);
  // The old Analyze and Library links land here.
  for(const [from,to] of [['analyze/progress','#laps'],['analyze/records','#laps'],['library/races','#laps'],['analyze/racecompare','#laps/compare']]){await route(from);assert.equal(await run('location.hash'),to);}
  // Light and narrow.
  await route('laps');await click('[data-tone-choice=light]');await shot('light');await click('[data-tone-choice=dark]');
  win.setSize(390,1000);await pause(300);assert.equal(await run('document.documentElement.scrollWidth>innerWidth'),false);await shot('narrow');
  assert.deepEqual(errors,[]);console.log('Laps passed: empty page, cars and lanes, scoreboard, the wall with change markers, record and excluded laps, long runs, colour switch, older runs, what moved the pace, the selected run, note and tag kept apart from the laps, full analysis and comparison, old links, light/dark and narrow layouts.');
 }finally{paddock.disconnect();win.destroy();app.quit();}
}).catch(e=>{console.error(e);app.exit(1);});
