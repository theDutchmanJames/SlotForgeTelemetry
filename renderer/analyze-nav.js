// Lighter Analyze navigation: modes in two labelled groups, topics in three clusters,
// and topics without saved data dimmed for the selected setup. The existing links and
// buttons are moved, not recreated, so routing and handlers stay exactly as they were.
const AnalyzeNav=(()=>{
  const q=s=>document.querySelector(s);
  const MODES=[['Setups',[['overview','Analysis'],['compare','Compare']]],['Track laps',[['races','Laps'],['racecompare','Compare'],['progress','Progress'],['records','Records']]]];
  const TOPICS=[['Essentials',['performance','gears']],['Measurements',['weight','wear','chassis','magnetic']],['Planning',['laps','workshop']]];
  // Relabel a link or button whose leading icon must stay.
  const relabel=(el,text)=>{for(const n of [...el.childNodes])if(n.nodeType===3)n.remove();el.append(text);el.title=el.title||text;};
  function init(){
    const modes=q('[data-page=analyze] .page-head .segmented');
    if(modes&&!modes.querySelector('.nav-group')){
      modes.classList.add('analyze-modes');
      for(const [label,items] of MODES){
        const group=document.createElement('div');group.className='nav-group';group.setAttribute('role','group');group.setAttribute('aria-label',label);
        group.innerHTML=`<span class="nav-group-label">${label}</span>`;
        for(const [mode,text] of items){const link=modes.querySelector(`[data-analysis-mode="${mode}"]`);if(!link)continue;link.setAttribute('aria-label',(label==='Setups'?'Setup ':'Lap ')+text.toLowerCase());relabel(link,text);group.append(link);}
        modes.append(group);
      }
    }
    const topics=q('.tabs[aria-label="Analysis topics"]');
    if(topics&&!topics.querySelector('.nav-group')){
      topics.classList.add('analyze-topics');
      for(const [label,keys] of TOPICS){
        const group=document.createElement('div');group.className='nav-group';group.setAttribute('role','group');group.setAttribute('aria-label',label);
        group.innerHTML=`<span class="nav-group-label">${label}</span>`;
        for(const key of keys){const b=topics.querySelector(`[data-analysis-topic="${key}"]`);if(b)group.append(b);}
        topics.append(group);
      }
      // Anything added later by another module still shows, in its own group.
      const rest=[...topics.children].filter(e=>e.matches('[data-analysis-topic]'));
      if(rest.length){const group=document.createElement('div');group.className='nav-group';group.innerHTML='<span class="nav-group-label">More</span>';group.append(...rest);topics.append(group);}
    }
  }
  // Which topics hold saved values for this setup. Dimmed topics remain clickable.
  function availability(setup){
    const input=CalculatorModel.inputOf(setup),t=TelemetryModel.calculate(input),c=ChassisModel.calculate(setup);
    let workshop=false;try{workshop=Object.keys(WorkshopModel.tools).some(k=>{const r=WorkshopModel.calculate(input,k);return r.metrics?.some(m=>Number.isFinite(m.value))||r.rows?.length>0;});}catch{/* Treat as no data. */}
    let changes=[];try{changes=JSON.parse(setup.chassisChanges||'[]');}catch{/* No plan. */}
    return {performance:true,gears:true,weight:t.massG!==null||t.axleTotal!==null,wear:t.wornDiameter!==null||t.gearDiameter!==null,laps:t.lapSpeed!==null,
      magnetic:!!String(setup.magneticReadings||'').trim(),chassis:!c.error&&(!!c.geometry||!!c.baseline||changes.length>0),workshop};
  }
  function refresh(setup){
    if(!setup)return;const has=availability(setup);
    for(const b of document.querySelectorAll('[data-analysis-topic]')){
      const empty=has[b.dataset.analysisTopic]===false;b.classList.toggle('topic-empty',empty);
      if(empty)b.title='Nothing saved for this topic in this setup yet. Open it to see what to measure.';else b.removeAttribute('title');
    }
  }
  return {init,refresh,availability,MODES,TOPICS};
})();
