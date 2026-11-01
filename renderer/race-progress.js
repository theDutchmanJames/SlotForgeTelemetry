// Local, derived history. Imported evidence is never edited by this view.
const RaceProgress=(()=>{
 const el=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const time=n=>n===null||n===undefined?'—':(n/1000).toFixed(3)+' s';
 const date=s=>new Date(s).toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'});
 const metrics={median:'Typical pace · median',best:'Best eligible lap',spread:'Consistency · middle 50% spread'};
 const label=r=>`${date(r.startedAt)} · ${r.sessionName} · ${r.driver}`;
 let groups=[],entries=[],groupId='',selected='',reference='',metric='median',minimum=5,limit=50,openRun,compare;
 const cached=new WeakMap();
 function init(container,callbacks){
  openRun=callbacks.open;compare=callbacks.compare;
  container.insertAdjacentHTML('beforeend',`<section id="race-progress" hidden><h2>Progress over time</h2><p class="hint">Follow one car on the same track and lane. Each point is a separate driver’s run; lap times are never pooled across drivers.</p><div class="panel race-progress-filters"><label class="field">Car / track / lane / session type<select id="progress-group"></select></label><label class="field">Minimum included laps<select id="progress-minimum"><option value="1">1 lap · include short runs</option><option value="5" selected>5 laps</option><option value="10">10 laps</option></select></label><label class="field">Show on chart<select id="progress-metric"><option value="median">Median pace</option><option value="best">Best eligible lap</option><option value="spread">Consistency spread</option></select></label></div><p class="hint" id="progress-scope"></p><p class="note" id="progress-empty" hidden></p><div id="progress-content"><section class="panel race-progress-chartpanel"><h3 id="progress-chart-title"></h3><div class="race-legend progress-legend"><span class="progress-point">● Run</span><span class="progress-selected">● Selected</span><span class="progress-reference">● Reference</span></div><svg id="progress-chart" role="img" aria-label="Recorded run history"></svg><p class="hint" id="progress-chart-note"></p></section><div class="panel compare-selectors race-panel-gap"><label class="field">Inspect a run<select id="progress-selected"></select></label><label class="field">Reference run<select id="progress-reference"></select></label></div><section class="panel race-panel-gap" id="progress-observation" role="status"></section><div class="actions"><button class="btn" id="progress-open">Analyze selected run</button><button class="btn" id="progress-compare">Compare these runs</button><button class="btn" id="progress-report">Export comparison report</button></div><section class="panel race-panel-gap" id="progress-setup"></section><section class="panel race-panel-gap"><h3>Run history</h3><p class="hint">Newest first. Choose a run here or in the selector to inspect it.</p><div class="table-wrap" id="progress-table"></div><button class="btn small" id="progress-more" hidden>Show 50 more runs</button></section></div></section>`);
  el('progress-group').onchange=e=>{groupId=e.target.value;selected='';reference='';limit=50;refresh();};
  el('progress-minimum').onchange=e=>{minimum=Number(e.target.value);limit=50;refresh();};
  el('progress-metric').onchange=e=>{metric=e.target.value;inspect(false);};
  el('progress-selected').onchange=e=>{selected=e.target.value;reference='';inspect();};
  el('progress-reference').onchange=e=>{reference=e.target.value;inspect(false);};
  el('progress-open').onclick=()=>{if(entries.some(e=>e.run.id===selected))openRun(selected);};
  el('progress-compare').onclick=()=>{if(reference&&reference!==selected)compare(reference,selected);};
  el('progress-report').onclick=()=>{const a=entries.find(e=>e.run.id===reference),b=entries.find(e=>e.run.id===selected);if(a&&b)try{RaceInsights.downloadReport(a.run,b.run);}catch(e){toast('Could not export report: '+e.message);}};
  el('progress-more').onclick=()=>{limit+=50;table();};
  new ResizeObserver(draw).observe(el('progress-chart'));
 }
 function update(runs){groups=RaceModel.progressGroups(runs);if(!groups.some(g=>g.id===groupId)){groupId=groups[0]?.id||'';selected='';reference='';limit=50;}
  el('progress-group').innerHTML=groups.map(g=>{const r=g.run;return `<option value="${esc(g.id)}">${esc(`${r.car} · ${r.track} · Lane ${r.lane} · ${r.type} · ${r.hostName} / ${r.sourceName} · ${r.laneLengthM==null?'length unknown':r.laneLengthM+' m'}`)}</option>`;}).join('');el('progress-group').value=groupId;refresh();
 }
 function refresh(){
  const group=groups.find(g=>g.id===groupId);
  const all=group?.runs||[];
  entries=RaceModel.progressEntries(all,minimum,run=>{if(!cached.has(run))cached.set(run,RaceModel.statistics(run));return cached.get(run);});
  el('progress-scope').textContent=group?`${entries.length} of ${all.length} runs meet the ${minimum}-lap minimum. Grouped by collection, data source, car, track, lane, session type and recorded lane length. Driver names and IDs do not establish the same person across sessions.`:'No matching runs.';
  el('progress-content').hidden=!entries.length;el('progress-empty').hidden=!!entries.length;
  el('progress-empty').textContent=group?'No runs meet this lap minimum. Lower it or choose another group.':'Import results or adjust the collection/search filters to start a history.';
  if(!entries.some(e=>e.run.id===selected)){selected=entries.at(-1)?.run.id||'';reference='';}
  table();inspect();
 }
 function inspect(autoReference=true){
  const current=entries.find(e=>e.run.id===selected);if(!current){el('progress-chart').replaceChildren();el('progress-observation').textContent='';el('progress-setup').replaceChildren();return;}
  if(!entries.some(e=>e.run.id===reference)||reference===selected)reference='';
  if(!reference&&autoReference)reference=entries.filter(e=>e.run.startedAt<current.run.startedAt).at(-1)?.run.id||'';
  const options=list=>list.map(e=>`<option value="${esc(e.run.id)}">${esc(label(e.run))}</option>`).join('');
  el('progress-selected').innerHTML=options(entries);el('progress-selected').value=selected;
  el('progress-reference').innerHTML='<option value="">Choose a reference run</option>'+options(entries.filter(e=>e.run.id!==selected));el('progress-reference').value=reference;
  const prior=entries.find(e=>e.run.id===reference),value=current.statistics[metric],baseline=prior?.statistics[metric];
  el('progress-compare').disabled=!prior;el('progress-report').disabled=!prior;
  let observation=`Selected: ${metrics[metric]} ${time(value)} from ${current.statistics.count} included laps.`;
  if(prior){const difference=value===null||baseline===null?null:value-baseline;observation+=` Reference: ${time(baseline)} from ${prior.statistics.count} included laps. `+(difference===null?'This metric is unavailable for at least one run.':Math.abs(difference)<.5?'Equal at displayed precision.':`Selected value is ${time(Math.abs(difference))} ${difference<0?'lower':'higher'}.`);}
  else observation+=' Choose a reference to compare measured results. At least two runs are needed.';
  observation+=' Driver, conditions and sample size can differ. This does not establish a setup effect.';el('progress-observation').textContent=observation;if(prior){const findings=document.createElement('div');findings.className='race-panel-gap';RaceInsights.render(findings,RaceInsights.comparison(prior.run,current.run));el('progress-observation').append(findings);}
  setup(current.run,prior?.run);draw();
 }
 function setup(current,prior){
  const target=el('progress-setup');target.innerHTML='<h3>Recorded setup changes</h3>';
  if(!prior){target.insertAdjacentHTML('beforeend','<p class="hint">Choose a reference run to see recorded technical and component differences.</p>');return;}
  const changes=RaceModel.configurationChanges(prior,current);
  target.insertAdjacentHTML('beforeend',`<p class="hint">Reference → selected. Manual specifications are user-entered; imported specifications are historical captures. Neither describes the car’s current setup.</p>${changes.technical.length?`<div class="table-wrap"><table><thead><tr><th>Specification</th><th>Reference</th><th>Selected</th></tr></thead><tbody>${changes.technical.map(c=>`<tr><th>${esc(c.field.replace(/([a-z])([A-Z])/g,'$1 $2'))}</th><td>${esc(c.before??'Not recorded')}</td><td>${esc(c.after??'Not recorded')}</td></tr>`).join('')}</tbody></table></div>`:'<p>No recorded technical specification differences.</p>'}`);
  if(changes.componentsChanged){const parts=run=>run.configuration.components.map(c=>`${c.name} × ${c.quantity}${c.position?' · '+c.position:''}${c.field?' · '+c.field:''} · part ${c.partId}${c.assemblyId?' · assembly '+c.assemblyId:''}`).map(c=>'<li>'+esc(c)+'</li>').join('')||'<li>No components captured.</li>';
   target.insertAdjacentHTML('beforeend',`<details><summary>Captured component lists differ</summary><div class="race-progress-parts"><div><h4>Reference</h4><ul>${parts(prior)}</ul></div><div><h4>Selected</h4><ul>${parts(current)}</ul></div></div></details>`);
  }else target.insertAdjacentHTML('beforeend','<p class="hint">No recorded component differences.</p>');
  target.insertAdjacentHTML('beforeend','<p class="hint">A newly recorded value does not prove the part changed. Physical adjustments or conditions may be unrecorded.</p>');
 }
 function table(){
  el('progress-table').innerHTML=`<table><thead><tr><th>Date / session / driver</th><th>Included laps</th><th>Median</th><th>Best eligible</th><th>Middle 50% spread</th><th></th></tr></thead><tbody>${[...entries].reverse().slice(0,limit).map(e=>`<tr><th>${esc(date(e.run.startedAt))}<small>${esc(e.run.sessionName)} · ${esc(e.run.driver)}</small></th><td>${e.statistics.count} / ${e.run.laps.length}</td><td>${time(e.statistics.median)}</td><td>${time(e.statistics.best)}</td><td>${time(e.statistics.spread)}</td><td><button class="btn small" data-progress-inspect="${esc(e.run.id)}">Inspect</button></td></tr>`).join('')}</tbody></table>`;
  el('progress-more').hidden=limit>=entries.length;
  el('progress-table').querySelectorAll('[data-progress-inspect]').forEach(button=>button.onclick=()=>{selected=button.dataset.progressInspect;reference='';inspect();el('progress-selected').focus();el('progress-chart').scrollIntoView({block:'center'});});
 }
 function draw(){
  const svg=el('progress-chart');if(!svg||!svg.clientWidth||!entries.length)return;
  // Show a bounded recent chart; selectors and table retain all eligible history.
  const shown=entries.slice(-200),valid=shown.filter(e=>e.statistics[metric]!==null),w=svg.clientWidth;
  el('progress-chart-title').textContent=metrics[metric];el('progress-chart-note').textContent=`${entries.length>200?'Chart shows the latest 200 runs; selectors and table retain all eligible history. ':''}Each point is one run at its recorded start time. Runs sharing a timestamp may overlap; use the selector to inspect each. No interpolation or driver matching is applied.${!shown.some(e=>e.run.id===selected)?' Selected run is outside the chart window.':''}`;
  svg.setAttribute('viewBox',`0 0 ${w} 260`);if(!valid.length){svg.innerHTML='<text x="12" y="40">No available values for this metric.</text>';return;}
  let low=Math.min(...valid.map(e=>e.statistics[metric])),high=Math.max(...valid.map(e=>e.statistics[metric]));const pad=Math.max(25,(high-low)*.15);low=Math.max(0,low-pad);high+=pad;
  const first=Date.parse(shown[0].run.startedAt),last=Date.parse(shown.at(-1).run.startedAt),L=Math.max(52,(high/1000).toFixed(2).length*7+12),R=w-16,T=25,B=207;
  const x=t=>first===last?(L+R)/2:L+(t-first)/(last-first)*(R-L),y=v=>B-(v-low)/(high-low)*(B-T);
  let html='<title>Run history</title><desc>Separate runs plotted by start date. Use the run selector or history table for exact values.</desc><text x="0" y="13">Time · s</text>';
  for(let i=0;i<4;i++){const v=low+(high-low)*i/3;html+=`<line class="race-grid" x1="${L}" y1="${y(v)}" x2="${R}" y2="${y(v)}"/><text x="${L-7}" y="${y(v)+4}" text-anchor="end">${(v/1000).toFixed(2)}</text>`;}
  const short=t=>new Date(t).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'2-digit'});
  for(const t of [...new Set([first,last])])html+=`<text x="${x(t)}" y="230" text-anchor="${first===last?'middle':t===first?'start':'end'}">${esc(short(t))}</text>`;
  html+=`<text x="${(L+R)/2}" y="255" text-anchor="middle">Recorded start date</text>`;
  // Draw the selection last so it remains visible at equal coordinates.
  for(const e of [...valid.filter(e=>e.run.id!==selected),...valid.filter(e=>e.run.id===selected)])html+=`<circle data-progress-run="${esc(e.run.id)}" class="${e.run.id===selected?'progress-selected':e.run.id===reference?'progress-reference':'progress-point'}" cx="${x(Date.parse(e.run.startedAt))}" cy="${y(e.statistics[metric])}" r="${e.run.id===selected?6:4}"><title>${esc(label(e.run))} · ${time(e.statistics[metric])} · ${e.statistics.count} included laps</title></circle>`;
  svg.innerHTML=html;svg.onclick=event=>{const id=event.target.closest('[data-progress-run]')?.dataset.progressRun;if(id){selected=id;reference='';inspect();}};
 }
 return {init,update,draw};
})();
