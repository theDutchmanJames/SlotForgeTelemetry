// Random-click run: opens the real app on a throwaway copy of a library and clicks, types, picks, navigates and resizes
// at random, recording every console error, page error, failed request, window that tries to open, and moment the page
// stops responding, each with the actions that led to it.
//   npm run monkey                         10 minutes on a heavy example library
//   npm run monkey -- --minutes 60         an hour
//   npm run monkey -- --real               on a copy of your own Telemetry data (the original is never touched)
//   npm run monkey -- --from <folder>      on a copy of another profile folder
//   npm run monkey -- --seed 1234          repeat a run
// The report is written to test-results/monkey-<time>/report.md (and report.json, plus a screenshot per problem).
const {app,BrowserWindow,dialog,shell,session}=require('electron'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const args=process.argv.slice(2),arg=(k,d)=>args.includes(k)?args[args.indexOf(k)+1]:d;
const MINUTES=Number(arg('--minutes',10)),SEED=Number(arg('--seed',Date.now()%1e9)),FROM=args.includes('--real')?path.join(app.getPath('appData'),'SlotForge Calculator'):arg('--from',null);
const out=path.join(__dirname,'../test-results','monkey-'+new Date().toISOString().replace(/[:.]/g,'-'));fs.mkdirSync(out,{recursive:true});
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'telemetry-monkey-'));app.setPath('userData',profile);
app.disableHardwareAcceleration();
function rand(seed){let a=seed>>>0;return ()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};}
const r=rand(SEED),pick=l=>l[Math.floor(r()*l.length)];
// A copy of the profile: only Telemetry's own files, never its browser cache or locks.
function copyProfile(from){
 const skip=new Set(['Cache','Code Cache','GPUCache','DawnCache','DawnGraphiteCache','DawnWebGPUCache','Crashpad','Network','Shared Dictionary','blob_storage','Session Storage','SingletonLock','SingletonCookie','SingletonSocket','lockfile']);
 const copy=(a,b)=>{for(const e of fs.readdirSync(a,{withFileTypes:true})){if(skip.has(e.name))continue;const s=path.join(a,e.name),d=path.join(b,e.name);if(e.isDirectory()){fs.mkdirSync(d,{recursive:true});copy(s,d);}else if(e.isFile())try{fs.copyFileSync(s,d);}catch{/* In use: skipped. */}}};
 copy(from,profile);
}
const problems=new Map(),trail=[];let steps=0,win=null,started=Date.now();
const note=s=>{trail.push(`${steps}: ${s}`);if(trail.length>25)trail.shift();};
async function problem(kind,message){
 const key=kind+': '+String(message).replace(/\d+(\.\d+)?/g,'#').slice(0,300);
 if(problems.has(key)){problems.get(key).count++;return;}
 const entry={kind,message:String(message).slice(0,2000),count:1,step:steps,hash:await win?.webContents.executeJavaScript('location.hash',true).catch(()=>'?'),trail:[...trail]};
 problems.set(key,entry);process.stderr.write(`[monkey] ${kind}: ${String(message).slice(0,200)}\n`);
 try{entry.screenshot='problem-'+problems.size+'.png';fs.writeFileSync(path.join(out,entry.screenshot),(await win.webContents.capturePage()).toPNG());}catch{}
}
// Native dialogs answer at random; nothing is opened outside the app, nothing is downloaded.
dialog.showMessageBox=async()=>({response:r()<.5?0:1,checkboxChecked:false});
dialog.showMessageBoxSync=()=>0;dialog.showErrorBox=(t,c)=>void problem('error box',t+' '+c);
dialog.showSaveDialog=async()=>r()<.5?{canceled:true}:{canceled:false,filePath:path.join(out,'saved-'+steps+'.json')};
dialog.showOpenDialog=async()=>{const backups=path.join(profile,'backups');let files=[];try{files=fs.readdirSync(backups).map(n=>path.join(backups,n));}catch{}return r()<.6||!files.length?{canceled:true,filePaths:[]}:{canceled:false,filePaths:[pick(files)]};};
shell.openExternal=async u=>note('(would open '+u+')');shell.openPath=async()=>'';shell.showItemInFolder=()=>{};
// Every action the page can take, as a string run in the page. Picks only visible, enabled controls.
const ACT=`(()=>{
 const R=Math.random,pick=l=>l[Math.floor(R()*l.length)];
 const visible=e=>{if(e.closest('[hidden],[inert]'))return false;const b=e.getBoundingClientRect();if(!b.width||!b.height)return false;const s=getComputedStyle(e);return s.visibility!=='hidden'&&s.display!=='none';};
 const name=e=>(e.tagName.toLowerCase()+(e.id?'#'+e.id:'')+(e.name?'[name='+e.name+']':'')+' '+JSON.stringify((e.getAttribute('aria-label')||e.textContent||e.value||'').trim().replace(/\\s+/g,' ').slice(0,50)));
 const all=s=>[...document.querySelectorAll(s)].filter(visible);
 // Like a real mouse: only what is on top at its own spot (nothing behind an open dialog or under another layer).
 const onTop=e=>{e.scrollIntoView({block:'center'});const b=e.getBoundingClientRect(),hit=document.elementFromPoint(b.left+b.width/2,b.top+b.height/2);return !!hit&&(hit===e||e.contains(hit)||hit.closest('label')?.control===e);};
 const TEXT=['','0','-1','1','9','27','0.5','1e309','99999999','abc','12,5',' 10 ','<b>x</b>','🏎️','\\n','10.2\\n10.1\\n10.3','NaN','.','-0'];
 const roll=R();
 if(roll<.5){const c=all('button:not([disabled]),a[href],summary,[role=button],[role=tab],[data-feedback-question],input[type=checkbox]:not([disabled]),input[type=radio]:not([disabled]),label[for]').filter(e=>!e.matches('[download],input[type=file]'));if(!c.length)return 'nothing to click';let e=null;for(let i=0;i<8&&!e;i++){const x=pick(c);if(onTop(x))e=x;}if(!e)return 'nothing on top to click';if(typeof e.click==='function')e.click();else e.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));return 'click '+name(e);}
 if(roll<.72){const c=all('input:not([type=checkbox]):not([type=radio]):not([type=file]):not([disabled]):not([readonly]),textarea:not([disabled]):not([readonly])');if(!c.length)return 'nothing to type in';const e=pick(c),v=pick(TEXT);if(!onTop(e))return 'field covered';e.focus();e.value=e.type==='number'&&isNaN(Number(v))?'':v;e.dispatchEvent(new Event('input',{bubbles:true}));if(R()<.5)e.dispatchEvent(new Event('change',{bubbles:true}));if(R()<.2)e.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));return 'type '+JSON.stringify(v)+' in '+name(e);}
 if(roll<.82){const c=all('select:not([disabled])');if(!c.length)return 'no select';const e=pick(c);if(!onTop(e))return 'select covered';if(!e.options.length)return 'empty select';e.selectedIndex=Math.floor(R()*e.options.length);e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));return 'choose '+JSON.stringify(e.value)+' in '+name(e);}
 if(roll<.92){const routes=[...new Set([...document.querySelectorAll('a[href^="#"]')].map(a=>a.getAttribute('href')).filter(h=>h.length>1))];if(!routes.length)return 'no routes';const h=pick(routes);location.hash=h;return 'go to '+h;}
 const k=pick(['Escape','Tab','Enter','ArrowDown','ArrowUp',' ']),t=document.activeElement||document.body;t.dispatchEvent(new KeyboardEvent('keydown',{key:k,bubbles:true}));t.dispatchEvent(new KeyboardEvent('keyup',{key:k,bubbles:true}));return 'key '+k+' on '+name(t);
})()`;
// Page dialogs (alert, confirm, prompt) would wait for a person.
const QUIET="window.alert=()=>{};window.confirm=()=>Math.random()<.5;window.prompt=()=>null;0;";
app.whenReady().then(async()=>{
 if(FROM){process.stderr.write('[monkey] copying '+FROM+'\n');copyProfile(FROM);}else require('./heavy-profile.cjs').seed(profile);
 const {recover}=require('../src/backups.cjs');recover(profile);
 const local=fs.mkdtempSync(path.join(os.tmpdir(),'telemetry-monkey-paddock-'));// No Paddock on this computer is ever found.
 require('../src/paddock-discovery.cjs').scan=async()=>[];// Never looks for Paddock on the network either.
 const paddock=require('../src/paddock-ipc.cjs').registerPaddock(profile,{localFolder:local});
 let restarts=0;const relaunch=()=>{restarts++;note('(Telemetry restarts)');win.loadFile(path.join(__dirname,'../renderer/index.html'));};
 require('../src/storage-ipc.cjs').registerStorage(profile,{schedule:false,relaunch});
 const updates=require('../src/update-ipc.cjs').registerUpdates(profile,{current:'0.0.0',homepage:'https://github.com/example/example',fetch:async()=>{throw Error('offline (random-click run)');},automatic:false});
 win=new BrowserWindow({show:false,width:1440,height:1000,webPreferences:{preload:path.join(__dirname,'../src/preload.cjs'),sandbox:true,contextIsolation:true,nodeIntegration:false,backgroundThrottling:false,offscreen:true}});
 // The app's own link rules (main.cjs); a window for anything but an https link, or leaving the page, is a problem.
 require('../src/links.cjs').guardLinks(win.webContents);
 win.webContents.on('did-create-window',w=>void problem('window','a window opened: '+w.webContents.getURL()));
 shell.openExternal=async u=>{if(!/^https:\/\//.test(u))void problem('link','asked to open '+u);else note('(opens '+u+' in the browser)');};
 win.webContents.on('will-navigate',(e,url)=>void problem('navigation','tried to leave the app for '+url));
 win.webContents.on('console-message',e=>{if(e.level==='error')void problem('console error',e.message+(e.sourceId?' ('+path.basename(e.sourceId)+':'+e.lineNumber+')':''));});
 win.webContents.on('render-process-gone',(e,d)=>void problem('page crashed',d.reason));
 win.webContents.on('unresponsive',()=>void problem('unresponsive','the page stopped responding'));
 win.webContents.on('did-finish-load',()=>void win.webContents.executeJavaScript(QUIET,true));
 session.defaultSession.on('will-download',(e,item)=>{note('(download '+item.getFilename()+' cancelled)');e.preventDefault();});
 session.defaultSession.webRequest.onErrorOccurred(d=>{if(d.error!=='net::ERR_ABORTED'&&!d.url.startsWith('blob:'))void problem('failed request',d.error+' '+d.url.replace(/^file:.*\/renderer\//,''));});
 const run=(s,limit=15000)=>Promise.race([win.webContents.executeJavaScript(s,true),new Promise((_,no)=>setTimeout(()=>no(Object.assign(Error('timed out'),{timeout:true})),limit))]);
 await win.loadFile(path.join(__dirname,'../renderer/index.html'));await run(QUIET);
 const end=started+MINUTES*60000;let last=0;
 process.stderr.write(`[monkey] seed ${SEED}, ${MINUTES} min, profile ${FROM?'copy of '+FROM:'heavy example'}\n`);
 while(Date.now()<end){
  steps++;
  try{
   if(r()<.03){const w=pick([390,760,1024,1440,1920]);win.setSize(w,pick([700,1000,1200]));note('resize to '+w);}
   else note(await run(ACT));
   if(BrowserWindow.getAllWindows().length>1)await problem('window','an extra window is open');
  }catch(e){note('(the action failed: '+e.message.slice(0,80)+')');if(e.timeout)await problem('unresponsive','an action took more than 15 s');else await problem('driver',e.message);}
  await new Promise(res=>setTimeout(res,40+r()*120));
  if(Date.now()-last>60000){last=Date.now();process.stderr.write(`[monkey] ${Math.round((Date.now()-started)/60000)} min, ${steps} actions, ${problems.size} problems\n`);}
 }
 const list=[...problems.values()].sort((a,b)=>a.step-b.step);
 const report={seed:SEED,minutes:MINUTES,profile:FROM?'copy of '+FROM:'heavy example',actions:steps,restarts,problems:list};
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
 fs.writeFileSync(path.join(out,'report.md'),`# Random-click run\n\nSeed ${SEED} · ${MINUTES} min · ${steps} actions · ${restarts} restarts · ${report.profile}\n\n`+(list.length?list.map((p,i)=>`## ${i+1}. ${p.kind} (×${p.count})\n\n${p.message}\n\nAt action ${p.step}, page ${p.hash}${p.screenshot?' · '+p.screenshot:''}\n\nLast actions:\n\n\`\`\`\n${p.trail.join('\n')}\n\`\`\`\n`).join('\n'):'No problems found.\n'));
 console.log(`Random-click run: ${steps} actions in ${MINUTES} min, ${list.length} distinct problems. Report: ${path.relative(process.cwd(),path.join(out,'report.md'))}`);
 paddock.disconnect();updates.dispose();win.destroy();for(const d of [profile,local])try{fs.rmSync(d,{recursive:true,force:true});}catch{/* Still in use: the system cleans its temp folder. */}app.quit();
}).catch(e=>{console.error(e);app.exit(1);});
