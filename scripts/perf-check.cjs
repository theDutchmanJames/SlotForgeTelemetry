// Performance check: runs the real app in a throwaway profile and measures start-up, page changes,
// typing and storage calls. `npm run perf` uses a heavy profile (hundreds of setups, races and lap sessions);
// add `--empty` for a first-start profile, `--json <file>` to save the numbers for a later comparison.
const {app,BrowserWindow,ipcMain}=require('electron'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');
const {performance}=require('node:perf_hooks');
const args=process.argv.slice(2),EMPTY=args.includes('--empty'),jsonOut=args.includes('--json')?args[args.indexOf('--json')+1]:null;
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'telemetry-perf-'));app.setPath('userData',profile);
const SIZES={setups:200,races:300,manual:300,laps:40,cars:40,tracks:10};

// ---- Heavy example data (written straight into the profile, in each store's own format) ----
function rand(seed){let s=seed;return ()=>((s=(s*16807)%2147483647)/2147483647);}
function seed(){
 const C=require('../renderer/calculator-model.js'),L=require('../renderer/library-model.js'),M=require('../renderer/manual-laps-model.js');
 const {hash,checkCache}=require('../src/paddock-client.cjs'),{summaries}=require('../src/paddock-statistics.cjs');
 const day=i=>new Date(Date.UTC(2025,0,1)+i*86400000);
 // Setup library.
 const entries=Array.from({length:SIZES.setups},(_,i)=>({id:'setup-'+i,setup:{...C.EXAMPLE,name:'Club GT test '+i,pinion:String(8+i%5),gear:String(26+i%6)},notes:'Track notes '.repeat(25),createdAt:day(i).toISOString(),updatedAt:day(i).toISOString()}));
 fs.writeFileSync(path.join(profile,'setups-library-v1.json'),L.encode(entries));
 // Imported Paddock races.
 const fixture=require('../integration/paddock-telemetry-v1/fixtures/original-detail.json'),r=rand(7);
 const race=i=>{const d=structuredClone(fixture),p=d.payload,e=p.participants[0],id='race-'+i,start=day(i).toISOString();
  const times=Array.from({length:SIZES.laps},(_,n)=>Math.round((10+r()*0.4+(n%9===4?0.6:0))*1000)),total=times.reduce((a,b)=>a+b,0);let t=0;
  Object.assign(p,{sessionId:id,name:'Club night '+i,type:'practice',startedAt:start,endedAt:new Date(Date.parse(start)+total).toISOString(),notes:''});
  p.track.name='Club circuit';p.heats[0].endedAtMs=total;e.displayName='Club GT';e.drivers[0].name='Alex';e.stints[0].endedAtMs=total;e.configuration.capturedAt=start;
  e.laps=times.map((ms,n)=>({id:`${id}-lap-${n+1}`,stintId:'stint-1',number:n+1,durationMs:ms,endedAtMs:(t+=ms),valid:true,pit:false,recordEligible:true,countsForDistance:true,distanceM:20,reason:''}));
  Object.assign(p.standings[0],{classifiedLaps:times.length,classifiedElapsedMs:total,points:0});
  d.receipt.sessionId=id;d.receipt.contentHash=hash(p);d.receipt.summaries=summaries(p);return {payload:p,receipt:d.receipt};};
 const results={version:1,hosts:[{id:fixture.payload.participants[0].configuration?.databaseId||'paddock-perf',name:'Home collection',revision:SIZES.races,syncedAt:new Date().toISOString(),results:Array.from({length:SIZES.races},(_,i)=>race(i))}]};
 checkCache(results);fs.writeFileSync(path.join(profile,'paddock-results-v1.json'),JSON.stringify(results));
 // Manual and Track day lap sessions.
 const sha=v=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex'),ids={};const idFor=(k,n)=>ids[k+n]||(ids[k+n]=crypto.randomUUID());
 const sessions=Array.from({length:SIZES.manual},(_,i)=>{const car='Car '+(i%8),track='Track '+(i%4);
  const values=M.normalize({name:'Practice '+i,car,track,driver:'Alex',source:'Manual entry',notes:'',startedAt:day(i).toISOString(),type:'practice',lane:1+i%2,lengthM:20,sequenceConfirmed:true,technical:{pinion:'9',gear:'27',rearDiameter:'19.5',weight:'80',ratedRpm:'21500'},laps:Array.from({length:SIZES.laps},(_,n)=>({number:n+1,durationMs:Math.round((9.8+r()*0.5)*1000),valid:true,pit:false}))});
  return {id:'m-'+i,carId:idFor('car',car),trackId:idFor('track',track),revision:1,createdAt:day(i).toISOString(),updatedAt:day(i).toISOString(),contentHash:sha(values),values};});
 fs.writeFileSync(path.join(profile,'manual-laps-v1.json'),JSON.stringify({format:'slotforge-manual-laps',version:1,id:crypto.randomUUID(),sessions}));
 // Garage.
 const now=new Date().toISOString();
 fs.writeFileSync(path.join(profile,'garage-v1.json'),JSON.stringify({version:1,cars:Array.from({length:SIZES.cars},(_,i)=>({id:'car-'+i,createdAt:now,updatedAt:now,name:'Car '+i,maker:'Home build',raceClass:'GT',notes:''})),tracks:Array.from({length:SIZES.tracks},(_,i)=>({id:'track-'+i,createdAt:now,updatedAt:now,name:'Track '+i,lanes:[{lane:1,lengthM:20},{lane:2,lengthM:20.3}],notes:''}))}));
}

