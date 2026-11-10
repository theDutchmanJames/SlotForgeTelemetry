// A shared set of optional tools: drafts stay mounted, analysis reads saved values.
const WorkshopUI=(()=>{
  let draftTool='tyres',savedTool='tyres';
  const selectOptions=()=>Object.entries(WorkshopModel.tools).map(([k,t])=>`<option value="${k}">${t.title}</option>`).join('');
  const field=k=>{const f=WorkshopModel.fields[k],attrs=`name="${k}" aria-describedby="workshop-${Object.keys(WorkshopModel.tools).find(t=>WorkshopModel.tools[t].keys.includes(k))}-hint${f.help?` workshop-field-${k}-hint`:''}"`;
    return `<label class="field">${esc(f.label)}${f.type==='select'?`<select ${attrs}>${f.options.map(o=>{const [v,label]=o.split('|');return `<option value="${v}">${esc(label)}</option>`;}).join('')}</select>`:f.type==='textarea'?`<textarea ${attrs} rows="4" maxlength="${f.max}" ${k==='experimentSources'?'data-input-help':'data-input-example'}="${esc(f.example)}" spellcheck="false"></textarea>${k==='experimentSources'?'':'<small>Enter your own measurements using decimal points and the column order above. Examples are not saved or calculated.</small>'}`:`<input ${attrs} type="${f.type}" ${f.type==='number'?`min="${/^(strategyLaps|strategyStops|gearDriver|gearDriven)$/.test(k)?Math.ceil(f.min):(f.inputMin??f.min)}" max="${f.inputMax??f.max}" step="${/^(strategyLaps|strategyStops|gearDriver|gearDriven)$/.test(k)?1:'any'}"`:`maxlength="${f.max}"`} placeholder="Optional">`}${f.help?`<small id="workshop-field-${k}-hint">${esc(f.help)}</small>`:f.type==='text'?'<small>Saved context only. These words do not supply measurements or change the calculations.</small>':''}</label>`;
  };
  function init(){
    topicStyle.workshop=['gearing','motor-tester'];
    for(const [k,t] of Object.entries(WorkshopModel.tools)){
      topicStyle['workshop-'+k]=[t.category,t.icon];
      calculationHelp['workshop-'+k]={title:t.title,formula:esc(t.formula),meaning:t.intro,example:t.example,limits:t.limits,field:t.keys[0]};
    }
    const section=document.createElement('section');section.className='panel workshop-inputs';section.dataset.category='tyres';
    section.innerHTML=`<h2><i class="icon-tile">${sfIcon('motor-tester')}</i>Testing & planning</h2><p class="hint">Eleven tools for preparation, bench measurements and race planning. Inputs save with this setup; graphs and full tables are available in Analyze.</p><label class="field">Choose a tool<select id="workshop-tool">${selectOptions()}</select></label>${Object.entries(WorkshopModel.tools).map(([k,t])=>`<div data-workshop-inputs="${k}" ${k==='tyres'?'':'hidden'}><h3>${sfIcon(t.icon)}${t.title}</h3><p class="hint" id="workshop-${k}-hint">${esc(t.intro)}</p>${t.keys.map(field).join('')}<p class="note workshop-error" role="status" hidden></p><a href="#settings/calculations/workshop-${k}" class="help-link">How this tool works →</a></div>`).join('')}`;
    document.querySelector('.input-column').append(section);
    document.querySelector('[data-workshop-inputs=experiment]').insertAdjacentHTML('beforeend',`<section class="workshop-recorded"><h3>Use recorded laps</h3><p class="hint">Copy a window of up to 100 valid, non-pit laps from your manual or Paddock library. This is a dated snapshot; later source corrections do not update it. No source records are changed.</p><button class="btn small" id="workshop-refresh-runs">Refresh available runs</button><label class="field">Recorded run<select id="workshop-run"><option value="">Refresh to choose a run</option></select></label><div class="form-grid"><label class="field">Setup in this test<select id="workshop-run-side"><option>A</option><option>B</option></select></label><label class="field">First valid, non-pit lap in window<input id="workshop-run-start" type="number" min="1" max="1000000" step="1" value="1"></label></div><button class="btn" id="workshop-add-run">Append lap snapshot</button><p class="hint" id="workshop-run-status" role="status"></p></section>`);
    document.querySelector('#workshop-refresh-runs').onclick=refreshRuns;
    document.querySelector('#workshop-add-run').onclick=appendRun;
    document.querySelector('#stats').insertAdjacentHTML('afterend','<div id="workshop-live" aria-live="polite"></div>');
    document.querySelector('.tabs[aria-label="Analysis topics"]').insertAdjacentHTML('beforeend','<button data-analysis-topic="workshop">Testing & planning</button>');
    document.querySelector('[data-analysis-panel=laps]').insertAdjacentHTML('afterend',`<section data-analysis-panel="workshop" hidden><div class="analysis-input-link"><span>Testing & planning · inputs saved with this setup</span><button class="btn small" id="workshop-edit">${sfIcon('edit')}Edit these inputs</button></div><label class="field">Saved tool<select id="workshop-analysis-tool">${selectOptions()}</select></label><div id="workshop-analysis"></div></section>`);
    document.querySelector('#workshop-tool').onchange=e=>showDraft(e.target.value);
    document.querySelector('#workshop-analysis-tool').onchange=e=>{savedTool=e.target.value;renderSaved();};
    document.querySelector('#workshop-edit').onclick=()=>{openLibraryTask('load',analysisId);libraryTask.focus=WorkshopModel.tools[savedTool].keys[0];};
  }
  function showDraft(tool){
    if(!WorkshopModel.tools[tool])return;draftTool=tool;document.querySelector('#workshop-tool').value=tool;
    document.querySelector('.workshop-inputs').dataset.category=WorkshopModel.tools[tool].category;
    for(const e of document.querySelectorAll('[data-workshop-inputs]'))e.hidden=e.dataset.workshopInputs!==tool;
    if(tool==='experiment')refreshRuns();
    ChassisTestUI.refresh();
    refresh();
  }
  function refreshRuns(){
    const select=document.querySelector('#workshop-run'),selected=select.value,runs=RaceUI.testingRuns();
    select.innerHTML='<option value="">Choose a recorded run</option>'+runs.map(r=>`<option value="${esc(r.id)}">${esc(r.label)}</option>`).join('');if(runs.some(r=>r.id===selected))select.value=selected;
    document.querySelector('#workshop-run-status').textContent=runs.length?`${runs.length} runs available. Record matching conditions before comparing.`:'No runs available. Add manual laps or import Paddock results in Analyze → Lap analysis.';
  }
  function appendRun(){
    const status=document.querySelector('#workshop-run-status');
    try{
      const run=RaceUI.testingRun(document.querySelector('#workshop-run').value),start=Number(document.querySelector('#workshop-run-start').value),side=document.querySelector('#workshop-run-side').value;
      if(!run)throw Error('Choose an available recorded run.');
      if(!Number.isSafeInteger(start)||start<1||start>run.times.length)throw Error('Choose a first lap within the valid, non-pit lap count ('+run.times.length+').');
      const times=run.times.slice(start-1,start+99),name=run.label.replace(/[|\r\n]/g,' ').slice(0,115)+` [${start}–${start+times.length-1}]`;
      const rows=[state.setup.experimentRows.trim(),`${name} | ${side} | ${times.join(', ')}`].filter(Boolean).join('\n');
      const sources=[state.setup.experimentSources,`${new Date().toISOString()} · ${run.id} · ${run.label} · valid laps ${start}–${start+times.length-1}`].filter(Boolean).join('\n');
      let next={...state.setup,experimentRows:rows,experimentSources:sources,experimentConfirmed:'no'};WorkshopModel.clean(next,WorkshopModel.tools.experiment.keys);
      next=ChassisTestUI.captureInto(next,rows.split(/\r?\n/).filter(l=>l.trim()).length-1);
      state.setup=next;for(const k of ['experimentRows','experimentSources','experimentConfirmed'])document.querySelector(`[name="${k}"]`).value=next[k];
      window.refresh();persist();status.textContent=`Appended ${times.length} of ${run.times.length} valid, non-pit laps. Conditions reset to unconfirmed; review the snapshot before comparing.`;
    }catch(e){status.textContent=e.message;}
  }
  function reveal(name){const tool=Object.keys(WorkshopModel.tools).find(k=>WorkshopModel.tools[k].keys.includes(name));if(tool)showDraft(tool);}
  const cell=v=>v===null?'—':typeof v==='number'?performanceNumber(v,4):esc(v);
  function chart(plot){
    if(!plot||plot.points.length<2)return '';
    const xs=plot.points.map(p=>p[0]),ys=plot.points.map(p=>p[1]),lo=Math.min(...xs),hi=Math.max(...xs),bottom=Math.min(...ys),top=Math.max(...ys),range=top-bottom||1;
    if(!(hi>lo))return '';
    const x=v=>55+(v-lo)/(hi-lo)*410,y=v=>170-(v-bottom)/range*130;
    return `<figure class="performance-curve workshop-chart"><figcaption>${esc(plot.y)} by ${esc(plot.x)} · measured points; values in table</figcaption><svg viewBox="0 0 510 230" role="img" aria-label="${esc(plot.y)} by ${esc(plot.x)}. Exact values are in the table below."><path class="curve-grid" d="M55 40H465M55 105H465M55 170H465"/><path class="curve-axis" d="M55 35V170H465"/><polyline class="curve-line torque" points="${plot.points.map(([a,b])=>`${x(a)},${y(b)}`).join(' ')}"/>${plot.points.map(([a,b])=>`<circle cx="${x(a)}" cy="${y(b)}" r="3" fill="currentColor"/>`).join('')}<text x="50" y="174" text-anchor="end">${performanceNumber(bottom,3)}</text><text x="50" y="44" text-anchor="end">${performanceNumber(top,3)}</text><text x="55" y="195">${performanceNumber(lo,2)}</text><text x="465" y="195" text-anchor="end">${performanceNumber(hi,2)}</text><text x="260" y="218" text-anchor="middle">${esc(plot.x)}</text></svg></figure>`;
  }
  function results(input,tool,full=false){
    const t=WorkshopModel.tools[tool],r=WorkshopModel.calculate(input,tool);
    const head=`<section class="panel workshop-result" data-category="${t.category}"><h3>${sfIcon(t.icon)}${t.title}</h3>`;
    if(r.error)return head+`<p class="note" role="status">${esc(r.error)}</p></section>`;
    const notes=t.keys.filter(k=>['text','select'].includes(WorkshopModel.fields[k].type)&&input[k]).map(k=>{const f=WorkshopModel.fields[k],value=f.type==='select'?f.options.find(o=>o.split('|')[0]===input[k])?.split('|')[1]:input[k];return `<p class="hint">${esc(f.label)}: ${esc(value)}</p>`;}).join('');
    return head+notes+(full&&tool==='experiment'&&input.experimentSources?`<p class="hint workshop-provenance">Recorded-lap snapshots: ${esc(input.experimentSources)}</p>`:'')+(r.metrics.length?`<div class="performance-stats">${r.metrics.map(m=>telemetryCard(m.label,m.value,m.unit,m.digits)).join('')}</div>`:'')+(full?chart(r.plot):'')+
      (r.rows.length?`<div class="table-wrap"><table><caption>${t.title} · ${full?'saved measurements':'draft measurements'}</caption><thead><tr>${r.headers.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${r.rows.map(row=>`<tr>${row.map(v=>`<td>${cell(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`:r.metrics.length?'':'<p class="hint">Enter measurements to see results. Blank values are unknown, not zero.</p>')+
      (tool==='experiment'?ChassisTestUI.render(input):'')+r.notes.map(s=>`<p class="note">${esc(s)}</p>`).join('')+`<p class="hint">${esc(t.limits)}</p><a href="#settings/calculations/workshop-${tool}">Calculations & measurement guide →</a></section>`;
  }
  function refresh(){
    ChassisTestUI.refresh();
    document.querySelector('#workshop-live').innerHTML=results(calculationInput(),draftTool);
    for(const [k,t] of Object.entries(WorkshopModel.tools)){
      const r=WorkshopModel.calculate(calculationInput(),k),group=document.querySelector(`[data-workshop-inputs="${k}"]`),error=group.querySelector('.workshop-error');error.textContent=r.error||'';error.hidden=!r.error;
      for(const name of t.keys){const el=group.querySelector(`[name="${name}"]`);let invalid=false;try{WorkshopModel.clean(state.setup,[name]);}catch{invalid=true;}el.setAttribute('aria-invalid',String(invalid));}
    }
  }
  function renderSaved(){const item=library.find(e=>e.id===analysisId);if(item)document.querySelector('#workshop-analysis').innerHTML=results(CalculatorModel.inputOf(item.setup),savedTool,true);}
  return {init,refresh,renderSaved,reveal,showDraft};
})();
