// SlotForge Remake (Pit Board): Track day. One session (car, track, lane, driver from your garage), today's runs as
// columns side by side with the verdict against the run before and the quickest marked, and the next run as the last
// column: change the setup with steppers, type laps one box at a time (or paste), see the verdict as you type.
// When a change wins, "Keep this change" writes it to the workbench setup.
const TrackdayUI=(()=>{
  const KEY='slotforge.telemetry.trackday.v1',q=s=>document.querySelector(s),M=()=>TrackdayModel;
  let ctx={car:'',track:'',lane:1,driver:'',sequence:false},busy=false,laps=[],dismissed='',extra='';
  const time=ms=>Number.isFinite(ms)?(ms/1000).toFixed(3):'—';
  const clock=iso=>new Date(iso).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});
  function save(){try{localStorage.setItem(KEY,JSON.stringify(ctx));}catch{/* Works for this session. */}}
  // Steppers for the setup fields a run records. Weight and tyre in their display units; stored metric.
  const STEPS=[['pinion','Pinion',1,0],['gear','Gear',1,0],['totalWeight','Weight',1,1],['rearDiameter','Rear tyre',0.1,2]];
  function init(){
    try{const v=JSON.parse(localStorage.getItem(KEY)||'null');if(v)ctx={car:String(v.car||''),track:String(v.track||''),lane:Number.isInteger(v.lane)&&v.lane>=1&&v.lane<=64?v.lane:1,driver:String(v.driver||''),sequence:v.sequence===true};}catch{/* Defaults. */}
    q('[data-route=telemetry]').insertAdjacentHTML('afterend','<a href="#trackday" data-route="trackday">Track day</a>');
    q('[data-page=telemetry]').insertAdjacentHTML('afterend',`<section data-page="trackday" hidden><div class="page-head"><div><p class="eyebrow" id="trackday-eyebrow">AT THE TRACK</p><h1>Track day</h1></div><div class="actions"><button type="button" class="btn ghost" id="trackday-sheet">Setup sheet</button><a class="btn" href="#laps" id="trackday-wall">Open on the Laps wall</a></div></div>
    <section class="panel td-session" aria-label="Session">
     <label class="td-pick"><span>Car</span><input id="trackday-car" maxlength="200" autocomplete="off" list="trackday-car-list" placeholder="Choose a car"></label>
     <label class="td-pick"><span>Track</span><input id="trackday-track" maxlength="200" autocomplete="off" list="trackday-track-list" placeholder="Choose a track"></label>
     <datalist id="trackday-car-list"></datalist><datalist id="trackday-track-list"></datalist>
     <div class="td-pick"><span>Lane</span><div class="td-lanes" id="trackday-lanes" role="group" aria-label="Lane"></div><input id="trackday-lane" type="number" min="1" max="64" step="1" inputmode="numeric" aria-label="Lane number"></div>
     <label class="td-pick"><span>Driver</span><input id="trackday-driver" maxlength="200" autocomplete="off" placeholder="optional"></label>
     <span class="td-grow"></span><span class="td-setup" id="trackday-setup"></span>
     <p class="hint td-lane-info" id="trackday-lane-info"></p></section>
    <div class="td-board" id="trackday-board" aria-live="polite"></div>
    <div class="td-keep" id="trackday-keep" hidden></div></section>`);
    q('#trackday-car').value=ctx.car;q('#trackday-track').value=ctx.track;q('#trackday-lane').value=ctx.lane;q('#trackday-driver').value=ctx.driver;
    for(const id of ['car','track','lane','driver'])q('#trackday-'+id).addEventListener('input',()=>{ctx={...ctx,car:q('#trackday-car').value,track:q('#trackday-track').value,lane:Number(q('#trackday-lane').value),driver:q('#trackday-driver').value};save();render();});
    q('#trackday-lanes').onclick=e=>{const b=e.target.closest('[data-lane]');if(!b)return;ctx.lane=Number(b.dataset.lane);q('#trackday-lane').value=ctx.lane;save();render();};
    q('#trackday-sheet').onclick=()=>{try{SetupSheet.download(state.setup,{units:Units.prefs});toast('Setup sheet downloaded.');}catch(e){toast('Could not create setup sheet: '+e.message);}};
    q('#trackday-wall').onclick=e=>{const last=valid()?M().previous(RaceUI.runs(),context()):null;if(last){e.preventDefault();RaceUI.openRun(last.id);}};
    // The board is rebuilt often; its controls are handled here once.
    const board=q('#trackday-board');
    board.addEventListener('click',e=>{
      const step=e.target.closest('[data-step]');if(step){stepField(step.dataset.step,Number(step.dataset.dir));return;}
      const open=e.target.closest('[data-trackday-open]');if(open){RaceUI.openRun(open.dataset.trackdayOpen);return;}
      if(e.target.closest('#trackday-save'))saveRun();
      if(e.target.closest('#trackday-paste-toggle')){const box=q('#trackday-paste');box.hidden=!box.hidden;if(!box.hidden)q('#trackday-laps').focus();}
    });
    board.addEventListener('input',e=>{
      const box=e.target.closest('[data-lap]');
      if(box){const i=Number(box.dataset.lap),parts=box.value.split(/[\s;]+/).filter(Boolean);
        if(parts.length>1){laps.splice(i,parts.length,...parts);render();focusLap(i+parts.length);return;}
        laps[i]=box.value;while(laps.length&&!String(laps.at(-1)).trim())laps.pop();q('#trackday-laps').value=laps.join('\n');live();return;}
      if(e.target.id==='trackday-laps'){laps=e.target.value.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);render();return;}
      if(e.target.id==='trackday-change'){extra=e.target.value;live();}
    });
    board.addEventListener('change',e=>{if(e.target.id==='trackday-sequence'){ctx.sequence=e.target.checked;save();live();}});
    board.addEventListener('keydown',e=>{const box=e.target.closest('[data-lap]');if(!box)return;const i=Number(box.dataset.lap);
      if(e.key==='Enter'){e.preventDefault();if(!q(`[data-lap="${i+1}"]`))render();focusLap(i+1);}
      else if(e.key==='Backspace'&&!box.value&&i>0){e.preventDefault();focusLap(i-1);}});
    q('#trackday-keep').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.keep==='no'){dismissed=b.dataset.run;render();}else keepChange(b.dataset.run);});
  }
  const context=()=>({car:ctx.car.trim(),track:ctx.track.trim(),lane:ctx.lane,driver:ctx.driver.trim()});
  const valid=()=>M().validContext(context());
  const garageTrack=()=>typeof GarageUI==='undefined'?null:GarageUI.tracks().find(t=>t.name.trim().toLowerCase()===ctx.track.trim().toLowerCase())||null;
  const laneLength=()=>garageTrack()?.lanes.find(l=>l.lane===ctx.lane)?.lengthM??null;
  function suggest(){
    if(!q('#trackday-car-list')||typeof GarageUI==='undefined')return;
    const opt=v=>`<option value="${esc(v)}"></option>`;
    q('#trackday-car-list').innerHTML=GarageUI.cars().filter(c=>!c.archived).map(c=>opt(c.name)).join('');q('#trackday-track-list').innerHTML=GarageUI.tracks().map(t=>opt(t.name)).join('');
    const car=GarageUI.byRef(state.setup.carRef||'');if(!ctx.car.trim()&&car){ctx.car=car.name;q('#trackday-car').value=car.name;save();}
    render();
  }
  function useCar(name){ctx.car=name;q('#trackday-car').value=name;save();render();}
  function focusLap(i){const box=q(`[data-lap="${i}"]`);if(box){box.focus();box.select?.();}}
  // Typed laps, or null with a message when they cannot be read yet.
  function typed(){const text=laps.map(s=>String(s).trim()).filter(Boolean).join('\n');if(!text)return {laps:null,error:''};try{return {laps:ManualLapsModel.parse(text),error:''};}catch(e){return {laps:null,error:e.message};}}
  // A stepper writes to the workbench setup, exactly as typing in its field would.
  function stepField(field,dir){
    const rule=STEPS.find(s=>s[0]===field);if(!rule)return;
    if(field==='rearDiameter'&&state.setup.tyreMode==='rim')return;
    const shown=Number(displayInput(field,state.setup[field]))||0,next=Math.max(rule[0]==='pinion'||rule[0]==='gear'?1:0,Number((shown+dir*rule[2]).toFixed(rule[3])));
    state.setup[field]=storeInput(field,String(next));fillInputs();schedulePersist();updateLibraryStatus();render();
  }
  function keepChange(id){
    const run=RaceUI.runs().find(r=>r.id===id),changes=M().keepable(run,state.setup);if(!changes.length)return;
    const map={pinion:'pinion',gear:'gear',weight:'totalWeight',rearDiameter:'rearDiameter',ratedRpm:'ratedRpm'};
    for(const c of changes){state.setup[map[c.field]]=String(c.to);if(c.field==='rearDiameter')state.setup.tyreMode='diameter';}
    fillInputs();persist();updateLibraryStatus();toast(`Kept on the workbench: ${changes.map(c=>`${c.label} ${c.to}${c.unit}`).join(', ')}. Save the setup to keep it in the library.`);render();
  }
  function bars(run){
    const st=RaceModel.statistics(run),inc=run.laps.filter(l=>l.valid&&!l.pit).map(l=>l.durationMs);if(!inc.length)return '';
    const lo=Math.min(...inc),cap=(st.median??lo)*1.03;
    return `<div class="td-bars" aria-hidden="true">${run.laps.slice(0,40).map(l=>{const ok=l.valid&&!l.pit,slow=!ok||l.durationMs>cap,h=slow?100:Math.round(18+82*(l.durationMs-lo)/((cap-lo)||1));return `<i class="${!ok?'out':l.durationMs===st.best?'best':slow?'slow':''}" data-h="${h}"></i>`;}).join('')}</div>`;
  }
  function verdictChip(run,before){
    if(!before)return '<div class="td-verdict base">The baseline</div>';
    const m=M().compare(run,before).find(r=>r.key==='median');
    if(m.verdict==='unavailable')return '<div class="td-verdict base">No typical lap to compare</div>';
    if(m.verdict==='same')return `<div class="td-verdict base">About the same as ${esc(before.sessionName.split(' · ')[0])}</div>`;
    return `<div class="td-verdict ${m.verdict==='better'?'good':'bad'}">${m.verdict==='better'?'▲':'▼'} ${time(Math.abs(m.delta))} s ${m.verdict==='better'?'quicker':'slower'} than ${esc(before.sessionName.split(' · ')[0].toLowerCase())}</div>`;
  }
  function runColumn(run,before,best,label){
    const st=RaceModel.statistics(run),change=M().changeOf(run),tone=before?M().compare(run,before).find(r=>r.key==='median').verdict:'';
    return `<section class="panel td-run${run===best?' quickest':''}" data-run="${esc(run.id)}">${run===best?'<span class="td-crown">Quickest</span>':''}
     <div class="td-run-head"><b>${esc(label||run.sessionName.split(' · ')[0])}</b><small>${esc(label?new Date(run.startedAt).toLocaleDateString():clock(run.startedAt))} · ${st.count} lap${st.count===1?'':'s'}</small></div>
     <span class="${change&&change!=='No change'?'td-chg':'td-chg none'}">${esc(change||'no change noted')}</span>
     <div><span class="td-label">Typical lap</span><strong class="td-big${tone==='better'?' good':tone==='worse'?' bad':''}">${time(st.median)}</strong></div>
     <div class="td-pair"><span>Best<b>${time(st.best)}</b></span><span>Spread<b>${time(st.spread)}</b></span></div>
     ${bars(run)}${verdictChip(run,before)}<button type="button" class="btn small ghost" data-trackday-open="${esc(run.id)}">Analyze</button></section>`;
  }
  function nextColumn(number,prior){
    const s=state.setup,auto=M().autoChange(prior,s),rim=s.tyreMode==='rim';
    const steppers=STEPS.filter(([f])=>!(f==='rearDiameter'&&rim)).map(([field,label])=>{const token=UnitSystem.INPUTS[field],unit=token?Units.label(token):'',v=s[field];const changed=auto.some(a=>a.startsWith({pinion:'pinion',gear:'gear',totalWeight:'weight',rearDiameter:'rear tyre'}[field]+' '));
      return `<div class="td-step${changed?' changed':''}"><span>${label}</span><span class="td-ctl"><button type="button" data-step="${field}" data-dir="-1" aria-label="${label} down">−</button><output>${v===''||v==null?'—':esc(displayInput(field,v))+(unit&&field!=='pinion'&&field!=='gear'?' '+esc(unit):'')}</output><button type="button" data-step="${field}" data-dir="1" aria-label="${label} up">+</button></span></div>`;}).join('');
    const count=Math.max(10,laps.length+1);
    return `<section class="panel td-run td-next" aria-label="Next run"><div class="td-run-head"><b>Run ${number}</b><small>next${laps.length?` · ${laps.filter(x=>String(x).trim()).length} laps`:''}</small></div>
     <span class="td-label">What you change · on the workbench</span><div class="td-steps">${steppers}</div>
     <p class="td-auto" id="trackday-auto">${prior?auto.length?'Change: '+auto.map(a=>`<span class="td-chg">${esc(a)}</span>`).join(' '):'No change from the last run yet.':'This run becomes your baseline.'}</p>
     <label class="td-note">Anything else? <input id="trackday-change" maxlength="120" autocomplete="off" value="${esc(extra)}"></label>
     <span class="td-label">Laps · Enter for the next box, or paste</span>
     <div class="td-laps">${Array.from({length:count},(_,i)=>`<input data-lap="${i}" inputmode="decimal" autocomplete="off" aria-label="Lap ${i+1}" value="${esc(laps[i]||'')}">`).join('')}</div>
     <button type="button" class="text-button" id="trackday-paste-toggle">Paste a list instead</button>
     <div id="trackday-paste" hidden><textarea id="trackday-laps" rows="5" spellcheck="false" aria-label="Lap times, one per line">${esc(laps.join('\n'))}</textarea></div>
     <label class="trackday-check"><input type="checkbox" id="trackday-sequence"${ctx.sequence?' checked':''}> In the order driven, no laps missing</label>
     <p id="trackday-preview" class="td-live" aria-live="polite"></p><p id="trackday-error" class="note" role="alert" hidden></p>
     <button type="button" class="btn primary" id="trackday-save">Save run ${number}</button></section>`;
  }
  // The live line under the lap boxes: laps so far and the verdict against the last run.
  function live(){
    if(!q('#trackday-preview'))return;
    const entry=typed(),c=context(),prior=valid()?M().previous(RaceUI.runs(),c):null;
    q('#trackday-error').textContent=entry.error;q('#trackday-error').hidden=!entry.error;
    q('#trackday-save').disabled=busy||!valid()||!entry.laps;
    const live=q('#trackday-preview');live.className='td-live';
    if(!entry.laps){live.textContent=valid()?'Type or paste this run’s lap times.':'Choose the car, track and lane above.';return;}
    const cur=M().preview(entry.laps,ctx.sequence),st=RaceModel.statistics(cur);
    let text=`So far: ${entry.laps.length} lap${entry.laps.length===1?'':'s'} · typical ${time(st.median)} · best ${time(st.best)}`;
    if(prior){const m=M().compare(cur,prior).find(r=>r.key==='median');if(m.verdict==='better'||m.verdict==='worse'){text+=` · ${m.verdict==='better'?'▲':'▼'} ${time(Math.abs(m.delta))} s vs ${prior.sessionName.split(' · ')[0].toLowerCase()}`;live.classList.add(m.verdict==='better'?'good':'bad');}else if(m.verdict==='same')text+=' · about the same as the last run';}
    live.textContent=text;
  }
  function render(){
    if(!q('#trackday-board'))return;
    const s=state.setup,m=TelemetryModel.calculate(calculationInput());
    q('#trackday-setup').innerHTML=`Setup: <b>${esc(s.name||'Untitled setup')}</b> · ${s.pinion&&s.gear?`${esc(s.pinion)} : ${esc(s.gear)}`:'—'} · ${unitText(m.massG,'g',1)}`;
    q('#trackday-eyebrow').textContent='AT THE TRACK · '+new Date().toLocaleDateString(undefined,{weekday:'long',day:'numeric',month:'short'}).toUpperCase();
    // Lanes: the garage track's lanes as buttons with their length; otherwise a number box.
    const track=garageTrack(),length=laneLength();
    q('#trackday-lanes').innerHTML=track?track.lanes.map(l=>`<button type="button" data-lane="${l.lane}" aria-pressed="${l.lane===ctx.lane}">${l.lane}${l.lengthM!==null?` · ${unitText(l.lengthM,'m',1)}`:''}</button>`).join(''):'';
    q('#trackday-lane').hidden=!!track&&track.lanes.some(l=>l.lane===ctx.lane);
    q('#trackday-lane-info').textContent=track?(track.lanes.some(l=>l.lane===ctx.lane)?`${track.name}, lane ${ctx.lane}: ${length===null?'length not set in the garage':unitText(length,'m',2)+' per lap'}.`:`${track.name} has lanes ${track.lanes.map(l=>l.lane).join(', ')} in the garage.`):'Runs with the same car, track and lane are compared. Pick them from your garage, or type a name.';
    const board=q('#trackday-board'),active=document.activeElement?.dataset?.lap;
    if(!valid()){board.innerHTML=`<p class="hint td-empty">Choose the car, track and lane above to start the session.</p>`+nextColumn(1,null);live();return;}
    const c=context(),runs=RaceUI.runs(),list=M().today(runs,c).slice().reverse(),prior=M().previous(runs,c);
    const before=list.length?null:prior,best=M().quickest(list);
    const cols=[];if(before)cols.push(runColumn(before,null,null,'Last time'));
    list.forEach((r,i)=>cols.push(runColumn(r,i?list[i-1]:before,best)));
    board.innerHTML=cols.join('')+nextColumn(list.length+1,prior);
    for(const i of board.querySelectorAll('[data-h]'))i.style.height=i.dataset.h+'%';
    if(active!==undefined)focusLap(Number(active));
    live();
    // Keep this change: the quickest run today has setup values the workbench no longer has.
    const keep=q('#trackday-keep'),changes=best?M().keepable(best,s):[];
    keep.hidden=!changes.length||dismissed===best?.id;
    if(!keep.hidden){const st=RaceModel.statistics(best),first=list[0],gain=first&&first!==best?RaceModel.statistics(first).median-st.median:null;
      keep.innerHTML=`<span class="td-keep-tick">✓</span><div><b>${esc(best.sessionName.split(' · ')[0])} is your quickest today</b><small>Typical ${time(st.median)} s${gain>0?`, ${time(gain)} s quicker than ${esc(first.sessionName.split(' · ')[0].toLowerCase())}`:''}. The workbench has ${changes.map(c=>`${c.label} ${esc(c.from)}`).join(', ')}; that run had ${changes.map(c=>`${c.label} ${esc(c.to)}${c.unit}`).join(', ')}.</small></div><span class="td-grow"></span><button type="button" class="btn" data-keep="no" data-run="${esc(best.id)}">Not now</button><button type="button" class="btn primary" data-keep="yes" data-run="${esc(best.id)}">Keep this change</button>`;}
  }
  async function saveRun(){
    const c=context(),entry=typed();if(busy||!M().validContext(c)||!entry.laps)return;
    if(!window.manualLaps){q('#trackday-error').textContent='Saving runs requires the desktop app.';q('#trackday-error').hidden=false;return;}
    busy=true;q('#trackday-save').disabled=true;
    try{
      const runs=RaceUI.runs(),runNumber=M().today(runs,c).length+1,prior=M().previous(runs,c);
      const note=[...M().autoChange(prior,state.setup),extra.trim()].filter(Boolean).join(', ');
      const values=M().session({ctx:c,setup:state.setup,note,laps:entry.laps,sequenceConfirmed:ctx.sequence,runNumber,laneLengthM:laneLength()});
      const response=await window.manualLaps.save({values});if(!response?.ok)throw Error(response?.error||'The run could not be saved.');
      laps=[];extra='';busy=false;ManualLapsUI.apply(response.value);toast(`Run ${runNumber} saved. It is also on the Laps wall.`);
    }catch(e){busy=false;q('#trackday-error').textContent=e.message;q('#trackday-error').hidden=false;q('#trackday-save').disabled=false;return;}
    render();focusLap(0);
  }
  // From Driver Feedback: the suggestion to test becomes the note of the next run.
  function note(text){extra=String(text||'').slice(0,120);render();}
  return {init,render,suggest,useCar,note};
})();