// ---- Main-process timing of every IPC handler ----
const ipc=new Map();
function note(channel,ms,bytes){const s=ipc.get(channel)||{calls:0,ms:0,max:0,bytes:0};s.calls++;s.ms+=ms;s.max=Math.max(s.max,ms);s.bytes+=bytes;ipc.set(channel,s);}
const size=v=>{try{return JSON.stringify(v??null).length;}catch{return 0;}};
const on=ipcMain.on.bind(ipcMain),handle=ipcMain.handle.bind(ipcMain);
ipcMain.on=(channel,fn)=>on(channel,(event,...a)=>{const t=performance.now();fn(event,...a);note(channel,performance.now()-t,size(event.returnValue));});
ipcMain.handle=(channel,fn)=>handle(channel,async(event,...a)=>{const t=performance.now();const v=await fn(event,...a);note(channel,performance.now()-t,size(v));return v;});

const report={profile:EMPTY?'empty':'heavy',sizes:EMPTY?null:SIZES,startup:{},main:{},pages:{},typing:{},hot:[],files:[],ipc:{}};
const ms=v=>Math.round(v*10)/10;
app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
 process.stderr.write('[perf] seeding\n');let t=performance.now();if(!EMPTY)seed();report.main.seedMs=ms(performance.now()-t);
 t=performance.now();const paddock=require('../src/paddock-ipc.cjs').registerPaddock(profile);report.main.registerPaddockMs=ms(performance.now()-t);
 t=performance.now();const storage=require('../src/storage-ipc.cjs').registerStorage(profile,{schedule:false});report.main.registerStorageMs=ms(performance.now()-t);
 t=performance.now();const updates=require('../src/update-ipc.cjs').registerUpdates(profile,{current:'0.0.0',homepage:'https://github.com/example/example',fetch:async()=>{throw Error('offline');},automatic:false});report.main.registerUpdatesMs=ms(performance.now()-t);
 const win=new BrowserWindow({show:false,width:1424,height:1035,webPreferences:{preload:path.join(__dirname,'../src/preload.cjs'),sandbox:true,contextIsolation:true,nodeIntegration:false,backgroundThrottling:false,offscreen:true}}),errors=[];
 win.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message);});
 const step=s=>process.stderr.write(`[perf ${(performance.now()/1000).toFixed(1)} s] ${s}\n`);
 const run=(s,limit=30000)=>Promise.race([win.webContents.executeJavaScript(s,true),new Promise((_,no)=>setTimeout(()=>no(Error('Timed out after '+limit+' ms: '+s.slice(0,120))),limit))]),pause=(n=150)=>new Promise(r=>setTimeout(r,n));
 step('profile seeded, window created');
 // The debugger needs a live page first; the profiler then keeps running across the navigation to the app.
 await win.loadURL('about:blank');step('blank page');
 const cdp=win.webContents.debugger;cdp.attach('1.3');
 const send=(m,p)=>Promise.race([cdp.sendCommand(m,p),new Promise((_,no)=>setTimeout(()=>no(Error('DevTools command timed out: '+m)),15000))]);
 try{
  await send('Page.enable');
  await send('Page.addScriptToEvaluateOnNewDocument',{source:`window.__perf={long:[]};try{new PerformanceObserver(l=>{for(const e of l.getEntries())__perf.long.push([e.startTime,e.duration]);}).observe({type:'longtask',buffered:true});}catch{}`});
  await send('Profiler.enable');await send('Profiler.setSamplingInterval',{interval:200});await send('Profiler.start');step('profiler on');
  // Start-up: from loadFile to the page being idle (no long task for a second).
  t=performance.now();await win.loadFile(path.join(__dirname,'../renderer/index.html'));report.startup.loadFileMs=ms(performance.now()-t);
  const idle=async()=>{let last=-1;for(let i=0;i<60;i++){await pause(250);const n=await run('__perf.long.length');if(n===last)return;last=n;}};
  await pause(1000);await idle();
  const nav=await run(`(()=>{const n=performance.getEntriesByType('navigation')[0];return {domContentLoaded:n.domContentLoadedEventEnd,load:n.loadEventEnd,long:__perf.long};})()`);
  report.startup.domContentLoadedMs=ms(nav.domContentLoaded);report.startup.loadEventMs=ms(nav.load);
  report.startup.longTasks=nav.long.map(([s,d])=>[ms(s),ms(d)]);report.startup.blockedMs=ms(nav.long.reduce((a,[,d])=>a+d,0));
  report.startup.lastLongTaskEndMs=ms(Math.max(0,...nav.long.map(([s,d])=>s+d)));
  report.ipcStartup=Object.fromEntries([...ipc].map(([k,v])=>[k,{...v,ms:ms(v.ms),max:ms(v.max)}]));ipc.clear();
  // CPU profile of start-up: self time by function and by file.
  const summarize=cpu=>{
   const self=new Map(),byNode=new Map(cpu.nodes.map(n=>[n.id,n]));
   cpu.samples.forEach((id,i)=>{self.set(id,(self.get(id)||0)+(cpu.timeDeltas[i]||0));});
   const fn=new Map(),file=new Map();
   for(const [id,us] of self){const f=byNode.get(id).callFrame;if(/^\((idle|program|garbage collector|root)\)$/.test(f.functionName))continue;const where=f.url?path.basename(f.url):'(native)',key=`${f.functionName||'(anonymous)'} · ${where}:${f.lineNumber+1}`;fn.set(key,(fn.get(key)||0)+us/1000);file.set(where,(file.get(where)||0)+us/1000);}
   return {hot:[...fn].sort((a,b)=>b[1]-a[1]).slice(0,25).map(([k,v])=>[k,ms(v)]),files:[...file].sort((a,b)=>b[1]-a[1]).slice(0,15).map(([k,v])=>[k,ms(v)])};};
  const profiled=async(label,work)=>{await send('Profiler.start');await work();const {profile:cpu}=await send('Profiler.stop');report.phases[label]=summarize(cpu);};
  report.phases={};
  ({hot:report.hot,files:report.files}=summarize((await send('Profiler.stop')).profile));

  // Page changes, as a click on a link does it: change the hash, then wait for two painted frames.
  const frame='new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))';
  const routes=['telemetry','trackday','analyze','analyze/compare','analyze/races','analyze/racecompare','analyze/records','analyze/progress','feedback','library','library/races','library/garage','settings','settings/calculations','settings/paddock','settings/backups','settings/updates','telemetry'];
  step('start-up measured');
  await profiled('page changes',async()=>{for(const r of routes){const before=ipc.get('data:get')?.calls||0;step('page '+r);
   const v=await run(`(async()=>{const t=performance.now();location.hash=${JSON.stringify(r)};await new Promise(r=>addEventListener('hashchange',r,{once:true}));const s=performance.now()-t;await ${frame};return [s,performance.now()-t];})()`);
   report.pages[r]={scriptMs:ms(v[0]),paintedMs:ms(v[1]),fileReads:(ipc.get('data:get')?.calls||0)-before};await pause(100);}});

  // Typing on the workbench: 20 keystrokes into the pinion field.
  await run(`location.hash='telemetry'`);await pause(300);
  const typing=async(selector,values,label)=>{ipc.clear();step('typing: '+label);
   const v=await run(`(async()=>{const e=document.querySelector(${JSON.stringify(selector)}),out=[];for(const value of ${JSON.stringify(values)}){const t=performance.now();e.value=value;e.dispatchEvent(new Event('input',{bubbles:true}));const s=performance.now()-t;await ${frame};out.push([s,performance.now()-t]);}return out;})()`);
   const avg=i=>ms(v.reduce((a,x)=>a+x[i],0)/v.length),max=i=>ms(Math.max(...v.map(x=>x[i])));
   report.typing[label]={keys:v.length,scriptAvgMs:avg(0),scriptMaxMs:max(0),paintedAvgMs:avg(1),paintedMaxMs:max(1),ipc:Object.fromEntries([...ipc].map(([k,s])=>[k,{calls:s.calls,ms:ms(s.ms),kb:ms(s.bytes/1024)}]))};};
  const keys=n=>Array.from({length:n},(_,i)=>String(8+i%6));
  await profiled('workbench typing',async()=>{await typing('[name=pinion]',keys(20),'workbench pinion');
   await typing('[name=name]',Array.from({length:20},(_,i)=>'Club GT test'.slice(0,1+i%12)),'workbench name');});
  await run(`location.hash='analyze/races'`);await pause(400);
  await profiled('race search',async()=>{await typing('#race-search',['C','Cl','Clu','Club','Club ','Club n','Club ni','Club nig','Club nigh','Club night'],'race search');
   await typing('#race-search',[''],'race search clear');});
  await run(`location.hash='trackday'`);await pause(300);
  const lapsText=Array.from({length:40},(_,i)=>(10+(i%7)/20).toFixed(3));
  await typing('#trackday-laps',Array.from({length:20},(_,i)=>lapsText.slice(0,2*(i+1)).join('\n')),'track day laps');
  await run(`location.hash='library'`);await pause(300);
  if(await run(`!!document.querySelector('#library-search')`))await typing('#library-search',['C','Cl','Clu','Club','Club G','Club GT'],'library search');
  report.ipc=Object.fromEntries([...ipc].map(([k,v])=>[k,{...v,ms:ms(v.ms),max:ms(v.max)}]));
  report.errors=errors;
 }finally{try{cdp.detach();}catch{}storage.dispose();updates.dispose();paddock.disconnect();win.destroy();}

 // ---- Report ----
 const line=(k,v)=>console.log('  '+k.padEnd(34)+v);
 console.log(`\nTelemetry performance · ${report.profile} profile${EMPTY?'':` (${SIZES.setups} setups, ${SIZES.races} races, ${SIZES.manual} lap sessions × ${SIZES.laps} laps, ${SIZES.cars} cars)`}`);
 console.log('\nMain process');for(const [k,v] of Object.entries(report.main))line(k,v+' ms');
 console.log('\nStart-up (renderer)');line('loadFile resolved',report.startup.loadFileMs+' ms');line('DOMContentLoaded',report.startup.domContentLoadedMs+' ms');line('load event',report.startup.loadEventMs+' ms');line('main thread blocked (long tasks)',report.startup.blockedMs+' ms in '+report.startup.longTasks.length+' tasks');line('last long task ends at',report.startup.lastLongTaskEndMs+' ms');
 console.log('\nStart-up IPC');for(const [k,v] of Object.entries(report.ipcStartup))line(k,`${v.calls}× · ${v.ms} ms · ${Math.round(v.bytes/1024)} KB`);
 console.log('\nStart-up CPU by file (self time)');for(const [k,v] of report.files)line(k,v+' ms');
 console.log('\nStart-up hottest functions (self time)');for(const [k,v] of report.hot.slice(0,15))line(k.slice(0,80),v+' ms');
 console.log('\nPage changes (script / painted, file reads)');for(const [k,v] of Object.entries(report.pages))line(k,`${v.scriptMs} / ${v.paintedMs} ms${v.fileReads?' · '+v.fileReads+' reads':''}`);
 console.log('\nTyping (per keystroke: script avg/max · painted avg/max)');for(const [k,v] of Object.entries(report.typing))line(k,`${v.scriptAvgMs}/${v.scriptMaxMs} · ${v.paintedAvgMs}/${v.paintedMaxMs} ms · ${Object.entries(v.ipc).map(([c,s])=>`${c} ${s.calls}× ${s.ms} ms`).join(', ')||'no IPC'}`);
 for(const [k,v] of Object.entries(report.phases||{})){console.log(`\nHottest functions · ${k} (self time)`);for(const [f,t] of v.hot.slice(0,10))line(f.slice(0,80),t+' ms');}
 if(report.errors?.length)console.log('\nConsole errors:\n'+report.errors.join('\n'));
 if(jsonOut)fs.writeFileSync(jsonOut,JSON.stringify(report,null,1));
 app.quit();try{fs.rmSync(profile,{recursive:true,force:true});}catch{/* Windows may still hold it. */}
}).catch(e=>{console.error(e);app.exit(1);});
setTimeout(()=>{console.error('Performance check took over 5 minutes; stopping.');app.exit(2);},300000).unref();
