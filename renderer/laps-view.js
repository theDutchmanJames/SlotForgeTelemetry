// SlotForge Remake (Pace Wall): the Laps page. Pick a car, then a track and lane; a scoreboard, every lap of every run
// as a wall of squares coloured by how close it came to the record, which setup change moved the pace, and the
// selected run in a side panel. The detailed lap analysis and run comparison open from here (#laps/run, #laps/compare).
const LapsUI=(()=>{
 const M=PaceWallModel,$=id=>document.getElementById(id);
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const sec=ms=>ms===null||ms===undefined||!Number.isFinite(ms)?'—':(ms/1000).toFixed(3);
 const signed=ms=>ms===null||!Number.isFinite(ms)?'—':(ms<0?'−':ms>0?'+':'±')+(Math.abs(ms)/1000).toFixed(3);
 const dayFormat=new Intl.DateTimeFormat(undefined,{day:'numeric',month:'short'}),fullFormat=new Intl.DateTimeFormat(undefined,{dateStyle:'medium',timeStyle:'short'});
 const day=s=>{const d=new Date(s);return Number.isFinite(d.getTime())?dayFormat.format(d):'—';},full=s=>{const d=new Date(s);return Number.isFinite(d.getTime())?fullFormat.format(d):'—';};
 const STORE='slotforge.telemetry.runnotes.v1',ROWS=12,COLUMNS=40;
 let runs=[],car='',line='',runId='',mode='record',showAll=false,notes=RunNotesModel.empty(),notesError='';
 const stats=new WeakMap(),statsOf=run=>{if(!stats.has(run))stats.set(run,RaceModel.statistics(run));return stats.get(run);};
 // Green at the reference, through yellow, to red at the end of the scale.
 const RAMP=[[62,207,142],[201,226,101],[242,183,5],[240,138,75],[229,72,77]];
 function colour(t){const p=t*4,i=Math.min(3,Math.floor(p)),k=p-i;return `rgb(${RAMP[i].map((a,j)=>Math.round(a+(RAMP[i+1][j]-a)*k)).join(',')})`;}
 const tagOf=run=>notes.runs[run.id]?.tag||M.defaultTag(run),noteOf=run=>notes.runs[run.id]?.note||'';
 const tagChip=run=>{const t=tagOf(run);return `<span class="lw-tag" data-tag="${t}">${M.TAGS[t]}</span>`;};
 const sourceOf=run=>run.entryKind==='manual'?(/track day/i.test(run.sourceName||'')?'Track day':'Typed in'):'Paddock · '+run.hostName;
 function readNotes(){try{notes=RunNotesModel.decode(DataStore.getItem(STORE));notesError='';}catch(e){notes=RunNotesModel.empty();notesError='Your notes could not be read: '+e.message+' Restore a backup in Settings → Backups.';}}
 function saveNote(id,changes){if(notesError)return;try{notes=RunNotesModel.set(notes,id,changes);DataStore.setItem(STORE,JSON.stringify(notes));}catch(e){toast('Could not save the note: '+e.message);}}
 function markup(){
  document.querySelector('[data-route=analyze]').insertAdjacentHTML('beforebegin','<a href="#laps" data-route="laps">Laps</a>');
  document.querySelector('[data-page=analyze]').insertAdjacentHTML('beforebegin',`<section data-page="laps" hidden>
   <div class="page-head lw-head"><div><p class="eyebrow" id="lw-eyebrow">PACE BY CAR</p><h1>Laps</h1><nav class="lw-crumb" id="lw-crumb" hidden><a href="#laps">← Back to the wall</a><span id="lw-crumb-run"></span></nav></div>
    <div class="actions"><details class="lw-more"><summary class="btn ghost">More</summary><div class="lw-menu" id="lw-menu"><a class="btn ghost" href="#settings/paddock">${sfIcon('transfer')}Connect to Paddock</a><button class="btn ghost" id="race-export">${sfIcon('upload')}Export imported races</button><div id="lw-manual-tools"></div></div></details><button class="btn" data-race-sync>${sfIcon('history')}Refresh from Paddock</button><button class="btn primary" data-manual-add>${sfIcon('plus')}Add laps</button></div></div>
   <p class="note" id="race-error" role="alert" hidden></p><p class="note" id="race-quarantine" role="status" hidden></p><p class="note" id="lw-notes-error" role="alert" hidden></p>
   <div id="lw-view">
    <div id="lw-empty" class="library-empty" hidden><h2>Your laps belong here.</h2><p>Log a run on Track day, type in laps from another timer or a notebook, or import races from Paddock. Every run of a car on the same track and lane lands on one wall.</p><button class="btn primary" data-manual-add>Add laps</button> <a class="btn" href="#trackday">Go to Track day</a> <a class="btn" href="#settings/paddock">Connect to Paddock</a></div>
    <div id="lw-content">
     <div class="lw-cars" id="lw-cars" role="group" aria-label="Car"></div>
     <div class="lw-scope"><span class="lw-label">Track · lane</span><div id="lw-lines" class="lw-lines" role="group" aria-label="Track and lane"></div><span class="lw-grow"></span><span class="lw-label">Colour</span><div class="lw-seg" role="group" aria-label="Colour the laps"><button data-lw-mode="record" aria-pressed="true">vs record</button><button data-lw-mode="median" aria-pressed="false">vs own typical lap</button></div></div>
     <section class="lw-score panel" id="lw-score" aria-label="Scoreboard"></section>
     <div class="lw-grid">
      <div class="lw-main">
       <section class="panel lw-wall"><div class="lw-wall-head"><h2>Every lap, every run</h2><span class="hint" id="lw-wall-hint">Newest on top · a square per lap · outlined: the best lap of the run</span></div><div class="lw-wall-scroll"><div id="lw-wall"></div></div><div class="lw-legend" id="lw-legend"></div><button class="btn small" id="lw-older" hidden></button></section>
       <section class="panel lw-ledger" id="lw-ledger"></section>
      </div>
      <aside class="panel lw-drawer" id="lw-drawer" aria-label="Selected run"></aside>
     </div>
     <p class="hint" id="lw-sources"></p>
    </div>
   </div>
   <div id="lw-sub"></div>
  </section>`);
 }
 function pick(list){
  const carList=M.cars(list);if(!carList.some(c=>c.key===car))car=carList[0]?.key||'';
  const lineList=M.lines(list,car);if(!lineList.some(l=>l.key===line))line=lineList[0]?.key||'';
  const current=lineList.find(l=>l.key===line);if(current&&!current.runs.some(r=>r.id===runId))runId=current.runs[0].id;
  return {carList,lineList,current};
 }
 function render(next){
  if(next)runs=next;
  if(!$('lw-view'))return;
  $('lw-notes-error').hidden=!notesError;$('lw-notes-error').textContent=notesError;
  $('lw-empty').hidden=runs.length>0;$('lw-content').hidden=!runs.length;if(!runs.length)return;
  const {carList,lineList,current}=pick(runs);
  $('lw-cars').innerHTML=carList.map(c=>`<button class="lw-car" data-lw-car="${esc(c.key)}" aria-pressed="${c.key===car}"><b>${esc(c.name)}</b><small>${c.runs} run${c.runs===1?'':'s'} · ${c.lines} track${c.lines===1?'':'s'} &amp; lane${c.lines===1?'':'s'}</small></button>`).join('');
  $('lw-lines').innerHTML=lineList.map(l=>`<button class="lw-chip" data-lw-line="${esc(l.key)}" aria-pressed="${l.key===line}">${esc(l.track)} · lane ${l.lane} <small>${l.runs.length}</small></button>`).join('');
  for(const b of document.querySelectorAll('[data-lw-mode]'))b.setAttribute('aria-pressed',String(b.dataset.lwMode===mode));
  score(current);wall(current);ledger(current);paint($('lw-ledger'));drawer(current);
  const hosts=[...new Set(runs.filter(r=>r.entryKind!=='manual').map(r=>r.hostName))],manual=runs.filter(r=>r.entryKind==='manual').length;
  $('lw-sources').textContent=[hosts.length?'From Paddock: '+hosts.join(', ')+'.':'',manual?`${manual} run${manual===1?'':'s'} from Track day or typed in.`:'','Imported races are read-only: correct them in Timing, then refresh.'].filter(Boolean).join(' ');
 }
 function score(current){
  const s=M.summary(current,statsOf),rec=s.record;
  const cell=(label,value,caption,cls='')=>`<div><span class="lw-label">${label}</span><strong class="lw-big ${cls}">${value}</strong><small>${caption}</small></div>`;
  $('lw-score').innerHTML=
   cell('Record',sec(rec?.lap.durationMs),rec?`${esc(day(rec.run.startedAt))} · ${esc(rec.run.sessionName)}`:'No record-eligible lap yet','lw-rec')+
   cell('Pace now',sec(s.paceNow),`typical lap of the last ${s.paceRuns===1?'run':s.paceRuns+' runs'}`)+
   cell('Gained',s.gained===null?'—':signed(s.gained),s.since?`typical lap since the first run, ${esc(day(s.since.startedAt))}`:'after a second run',s.gained===null?'':s.gained<0?'lw-good':s.gained>0?'lw-bad':'')+
   cell('Consistency',sec(s.spread),`middle 50% spread, last run${s.previousSpread!==null?' · was '+sec(s.previousSpread):''}`);
 }
 function wall(current){
  const list=showAll?current.runs:current.runs.slice(0,ROWS),record=M.summary(current,statsOf).record?.lap.durationMs??null;
  const columns=Math.min(COLUMNS,Math.max(...list.map(r=>r.laps.length))),labels=columns<=24;
  let html=`<div class="lw-row lw-cols${labels?"":" lw-dense"}" data-cols="${columns}" aria-hidden="true"><span></span>${Array.from({length:columns},(_,i)=>`<span>${i+1}</span>`).join('')}<span>typical</span></div>`;
  list.forEach((run,index)=>{
   const st=statsOf(run),before=current.runs[current.runs.indexOf(run)+1],changed=M.changes(before,run);
   if(changed.length)html+=`<div class="lw-change">▼ changed: ${changed.map(c=>`<span class="lw-diff">${esc(c.label)}</span>`).join(' ')}</div>`;
   const reference=mode==='median'?st.median:record,bestId=run.laps.find(l=>M.eligible(l)&&l.durationMs===st.best)?.id;
   html+=`<div class="lw-row${labels?"":" lw-dense"}" data-cols="${columns}" data-selected="${run.id===runId}"><button class="lw-who" data-lw-run="${esc(run.id)}" aria-pressed="${run.id===runId}"><b>${esc(day(run.startedAt))} · ${esc(run.sessionName)}</b><small>${M.TAGS[tagOf(run)]} · ${esc(sourceOf(run))}</small></button>`;
   for(let i=0;i<columns;i++){
    const lap=run.laps[i];if(!lap){html+='<i class="lw-cell lw-none"></i>';continue;}
    if(i===columns-1&&run.laps.length>columns){html+=`<i class="lw-cell lw-more" title="${run.laps.length-columns+1} more laps: open the full lap analysis">+${run.laps.length-columns+1}</i>`;continue;}
    const included=lap.valid&&!lap.pit,t=included?M.shade(lap.durationMs,reference):null,isRecord=included&&lap.durationMs===record&&M.eligible(lap);
    const label=`Lap ${lap.number}: ${sec(lap.durationMs)} s${!included?(lap.pit?' · pit lap':' · excluded'):''}${isRecord?' · record':lap.id===bestId?' · best of the run':''}`;
    html+=`<i class="lw-cell${!included?' lw-out':''}${isRecord?' lw-record':lap.id===bestId?' lw-best':''}" ${included&&t!==null?`data-bg="${colour(t)}"`:''} title="${esc(label)}">${labels?(lap.durationMs/1000%1).toFixed(2).slice(1):''}</i>`;
   }
   html+=`<span class="lw-typ">${sec(st.median)}</span></div>`;
  });
  $('lw-wall').innerHTML=html;paint($('lw-wall'));$('lw-wall').setAttribute('aria-label',`${list.length} runs of ${current.car} on ${current.track}, lane ${current.lane}`);
  const hidden=current.runs.length-list.length;$('lw-older').hidden=current.runs.length<=ROWS;$('lw-older').textContent=showAll?'Show the newest 12 runs':`Show ${hidden} older run${hidden===1?'':'s'}`;
  const scale=mode==='median'?'own typical lap':'record';
  $('lw-legend').innerHTML=`<span>${scale}</span><span class="lw-ramp"></span><span>6% slower${record?` (≈ +${(M.scaleMs(record)/1000).toFixed(2)} s)`:''}</span><span class="lw-key"><i class="lw-cell lw-out"></i>excluded or pit</span><span class="lw-key"><i class="lw-cell lw-record"></i>record lap</span><span class="lw-key"><i class="lw-cell lw-best"></i>best of the run</span>`;
 }
 function ledger(current){
  const rows=M.ledger(current,statsOf),max=Math.max(1,...rows.map(r=>Math.abs(r.delta||0)));
  $('lw-ledger').innerHTML=`<h2>What moved the pace</h2><p class="hint">Each setup change on this track and lane, with the typical lap before and after. Driver and conditions can still differ, and one run is a small sample.</p>`+(rows.length?`<div class="lw-ledger-rows"><div class="lw-lrow lw-lhead"><span>Date</span><span>Change</span><span>Typical lap</span><span>Effect</span></div>${rows.slice().reverse().map(r=>`<div class="lw-lrow"><span>${esc(day(r.run.startedAt))}</span><span>${r.changes.map(c=>`<span class="lw-diff">${esc(c.label)}</span>`).join(' ')}</span><span class="lw-num">${sec(r.from)} → ${sec(r.to)}</span><span>${r.delta===null?'—':`<i class="lw-bar ${r.delta<0?'lw-good':'lw-bad'}" data-w="${Math.max(4,Math.round(Math.abs(r.delta)/max*100))}"></i><small class="lw-num ${r.delta<0?'lw-good':r.delta>0?'lw-bad':''}">${signed(r.delta)} s</small>`}</span></div>`).join('')}</div>`:'<p class="lw-quiet">No setup changes recorded on this track and lane yet. Track day runs and Paddock races keep the gearing, motor, tyres and weight they were driven with; a change between two runs shows up here.</p>');
 }
 // The page allows no inline styles: sizes and colours are set here instead.
 function paint(box){for(const e of box.querySelectorAll('[data-cols]'))e.style.setProperty('--cols',e.dataset.cols);for(const e of box.querySelectorAll('[data-bg]'))e.style.background=e.dataset.bg;for(const e of box.querySelectorAll('[data-w]'))e.style.width=e.dataset.w+'%';}
 function lapChart(run){
  const st=statsOf(run),w=340,h=130,top=h-18,laps=run.laps.slice(0,80),inc=laps.filter(l=>l.valid&&!l.pit);
  if(!inc.length)return '<p class="lw-quiet">No included laps to show.</p>';
  const lo=Math.min(...inc.map(l=>l.durationMs))*0.997,cap=(st.median??lo)*1.03,x=i=>12+i*(w-24)/Math.max(1,laps.length-1),y=v=>top-(Math.min(v,cap)-lo)/(cap-lo||1)*(top-12);
  const bw=Math.max(2,Math.min(22,(w-24)/laps.length-3));
  let s=`<svg class="lw-chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="Lap times of this run: a shorter bar is a quicker lap">`;
  laps.forEach((l,i)=>{const inc=l.valid&&!l.pit,slow=!inc||l.durationMs>cap;s+=`<rect x="${(x(i)-bw/2).toFixed(1)}" y="${(inc?y(l.durationMs):12).toFixed(1)}" width="${bw.toFixed(1)}" height="${(top-(inc?y(l.durationMs):12)).toFixed(1)}" rx="1.5" class="${!inc?'lw-bar-out':l.durationMs===st.best?'lw-bar-best':slow?'lw-bar-slow':'lw-bar-lap'}"><title>Lap ${l.number}: ${sec(l.durationMs)} s</title></rect>`;});
  if(st.median!==null)s+=`<line x1="0" x2="${w}" y1="${y(st.median)}" y2="${y(st.median)}" class="lw-chart-typ"/><text x="${w-2}" y="${y(st.median)-4}" text-anchor="end" class="lw-chart-label">typical ${sec(st.median)}</text>`;
  for(const i of [...new Set([0,laps.length-1])])s+=`<text x="${x(i)}" y="${h-4}" text-anchor="middle" class="lw-chart-label">${laps[i].number}</text>`;
  return s+'</svg>';
 }
 function drawer(current){
  const run=current.runs.find(r=>r.id===runId),box=$('lw-drawer');if(!run){box.innerHTML='';return;}
  // A refresh from Paddock while you type keeps the note you are writing.
  if(box.dataset.run===run.id&&document.activeElement===$('lw-note'))return;box.dataset.run=run.id;
  const st=statsOf(run),before=current.runs[current.runs.indexOf(run)+1],bs=before?statsOf(before):null,changed=M.changes(before,run);
  const tech=run.configuration?.technical||{},specs=[['Gearing',tech.pinion&&tech.gear?tech.pinion+' / '+tech.gear:null],['Motor',tech.ratedRpm?tech.ratedRpm+' RPM':tech.motor||null],['Rear tyre',tech.rearDiameter||tech.rearTyreDiameter?(tech.rearDiameter||tech.rearTyreDiameter)+' mm':null],['Weight',tech.totalWeight||tech.weight?(tech.totalWeight||tech.weight)+' g':null]];
  const stints=RaceModel.stintAnalysis(run),out=run.laps.filter(l=>!l.valid||l.pit).length,manual=run.entryKind==='manual';
  const vs=(a,b)=>a===null||b===null?'—':`<b class="lw-num ${b-a<0?'lw-good':b-a>0?'lw-bad':''}">${signed(b-a)} s</b>`;
  box.innerHTML=`<p class="eyebrow">${esc(full(run.startedAt))}</p><h2>${esc(run.sessionName)} ${tagChip(run)}</h2><p class="lw-src">${esc(sourceOf(run))} · ${esc(run.track)} · lane ${run.lane} · ${esc(run.driver)}</p>
   <p class="lw-line"><span>${run.laps.length} laps</span><span>best <b class="lw-num">${sec(st.best)}</b></span><span>typical <b class="lw-num">${sec(st.median)}</b></span><span>spread <b class="lw-num">${sec(st.spread)}</b></span>${st.bestRun?`<span>best 5 in a row <b class="lw-num">${sec(st.bestRun.mean)}</b></span>`:''}</p>
   ${lapChart(run)}
   <div class="lw-chips">${stints.map((s,i)=>`<span class="lw-chip lw-static">${stints.length>1?'Stint '+(i+1)+' · ':''}${s.statistics.count} of ${s.laps.length} laps counted</span>`).join('')}${out?`<span class="lw-chip lw-static">${out} excluded or pit</span>`:''}</div>
   ${before?`<p class="lw-vs">Against the run before (${esc(day(before.startedAt))}): typical ${vs(bs.median,st.median)}, best ${vs(bs.best,st.best)}${changed.length?' after '+changed.map(c=>`<span class="lw-diff">${esc(c.label)}</span>`).join(' '):''}</p>`:'<p class="lw-vs lw-quiet">The first run on this track and lane.</p>'}
   <h3>Raced with</h3><dl class="lw-specs">${specs.map(([k,v])=>`<div><dt>${k}</dt><dd>${v?esc(v):'<span class="lw-quiet">not recorded</span>'}</dd></div>`).join('')}</dl>
   <h3>Your note</h3><div class="lw-tags" role="group" aria-label="Kind of run">${Object.entries(M.TAGS).map(([k,v])=>`<button class="lw-chip" data-lw-tag="${k}" aria-pressed="${tagOf(run)===k}">${v}</button>`).join('')}</div>
   <textarea id="lw-note" rows="3" maxlength="${RunNotesModel.MAX_NOTE}" placeholder="Track conditions, how the car felt…" aria-label="Note on this run"${notesError?' disabled':''}>${esc(noteOf(run))}</textarea>
   ${manual&&run.notes?`<p class="lw-entered"><span class="lw-label">Entered with the laps</span>${esc(run.notes)}</p>`:''}
   <div class="actions lw-actions">${before?`<button class="btn small" id="lw-compare">Compare with the run before</button>`:''}<button class="btn small" id="lw-detail">Full lap analysis</button>${manual?`<button class="btn small" id="lw-edit">Edit laps</button><button class="btn small danger" id="lw-delete">Delete</button>`:''}</div>`;
  if(before)$('lw-compare').onclick=()=>RaceUI.compare(before.id,run.id);
  $('lw-detail').onclick=()=>RaceUI.detail(run.id);
  if(manual){$('lw-edit').onclick=()=>ManualLapsUI.edit(run.manualId);$('lw-delete').onclick=()=>ManualLapsUI.remove(run.manualId);}
  const note=$('lw-note');let timer=null;note.oninput=()=>{clearTimeout(timer);timer=setTimeout(()=>saveNote(run.id,{note:note.value}),400);};note.onblur=()=>{clearTimeout(timer);saveNote(run.id,{note:note.value});};
 }
 // Open a run on the wall (from Track day, the Garage or after saving laps).
 function open(id){const run=runs.find(r=>r.id===id);if(run){car=M.carKey(run);line=M.lineKey(run);runId=id;const l=M.lines(runs,car).find(x=>x.key===line);showAll=showAll||(l?.runs.indexOf(run)??0)>=ROWS;}navigate('laps');render();$('lw-drawer')?.scrollIntoView?.({block:'nearest'});}
 function route(page,sub){
  if(page!=='laps')return;const inSub=['run','compare'].includes(sub);
  $('lw-view').hidden=inSub;$('lw-crumb').hidden=!inSub;$('lw-eyebrow').textContent=inSub?(sub==='run'?'FULL LAP ANALYSIS':'COMPARE TWO RUNS'):'PACE BY CAR';
  if(!inSub)render();
 }
 function init(){
  readNotes();markup();
  $('lw-cars').onclick=e=>{const b=e.target.closest('[data-lw-car]');if(!b)return;car=b.dataset.lwCar;line='';runId='';showAll=false;render();};
  $('lw-lines').onclick=e=>{const b=e.target.closest('[data-lw-line]');if(!b)return;line=b.dataset.lwLine;runId='';showAll=false;render();};
  $('lw-wall').onclick=e=>{const b=e.target.closest('[data-lw-run]');if(!b)return;runId=b.dataset.lwRun;render();};
  $('lw-older').onclick=()=>{showAll=!showAll;render();};
  for(const b of document.querySelectorAll('[data-lw-mode]'))b.onclick=()=>{mode=b.dataset.lwMode;render();};
  $('lw-drawer').addEventListener('click',e=>{const b=e.target.closest('[data-lw-tag]');if(!b||!runId)return;saveNote(runId,{tag:b.dataset.lwTag});render();});
  // More: a link closes the menu, a click outside it too. Backup and restore keep it open to show their message.
  const more=document.querySelector('.lw-more');more.addEventListener('click',e=>{if(e.target.closest('.lw-menu a'))more.open=false;});
  document.addEventListener('click',e=>{if(more.open&&!more.contains(e.target))more.open=false;});
  // Backups restore every data file: read the notes again when the page is shown after a restore or reload.
  window.addEventListener('focus',()=>{const before=JSON.stringify(notes);readNotes();if(JSON.stringify(notes)!==before)render();});
 }
 return {init,render,route,open,state:()=>({car,line,runId,mode,showAll})};
})();
