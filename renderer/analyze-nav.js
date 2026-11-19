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
    shell(modes,topics);
  }
  // SlotForge Restyle (Paddock Rail): the modes in a side list beside the page, the topics nested under Analysis.
  function shell(modes,topics){
    const page=q('[data-page=analyze]'),head=page?.querySelector(':scope>.page-head');
    if(!page||!head||!modes||page.querySelector('.analyze-shell'))return;
    const box=document.createElement('div');box.className='analyze-shell';
    const rail=document.createElement('nav');rail.className='analyze-rail';rail.setAttribute('aria-label','Analyze');
    const main=document.createElement('div');main.className='analyze-main';
    for(const el of [...page.children])if(el!==head)main.append(el);
    modes.classList.remove('segmented');rail.append(modes);
    const analysis=modes.querySelector('[data-analysis-mode="overview"]');
    if(topics&&analysis){topics.classList.remove('tabs');analysis.after(topics);}
    box.append(rail,main);head.after(box);
  }
  // The topics belong to Analysis: shown only while it is open.
  function route(page,sub){
    const topics=q('.analyze-rail .analyze-topics');if(!topics)return;
    topics.hidden=!(page==='analyze'&&!['compare','races','racecompare','records','progress'].includes(sub));
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
  return {init,refresh,route,availability,MODES,TOPICS};
})();
