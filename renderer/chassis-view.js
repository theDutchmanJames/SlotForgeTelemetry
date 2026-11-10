const ChassisUI=(()=>{
  const field=k=>{const f=ChassisModel.fields[k],a=`name="${k}" aria-describedby="chassis-measure-help"`;
    return `<label class="field">${esc(f.label)}${f.type==='select'?`<select ${a}>${f.options.map(o=>{const [v,t]=o.split('|');return `<option value="${v}">${esc(t)}</option>`;}).join('')}</select>`:f.type==='textarea'?`<textarea ${a} rows="2" maxlength="${f.max}" data-input-example="20, 20.1, 19.9"></textarea>`:`<input ${a} type="${f.type}" ${f.type==='number'?`min="${f.min}" max="${f.max}" step="any"`:`maxlength="${f.max}"`} placeholder="Optional">`}</label>`;
  };
  const group=keys=>`<div class="form-grid">${keys.map(field).join('')}</div>`;
  const fmt=(v,d=2)=>performanceNumber(v,d);
  function init(){
    topicStyle.chassis=['weight','scales'];
    calculationHelp.chassis={title:'Chassis geometry & three-point balance',
      formula:'Geometry: guide angle = 2 × atan(T ÷ (2L)); ratio = L ÷ T; side = √(L² + (T/2)²).<br>For weighing, use S = actual front support to rear axle; x is behind this support and y is right of centreline (viewed from above, nose forward).<br>M = G + RL + RR. CG x = S × (RL + RR) ÷ M; CG y = T × (RR − RL) ÷ (2M).<br>Ballast m at (x,y): ΔG = m × (1 − x/S); ΔRL = m × x/(2S) − m × y/T; ΔRR = m × x/(2S) + m × y/T.<br>Rear-share target p: additional m = (p × planned mass − planned rear load) ÷ (x/S − p).',
      meaning:'Measure guide pivot to rear axle along the centreline. Rear spacing means tyre contact centres, not axle shaft length. For straight parallel tyres, centre spacing can be estimated as overall outside width minus half of each tyre width. Wheelbase remains front axle to rear axle. Weigh the running car on level, non-magnetic supports at its normal attitude. Tare fixtures first. Only the selected supports may carry load. Three scales, or a scale with equal-height replacement supports, can be used. Repeat readings with the same arrangement; they describe repeatability, not accuracy. A guide support at the pivot is an explicit approximation: braid contacts may lie elsewhere. A measured support span must refer to a centred front support. The front-axle mode uses the existing wheelbase.',
      example:'Guide span 100 mm and rear centres 60 mm give 33.40° and 1.67:1. With a 100 mm weighing span and readings 20 g guide / 30 g left / 30 g right, CG is 75 mm behind the front support and centred laterally. Add 10 g at x = 70 mm, y = +15 mm: the planned loads become 23 / 31 / 36 g, total 90 g. Moving a part removes its mass at the old location and adds it at the new location.',
      limits:'These are static point-support estimates from force and moment equilibrium. Front wheels and guide carrying load together invalidate the tripod model. No magnetic attraction may act during weighing; total magnetic pull is not apportioned to the supports. Level readings cannot locate CG height. Triangle angle, balance and target percentages have no universal better/worse direction and do not predict cornering speed, grip or deslot limits. Added/removed parts must exist as described; the calculator cannot verify their physical location. Plans do not change main car weight. A negative final load is impossible for an unrestrained support; zero is the boundary. Bounds are user-entered absolute measurement limits, not confidence intervals; geometry is treated as exact. Sources: Professor Motor chassis guidance; BSCRA dimension definitions; Slot Car Corner balance-device instructions; UCLA static equilibrium. Links and review examples are in docs/chassis-geometry.md.',field:'chassisGuideSpan'};
    const section=document.createElement('section');section.className='panel chassis-inputs';section.dataset.category='weight';
    section.innerHTML=`<h2><i class="icon-tile">${sfIcon('scales')}</i>Chassis geometry & balance</h2>
      <p class="hint">Measure the triangle, weigh the supports, then preview ballast changes. Geometry and load percentages are descriptive; there is no universal ideal angle or balance.</p>
      <h3>1 · Geometry</h3>${field('chassisGuideSpan')}${field('chassisTrackMethod')}
      <div data-chassis-width="centres">${field('chassisTrack')}</div><div data-chassis-width="outside" hidden>${group(['chassisOutside','chassisLeftWidth','chassisRightWidth'])}</div>
      <p class="hint">Use rear tyre contact centres, not shaft length. The guide is assumed centred. Wheelbase, if entered in Weight & ballast, adds the guide-to-front-axle offset.</p>
      <h3>2 · Weighing</h3>${field('chassisMode')}<div id="chassis-weigh-fields" hidden>
      <details class="chassis-guide"><summary>How to take reliable readings</summary><ol id="chassis-measure-help"><li>Prepare the car as raced, motor off, and use a level, non-magnetic surface.</li><li>Tare scales with their fixtures. Support the car at its normal ride attitude; use equal-height substitute supports if weighing one point at a time.</li><li>Only the selected supports may carry load. Keep the front wheels clear in guide modes, or the guide clear in axle mode.</li><li>Record the actual support position. Braids may support the car away from the guide pivot.</li><li>Repeat each reading without changing the setup. Enter decimal points; blank is unknown and zero is a measured zero.</li></ol></details>
      <div id="chassis-support-fields">${field('chassisSupportReference')}<div id="chassis-span-field">${field('chassisSupportSpan')}</div></div>
      <p id="chassis-axle-hint" class="hint" hidden>Front axle mode uses the wheelbase entered in Weight & ballast.</p>
      ${field('chassisConfirmed')}${field('chassisFront')}<div id="chassis-rear-field">${field('chassisRear')}</div><div id="chassis-split-fields">${group(['chassisLeft','chassisRight'])}</div>
      <details><summary>Measurement checks & bounds</summary>${group(['chassisBound','chassisCheckMass','chassisCheckBound'])}<p class="hint">An absolute bound includes instrument and method uncertainty. Display resolution alone is not accuracy. Repeats do not reduce these bounds. Mass disagreement is checked only when both bounds are supplied.</p></details></div>
      ${field('chassisNotes')}
      <h3>3 · Ballast plan</h3><p class="hint">A separate scenario; main car weight stays unchanged. Positions are centres of mass: x behind the selected front weighing support, y right of the car centreline. Negative y is left. Two-support modes use y = 0.</p>
      <div class="chassis-editor"><label class="field">Action<select id="chassis-action"><option value="add">Add a part</option><option value="remove">Remove a part</option><option value="move">Move a part</option></select></label>
      <label class="field">Part name<input id="chassis-part" maxlength="100" data-input-example="Front ballast"></label>
      <div class="form-grid">${[['mass','Mass · g','0.001','100000',''],['x','Current / added x · mm','-1000','1000',''],['y','Current / added y · mm','-1000','1000','0']].map(([k,l,min,max,v])=>`<label class="field">${l}<input id="chassis-part-${k}" type="number" min="${min}" max="${max}" step="any" value="${v}"></label>`).join('')}</div>
      <div id="chassis-move-fields" class="form-grid" hidden><label class="field">New x · mm<input id="chassis-part-toX" type="number" min="-1000" max="1000" step="any"></label><label class="field">New y · mm<input id="chassis-part-toY" type="number" min="-1000" max="1000" step="any" value="0"></label></div>
      <button class="btn" id="chassis-add-part">Add to plan</button><p id="chassis-edit-status" class="hint" role="status"></p></div><div id="chassis-parts"></div>
      <details><summary>Target rear share & mass limit</summary>${group(['chassisTarget','chassisTargetX','chassisTargetY','chassisMaxMass'])}<p class="hint">Choose your own target. The suggested additional mass is not inserted into the plan. It is separate from planned mass and never changes the main car weight.</p></details>
      <details><summary>Bring across an existing balance plan</summary><p class="hint">Copies the Testing & planning → Ballast planning readings and changes into this section, replacing its weighing inputs and ballast rows. Geometry is retained. Weighing conditions must be confirmed again.</p><button class="btn small" id="chassis-copy-balance">Replace with existing ballast plan</button></details>
      <p id="chassis-input-error" class="note" role="status" hidden></p><a class="help-link" href="#settings/calculations/chassis">Measurement guide & calculations →</a>`;
    document.querySelector('[name=totalWeight]').closest('.panel').after(section);
    document.querySelector('#stats').insertAdjacentHTML('afterend','<div id="chassis-live" aria-live="polite"></div>');
    document.querySelector('.tabs[aria-label="Analysis topics"]').insertAdjacentHTML('beforeend','<button data-analysis-topic="chassis">Chassis geometry & balance</button>');
    document.querySelector('[data-analysis-panel=laps]').insertAdjacentHTML('afterend','<section data-analysis-panel="chassis" hidden><div class="analysis-input-link"><span>Chassis geometry & balance · saved measurements</span><button class="btn small" data-edit-inputs="chassisGuideSpan">Edit these inputs</button></div><div id="chassis-analysis"></div></section>');
    document.querySelector('#chassis-action').onchange=e=>document.querySelector('#chassis-move-fields').hidden=e.target.value!=='move';
    document.querySelector('#chassis-add-part').onclick=addPart;
    document.querySelector('#chassis-parts').onclick=e=>{const b=e.target.closest('[data-remove-chassis]');if(!b)return;const rows=JSON.parse(state.setup.chassisChanges);rows.splice(Number(b.dataset.removeChassis),1);state.setup.chassisChanges=JSON.stringify(rows);window.refresh();persist();document.querySelector('#chassis-add-part').focus();};
    document.querySelector('#chassis-copy-balance').onclick=copyBalance;
  }
  function addPart(){
    const status=document.querySelector('#chassis-edit-status');
    try{
      const row={action:document.querySelector('#chassis-action').value,name:document.querySelector('#chassis-part').value};
      for(const k of ['mass','x','y',...(row.action==='move'?['toX','toY']:[])])row[k]=document.querySelector('#chassis-part-'+k).value;
      const raw=JSON.stringify([...JSON.parse(state.setup.chassisChanges),row]);ChassisModel.changes(raw);
      if(raw.length>ChassisModel.fields.chassisChanges.max)throw Error('This plan is too long. Shorten part names or remove rows.');
      state.setup.chassisChanges=raw;window.refresh();persist();status.textContent='Part added to the plan. Review planned loads below; save the setup to keep this scenario in your library.';
    }catch(e){status.textContent=e.message;}
  }
  function copyBalance(){
    try{
      const old=WorkshopModel.calculate(calculationInput(),'balance');if(old.error)throw Error(old.error);
      const s=state.setup,rows=s.balanceChanges.trim()?s.balanceChanges.trim().split(/\r?\n/).filter(l=>l.trim()).map(l=>{const [name,m,x]=l.split('|').map(v=>v.trim());return {name,action:Number(m)<0?'remove':'add',mass:String(Math.abs(Number(m))),x,y:'0'};}).filter(r=>Number(r.mass)>0):[];
      const next={...s,chassisMode:s.balanceSupport==='guide'?'guide':'axle',chassisSupportReference:'measured',chassisSupportSpan:s.balanceSpan,chassisFront:s.balanceFront,chassisRear:s.balanceRear,chassisLeft:'',chassisRight:'',chassisConfirmed:'no',chassisChanges:JSON.stringify(rows),chassisTarget:s.balanceTarget,chassisTargetX:s.balanceTargetX,chassisTargetY:'0',chassisMaxMass:s.balanceMax,chassisBound:'',chassisCheckMass:'',chassisCheckBound:'',chassisNotes:'Copied from the independent two-support ballast plan; verify the support positions and weighing conditions.'};
      if(s.balanceSupport==='axle'&&Number(s.balanceSpan)!==Number(s.wheelbase))throw Error('The existing plan span differs from wheelbase. Check those measurements before copying an axle plan.');
      ChassisModel.clean(next);state.setup=next;fillInputs();persist();document.querySelector('#chassis-edit-status').textContent='Copied. Confirm the weighing conditions before using the balance results.';
    }catch(e){document.querySelector('#chassis-edit-status').textContent=e.message;}
  }
  function diagram(length,track,baseline=null,planned=null,geometry=null){
    const scale=Math.min(220/length,240/track),rear=45+length*scale,left=210-track*scale/2,right=210+track*scale/2;
    const dot=(b,cls,label)=>b?.x!=null&&b?.y!=null?`<circle class="${cls}" cx="${210+b.y*scale}" cy="${45+b.x*scale}" r="6"><title>${label}: x ${fmt(b.x)} mm, y ${fmt(b.y)} mm</title></circle>`:'';
    const axle=geometry?.frontOffset!=null&&geometry.frontOffset>=0&&geometry.frontOffset<=length?45+geometry.frontOffset*scale:null;
    const tyres=[left,right].map(x=>`<rect class="chassis-tyre" x="${x-6}" y="${rear-14}" width="12" height="28" rx="4"/>`).join('');
    return `<figure class="chassis-diagram"><svg viewBox="0 0 420 315" role="img" aria-label="${baseline?'Weighing support triangle, with measured and planned horizontal CG positions':'Guide geometry triangle'}; length ${fmt(length)} mm, rear centres ${fmt(track)} mm. Contact positions are to scale; tyre symbols are schematic. Values also appear as text."><path class="chassis-triangle" d="M210 45L${left} ${rear}H${right}Z"/><path class="chassis-centre" d="M210 45V${rear}"/>${axle===null?'':`<path class="chassis-centre" d="M155 ${axle}H265"/><text x="275" y="${axle+4}">Front axle</text>`}${tyres}<circle class="chassis-contact" cx="210" cy="45" r="5"/><circle class="chassis-contact" cx="${left}" cy="${rear}" r="3"/><circle class="chassis-contact" cx="${right}" cy="${rear}" r="3"/><text x="210" y="22" text-anchor="middle">${baseline?(geometry?'Guide pivot / assumed support':'Front weighing support'):'Guide pivot'}</text><text x="${left-10}" y="${rear+25}" text-anchor="end">Left rear</text><text x="${right+10}" y="${rear+25}">Right rear</text>${dot(baseline,'chassis-cg-measured','Measured CG')}${dot(planned,'chassis-cg-planned','Planned CG')}</svg><figcaption>${baseline?'Support span':'Guide span'} ${fmt(length)} mm · rear centres ${fmt(track)} mm${geometry?` · angle ${fmt(geometry.angle)}°`:''}${baseline?' · filled marker: CG from measured loads; outlined marker: planned CG':''}. Contact positions to scale; tyre symbols schematic.</figcaption></figure>`;
  }
  function loadChart(r){
    const b=r.baseline,p=r.planned,labels=r.mode==='tripod'?['Guide','Left rear','Right rear']:[r.mode==='axle'?'Front axle':'Guide','Rear axle'];
    return `<figure class="chassis-loads"><figcaption>Share of total load · measured / planned</figcaption><svg viewBox="0 0 480 ${labels.length*64+25}" role="img" aria-label="Measured and planned support shares as paired horizontal bars. Exact readings and percentages are in the table.">${labels.map((l,i)=>{const y=i*64+15;return `<text x="0" y="${y+15}">${l}</text><rect class="chassis-load-measured" x="100" y="${y}" width="${b.loads[i]/b.mass*280}" height="14"/><text x="395" y="${y+12}">${fmt(b.loads[i]/b.mass*100,1)}%</text>${p?`<rect class="chassis-load-planned" x="100" y="${y+21}" width="${p.loads[i]/p.mass*280}" height="14"/><text x="395" y="${y+33}">${fmt(p.loads[i]/p.mass*100,1)}%</text>`:''}`;}).join('')}</svg><p class="hint">Upper solid bars: measured. Lower outlined bars: planned. Larger is not automatically better.</p></figure>`;
  }
  function loadTable(r){
    const b=r.baseline,p=r.planned,labels=r.mode==='tripod'?['Guide support','Left rear','Right rear']:[r.mode==='axle'?'Front axle':'Guide support','Rear axle'];
    return `<div class="table-wrap"><table><caption>Support readings and static plan · g shown as scale equivalents</caption><thead><tr><th>Support</th><th>Measured mean · g</th><th>Whole-car share · %</th><th>Planned · g</th><th>Planned share · %</th></tr></thead><tbody>${labels.map((l,i)=>`<tr><th>${l}</th><td>${fmt(b.loads[i])}</td><td>${fmt(b.loads[i]/b.mass*100)}</td><td>${fmt(p?.loads[i]??null)}</td><td>${fmt(p?p.loads[i]/p.mass*100:null)}</td></tr>`).join('')}</tbody></table></div>`;
  }
  function results(input,full=false){
    const r=ChassisModel.calculate(input),g=r.geometry,b=r.baseline,p=r.planned;
    let html='<section class="panel chassis-result" data-category="weight"><h3>'+sfIcon('scales')+'Chassis geometry & balance</h3>';
    if(r.error)html+=`<p class="note" role="status">${esc(r.error)}</p>`;
    const sameTriangle=b&&r.mode==='tripod'&&g&&r.span===g.length&&input.chassisSupportReference==='pivot';
    html+=g?diagram(g.length,g.track,sameTriangle?b:null,sameTriangle?p:null,g)+`<div class="performance-stats">${telemetryCard('Calculated guide angle',g.angle,'°')}${telemetryCard('Length / width',g.ratio,':1')}${telemetryCard('Guide to rear contact',g.side,'mm')}${telemetryCard('Guide ahead of front axle',g.frontOffset,'mm')}</div>`:'<p class="hint">Enter guide-to-rear-axle distance and rear contact centre spacing for a scaled triangle. A negative front-axle offset means the guide is behind that axle.</p>';
    if(g)html+='<p class="hint">Calculated geometry assumes a centred guide and straight, parallel rear tyres. Negative front-axle offset means the guide is behind that axle. No handling score is inferred.</p>';
    if(b){
      html+=`<h3>Measured balance</h3>${loadTable(r)}<div class="performance-stats">${telemetryCard('Measured support total',b.mass,'g')}${telemetryCard('Calculated CG behind front support',b.x,'mm')}${telemetryCard('Calculated CG right of centre',b.y,'mm')}${telemetryCard('Rear load carried by left tyre',b.rearLeftShare,'%')}</div><p class="hint">The rear-left percentage is a share of rear load only. Negative CG y means left of centre. No CG height is inferred.</p>`;
      if(full)html+=loadChart(r);
      if(!sameTriangle&&r.mode==='tripod'&&r.span!==null&&r.track!==null)html+=diagram(r.span,r.track,b,p);
      if(p)html+=`<h3>Planned scenario</h3><div class="performance-stats">${telemetryCard('Planned total mass',p.mass,'g')}${telemetryCard('Planned CG behind support',p.x,'mm')}${telemetryCard('Planned CG right of centre',p.y,'mm')}${telemetryCard('Mass margin against entered limit',r.massMargin,'g')}</div><p class="hint">Plan only: main car mass and measured readings remain unchanged. ${r.changes.length} part change(s). Positive mass margin is below the entered maximum; it is not a compliance certificate.</p>`;
      if(r.target)html+=`<h3>Target suggestion · additional to plan</h3><div class="performance-stats">${telemetryCard('Additional ballast for target',r.target.addedMass,'g')}${telemetryCard('Total with target ballast',r.target.mass,'g')}${telemetryCard('Rear share with target',r.target.rearShare,'%')}${telemetryCard('Mass margin with target',r.target.massMargin,'g')}</div><p class="hint">Suggested support loads: ${r.target.loads.map(v=>fmt(v)+' g').join(' / ')} (front, then rear or left/right). Not inserted into your plan.</p>`;
      if(full){
        html+=`<h3>Measurement quality</h3><p class="hint">Repeat readings: ${r.repeats.map((s,i)=>`${i===0?'Front':r.mode==='tripod'?(i===1?'Left rear':'Right rear'):'Rear'} · ${s.count} reading(s), min ${fmt(s.min)} g, max ${fmt(s.max)} g, range ${fmt(s.max-s.min)} g`).join('; ')}. Repeatability is not accuracy.</p>`;
        if(r.massDifference!==null)html+=`<p>Support total − independent mass: ${fmt(r.massDifference)} g. Combined bound: ${fmt(r.massTolerance)} g.</p>`;
        if(r.bounds)html+=`<div class="table-wrap"><table><caption>Bounds from support readings · geometry treated as exact; not statistical confidence</caption><thead><tr><th>Quantity</th><th>Lower</th><th>Upper</th></tr></thead><tbody>${[['mass','Mass · g'],['frontShare','Front share · %'],['rearShare','Rear share · %'],['x','CG x · mm'],['y','CG y · mm']].filter(([k])=>r.bounds[k]).map(([k,l])=>`<tr><th>${l}</th><td>${fmt(r.bounds[k][0])}</td><td>${fmt(r.bounds[k][1])}</td></tr>`).join('')}</tbody></table></div>`;
        if(r.changes.length)html+=parts(r.changes,false);
      }
    }
    html+=r.notes.map(t=>`<p class="note">${esc(t)}</p>`).join('');
    if(input.chassisNotes)html+=`<p class="hint">Measurement notes: ${esc(input.chassisNotes)}</p>`;
    return html+'<p class="hint">Static estimates only. Magnetic attraction, extra contacts and chassis compliance can invalidate the support model. Geometry and balance do not predict lap times or cornering limits.</p><a href="#settings/calculations/chassis">Measurement guide & calculations →</a></section>';
  }
  function parts(rows,editable){return rows.length?`<div class="table-wrap"><table><caption>Ballast changes · x behind front support; y right of centre</caption><thead><tr><th>Part / action</th><th>Mass · g</th><th>x, y · mm</th>${editable?'<th>Action</th>':''}</tr></thead><tbody>${rows.map((r,i)=>`<tr><th>${esc(r.name)}<small> · ${esc(r.action)}</small></th><td>${fmt(r.mass)}</td><td>${fmt(r.x)}, ${fmt(r.y)}${r.action==='move'?` → ${fmt(r.toX)}, ${fmt(r.toY)}`:''}</td>${editable?`<td><button class="btn small" data-remove-chassis="${i}" aria-label="Remove ${esc(r.name)} from plan">Remove</button></td>`:''}</tr>`).join('')}</tbody></table></div>`:'<p class="hint">No ballast changes planned.</p>';}
  function refresh(){
    const s=state.setup,mode=s.chassisMode;
    for(const e of document.querySelectorAll('[data-chassis-width]'))e.hidden=e.dataset.chassisWidth!==s.chassisTrackMethod;
    document.querySelector('#chassis-weigh-fields').hidden=['none','mixed'].includes(mode);
    document.querySelector('#chassis-support-fields').hidden=mode==='axle';document.querySelector('#chassis-axle-hint').hidden=mode!=='axle';
    document.querySelector('#chassis-span-field').hidden=s.chassisSupportReference!=='measured';
    document.querySelector('#chassis-rear-field').hidden=mode==='tripod';document.querySelector('#chassis-split-fields').hidden=mode!=='tripod';
    document.querySelector('[name=chassisTargetY]').disabled=mode!=='tripod';
    const r=ChassisModel.calculate(s),error=document.querySelector('#chassis-input-error');error.textContent=r.error;error.hidden=!r.error;
    document.querySelector('#chassis-live').innerHTML=results(s);
    try{document.querySelector('#chassis-parts').innerHTML=parts(ChassisModel.changes(s.chassisChanges),true);}catch{document.querySelector('#chassis-parts').textContent='The ballast plan could not be read.';}
  }
  function renderSaved(){const item=library.find(e=>e.id===analysisId);if(item)document.querySelector('#chassis-analysis').innerHTML=results(item.setup,true);}
  return {init,refresh,renderSaved,results};
})();
