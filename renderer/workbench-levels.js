// Groups the workbench into levels, so the first screen shows only the essentials.
// Presentation only: hidden folders keep their values, and calculations always use every input.
const WorkbenchLevels=(()=>{
  const KEY='slotforge.telemetry.workbench-level.v1',q=s=>document.querySelector(s);
  const LEVELS=[
    ['setup','Quick setup','setup','The essentials: gearing, motor, tyres and weight. Everything else is optional.','Gearing, motor, tyres, weight'],
    ['measure','Measure the car','scales','Optional measurements: tyre wear and clearance, axle loads, chassis geometry and magnetic downforce.','Wear, axle loads, chassis, magnets'],
    ['plan','Plan & test','timer','Choose gears, work out lap speed and plan track tests.','Gear chart, lap speed, track tests'],
    ['all','Everything','list','Every input and result on one page.','All inputs and results']
  ];
  // Input folders and result groups per level. Anything not listed shows at every level.
  const FOLDERS={pinion:['setup'],ratedRpm:['setup'],tyreMode:['setup','measure'],totalWeight:['setup','measure'],chassisGuideSpan:['measure'],magneticReadings:['measure'],targetRollout:['plan'],trackLength:['plan'],workshop:['plan']};
  const RESULTS={drivetrain:['setup'],performance:['setup'],gears:['setup','plan'],weight:['setup','measure'],tyres:['setup','measure'],magnetic:['measure'],laps:['plan'],workshop:['plan']};
  let level='setup';
  const shows=(map,key,at=level)=>at==='all'||!map[key]||map[key].includes(at);
  function init(){
    try{const saved=localStorage.getItem(KEY);if(LEVELS.some(([k])=>k===saved))level=saved;}catch{/* Default level. */}
    // A row of view tabs above inputs and results: each says what it shows.
    q('.calculator-layout').insertAdjacentHTML('beforebegin',`<div class="workbench-levels"><span class="levels-label" id="workbench-level-label">Show</span><div class="level-switch level-tabs" role="group" aria-labelledby="workbench-level-label">${LEVELS.map(([key,label,icon,,short])=>`<button type="button" data-workbench-level="${key}" aria-pressed="false">${sfIcon(icon)}<span class="level-text"><strong>${label}</strong><small>${short}</small></span></button>`).join('')}</div><p class="sr-only" id="workbench-level-hint" aria-live="polite"></p></div>`);
    for(const b of document.querySelectorAll('[data-workbench-level]'))b.onclick=()=>set(b.dataset.workbenchLevel);
    apply();
  }
  function apply(){
    for(const b of document.querySelectorAll('[data-workbench-level]'))b.setAttribute('aria-pressed',String(b.dataset.workbenchLevel===level));
    q('#workbench-level-hint').textContent=LEVELS.find(([k])=>k===level)[3];
    const folders=[...document.querySelectorAll('.workbench-folder')];
    for(const f of folders)f.hidden=!shows(FOLDERS,f.dataset.folder);
    for(const g of document.querySelectorAll('[data-result-group]'))g.hidden=!shows(RESULTS,g.dataset.resultGroup);
    // Never land on an empty-looking level: open its first folder when none is open.
    const visible=folders.filter(f=>!f.hidden);if(visible.length&&!visible.some(f=>f.open))visible[0].open=true;
    if(typeof WorkbenchPairs!=='undefined')WorkbenchPairs.sync();
  }
  function set(next){
    if(!LEVELS.some(([k])=>k===next))return;level=next;
    try{localStorage.setItem(KEY,level);}catch{/* Works for this session. */}
    apply();
  }
  // Jumping to an input (help, Analyze, Driver Feedback) switches to a level that shows it.
  function ensure(folderKey){if(shows(FOLDERS,folderKey))return;set(LEVELS.find(([k])=>k!=='all'&&shows(FOLDERS,folderKey,k))?.[0]||'all');}
  return {init,set,ensure,get:()=>level,LEVELS,FOLDERS,RESULTS};
})();
