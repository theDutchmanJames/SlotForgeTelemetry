// Track day page: current setup, log a run, compare with the last run, today's runs.
const TrackdayUI=(()=>{
  const KEY='slotforge.telemetry.trackday.v1',q=s=>document.querySelector(s);
  let ctx={car:'',track:'',lane:1,driver:'',sequence:false},busy=false;
  const time=ms=>Number.isFinite(ms)?(ms/1000).toFixed(3)+' s':'—';
  const signed=ms=>Number.isFinite(ms)?(ms>0?'+':ms<0?'−':'±')+(Math.abs(ms)/1000).toFixed(3)+' s':'—';
  const clock=iso=>new Date(iso).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});
  function save(){try{localStorage.setItem(KEY,JSON.stringify(ctx));}catch{/* Works for this session. */}}
  function init(){
    try{const v=JSON.parse(localStorage.getItem(KEY)||'null');if(v)ctx={car:String(v.car||''),track:String(v.track||''),lane:Number.isInteger(v.lane)&&v.lane>=1&&v.lane<=64?v.lane:1,driver:String(v.driver||''),sequence:v.sequence===true};}catch{/* Defaults. */}
    q('[data-route=telemetry]').insertAdjacentHTML('afterend','<a href="#trackday" data-route="trackday">Track day</a>');
    q('[data-page=telemetry]').insertAdjacentHTML('afterend',`<section data-page="trackday" hidden><div class="page-head"><div><p class="eyebrow">AT THE TRACK</p><h1>Track day</h1><p>Change one thing, drive, enter your laps, see what it did.</p></div></div>
    <section class="panel trackday-context" aria-label="Session"><div class="trackday-context-grid">
     <label class="field">Car<input id="trackday-car" maxlength="200" autocomplete="off" list="trackday-car-list"></label><label class="field">Track<input id="trackday-track" maxlength="200" autocomplete="off" list="trackday-track-list"></label><datalist id="trackday-car-list"></datalist><datalist id="trackday-track-list"></datalist>
     <label class="field">Lane<input id="trackday-lane" type="number" min="1" max="64" step="1" inputmode="numeric"></label><label class="field">Driver · optional<input id="trackday-driver" maxlength="200" autocomplete="off"></label></div>
     <p class="hint">Runs with the same car, track and lane are compared. Names from your garage are suggested. These stay filled in on this device. <span id="trackday-lane-info"></span></p></section>
    <div class="trackday-layout">
     <aside class="panel trackday-setup" data-category="gearing"><div class="section-heading"><h2>Current setup</h2><span class="badge">WORKBENCH</span></div><div id="trackday-setup"></div>
      <div class="actions"><a class="btn" href="#telemetry">Edit in Telemetry</a><button type="button" class="btn" id="trackday-sheet">Setup sheet</button></div></aside>
     <section class="panel trackday-log" data-category="speed"><h2>Log a run</h2>
      <label class="field">What did you change?<input id="trackday-change" maxlength="150" autocomplete="off"><small class="hint">For example “pinion 9 → 10”. Leave empty if nothing changed.</small></label>
      <label class="field">Lap times<textarea id="trackday-laps" rows="8" spellcheck="false"></textarea><small class="hint">One lap per line, in seconds (10.235) or minutes:seconds (1:02.345).</small></label>
      <label class="trackday-check"><input type="checkbox" id="trackday-sequence"> Typed in the order driven, with no laps missing</label>
      <p id="trackday-preview" class="hint" aria-live="polite"></p><p id="trackday-error" class="note" role="alert" hidden></p>
      <button type="button" class="btn primary" id="trackday-save">Save run</button></section>
     <section class="panel trackday-compare" data-category="tyres"><h2>Compare with last run</h2><div id="trackday-compare" aria-live="polite"></div></section>
    </div>
    <section class="panel trackday-today"><h2>Today’s runs</h2><div id="trackday-today"></div></section></section>`);
    q('#trackday-car').value=ctx.car;q('#trackday-track').value=ctx.track;q('#trackday-lane').value=ctx.lane;q('#trackday-driver').value=ctx.driver;q('#trackday-sequence').checked=ctx.sequence;
    for(const id of ['car','track','lane','driver','sequence'])q('#trackday-'+id).addEventListener(id==='sequence'?'change':'input',()=>{ctx={car:q('#trackday-car').value,track:q('#trackday-track').value,lane:Number(q('#trackday-lane').value),driver:q('#trackday-driver').value,sequence:q('#trackday-sequence').checked};save();render();});
    for(const id of ['change','laps'])q('#trackday-'+id).addEventListener('input',render);
    q('#trackday-save').onclick=saveRun;
    q('#trackday-sheet').onclick=()=>{try{SetupSheet.download(state.setup,{units:Units.prefs});toast('Setup sheet downloaded.');}catch(e){toast('Could not create setup sheet: '+e.message);}};
  }
  const context=()=>({car:ctx.car.trim(),track:ctx.track.trim(),lane:ctx.lane,driver:ctx.driver.trim()});
  // Garage: suggest car and track names; a known track supplies the lane length.
  const garageTrack=()=>typeof GarageUI==='undefined'?null:GarageUI.tracks().find(t=>t.name.trim().toLowerCase()===ctx.track.trim().toLowerCase())||null;
  const laneLength=()=>garageTrack()?.lanes.find(l=>l.lane===ctx.lane)?.lengthM??null;
  function suggest(){
    if(!q('#trackday-car-list')||typeof GarageUI==='undefined')return;
    const opt=v=>`<option value="${esc(v)}"></option>`;
    q('#trackday-car-list').innerHTML=GarageUI.cars().filter(c=>!c.archived).map(c=>opt(c.name)).join('');q('#trackday-track-list').innerHTML=GarageUI.tracks().map(t=>opt(t.name)).join('');
    // Start from the workbench setup's car when the session has none yet.
    const car=GarageUI.byRef(state.setup.carRef||'');if(!ctx.car.trim()&&car){ctx.car=car.name;q('#trackday-car').value=car.name;save();}
    render();
  }
  function useCar(name){ctx.car=name;q('#trackday-car').value=name;save();render();}
  // Typed laps, or null with a message when they cannot be read yet.
  function typed(){const text=q('#trackday-laps').value;if(!text.trim())return {laps:null,error:''};try{return {laps:ManualLapsModel.parse(text),error:''};}catch(e){return {laps:null,error:e.message};}}
  function setupCard(){
    const s=state.setup,input=calculationInput(),m=TelemetryModel.calculate(input),mo=m.motor;
    const item=(label,value)=>`<div><dt>${label}</dt><dd>${value}</dd></div>`;
    q('#trackday-setup').innerHTML=`<p class="trackday-setup-name">${esc(s.name||'Untitled setup')}</p><dl class="trackday-figures">${[
     item('Gearing',s.pinion&&s.gear?`${esc(s.pinion)} : ${esc(s.gear)} <small>${unitText(mo.ratio,':1',3)}</small>`:'—'),
     item('Rear tyre',unitText(mo.rearDiameter,'mm')),item('Weight',unitText(m.massG,'g',1)),item('Motor',Number.isFinite(mo.ratedRpm)?performanceNumber(mo.ratedRpm,0)+' RPM':'—'),
     item('No-load speed',unitText(mo.speedKmh,'km/h')),item('Rollout',unitText(mo.rollout,'mm/motor rev'))].join('')}</dl>`;
  }
  function compareBlock(current,prior,labels){
    const rows=TrackdayModel.compare(current,prior),tone={better:'good',worse:'bad'};
    // Only the fields Track day records; imported runs carry many more that would only add noise.
    const names={pinion:['Pinion',''],gear:['Driven gear',''],rearDiameter:['Rear tyre','mm'],weight:['Weight','g'],ratedRpm:['Motor RPM','']};
    const show=(v,unit)=>v===null||v===undefined||v===''?'—':unit&&Number.isFinite(Number(v))?unitText(Number(v),unit):esc(v);
    const differences=RaceModel.configurationChanges(prior,current).technical.filter(d=>names[d.field]).map(d=>({field:names[d.field][0],before:show(d.before,names[d.field][1]),after:show(d.after,names[d.field][1])}));
    return `<p class="trackday-verdict">${esc(TrackdayModel.verdict(rows))}</p><div class="table-wrap"><table><thead><tr><th></th><th>${esc(labels[0])}</th><th>${esc(labels[1])}</th><th>Change</th></tr></thead><tbody>${rows.map(r=>`<tr><th>${r.label}</th><td>${r.key==='count'?r.before:time(r.before)}</td><td>${r.key==='count'?r.after:time(r.after)}</td><td class="${tone[r.verdict]||'neutral'}">${r.key==='count'?(r.delta>0?'+':'')+r.delta:r.verdict==='same'?'about the same':signed(r.delta)}</td></tr>`).join('')}</tbody></table></div>
     ${differences.length?`<p class="hint"><strong>Setup differences:</strong> ${differences.map(d=>`${d.field} ${d.before} → ${d.after}`).join(' · ')}</p>`:''}
     <p class="hint">Lower is better for every time. A change smaller than 0.5% reads as about the same. Track, temperature and driver also affect lap times.</p>`;
  }
  function render(){
    if(!q('#trackday-setup'))return;
    setupCard();
    const track=garageTrack(),length=laneLength();
    q('#trackday-lane-info').textContent=track?(track.lanes.some(l=>l.lane===ctx.lane)?`${track.name}, lane ${ctx.lane}: ${length===null?'length not set in the garage':unitText(length,'m',2)+' per lap'}.`:`${track.name} has lanes ${track.lanes.map(l=>l.lane).join(', ')} in the garage.`):'';
    const c=context(),valid=TrackdayModel.validContext(c),runs=RaceUI.runs(),entry=typed();
    // Live preview of typed laps.
    const current=entry.laps?TrackdayModel.preview(entry.laps,q('#trackday-sequence').checked):null,stats=current?RaceModel.statistics(current):null;
    q('#trackday-preview').textContent=stats?`${entry.laps.length} lap(s) · best ${time(stats.best)} · typical ${time(stats.median)}${stats.spread!==null?' · spread '+time(stats.spread):''}`:'Paste or type this run’s lap times.';
    q('#trackday-error').textContent=entry.error;q('#trackday-error').hidden=!entry.error;
    q('#trackday-save').disabled=busy||!valid||!entry.laps;
    const box=q('#trackday-compare');
    if(!valid)box.innerHTML='<p class="hint">Enter the car, track and lane above to compare runs.</p>';
    else{
      const last=TrackdayModel.previous(runs,c);
      if(current){
        if(!last)box.innerHTML='<p class="hint">No earlier run for this car, track and lane yet. This run becomes your baseline.</p>';
        else{const cur={...current,configuration:{technical:TrackdayModel.session({ctx:c,setup:state.setup,laps:entry.laps,sequenceConfirmed:false}).technical}};
          box.innerHTML=`<p class="hint">Last run: <strong>${esc(last.sessionName)}</strong> at ${clock(last.startedAt)}</p>`+compareBlock(cur,last,['Last run','This run']);}
      }else if(last){
        const before=TrackdayModel.previous(runs,c,last.id);
        box.innerHTML=before?`<p class="hint"><strong>${esc(last.sessionName)}</strong> compared with <strong>${esc(before.sessionName)}</strong>. Type new laps to compare your next run.</p>`+compareBlock(last,before,['Before','Latest']):'<p class="hint">One run saved for this car, track and lane. Your next run will be compared with it.</p>';
      }else box.innerHTML='<p class="hint">No runs yet for this car, track and lane. Type your first run’s laps to start.</p>';
    }
    const list=valid?TrackdayModel.today(runs,c):[];
    q('#trackday-today').innerHTML=list.length?`<div class="table-wrap"><table><thead><tr><th>Run</th><th>Time</th><th>Changed</th><th>Best</th><th>Typical</th><th>Laps</th><th></th></tr></thead><tbody>${list.map(r=>{const st=RaceModel.statistics(r);return `<tr><th>${esc(r.sessionName)}</th><td>${clock(r.startedAt)}</td><td>${esc(TrackdayModel.changeOf(r)||'—')}</td><td>${time(st.best)}</td><td>${time(st.median)}</td><td>${st.count}</td><td><button type="button" class="btn small" data-trackday-open="${esc(r.id)}">Analyze</button></td></tr>`;}).join('')}</tbody></table></div>`:'<p class="hint">Runs you save today for this car, track and lane appear here.</p>';
    for(const b of document.querySelectorAll('[data-trackday-open]'))b.onclick=()=>RaceUI.openRun(b.dataset.trackdayOpen);
  }
  async function saveRun(){
    const c=context(),entry=typed();if(busy||!TrackdayModel.validContext(c)||!entry.laps)return;
    if(!window.manualLaps){q('#trackday-error').textContent='Saving runs requires the desktop app.';q('#trackday-error').hidden=false;return;}
    busy=true;render();
    try{
      const runNumber=TrackdayModel.today(RaceUI.runs(),c).length+1;
      const values=TrackdayModel.session({ctx:c,setup:state.setup,note:q('#trackday-change').value,laps:entry.laps,sequenceConfirmed:q('#trackday-sequence').checked,runNumber,laneLengthM:laneLength()});
      const response=await window.manualLaps.save({values});if(!response?.ok)throw Error(response?.error||'The run could not be saved.');
      ManualLapsUI.apply(response.value);q('#trackday-laps').value='';q('#trackday-change').value='';toast(`Run ${runNumber} saved. It is also in Lap analysis.`);
    }catch(e){busy=false;q('#trackday-error').textContent=e.message;q('#trackday-error').hidden=false;q('#trackday-save').disabled=false;return;}
    busy=false;render();
  }
  return {init,render,suggest,useCar};
})();
