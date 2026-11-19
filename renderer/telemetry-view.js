// Inputs stay mounted while their result panels update, preserving keyboard focus.
// Gear chart: one renderer for the live workbench ('live') and saved analysis ('saved').
const GEAR_CHART_METRICS={rollout:['Rollout','mm/motor rev',2],speedKmh:['No-load speed','km/h',1],ratio:['Ratio',':1',3]};
let gearChartMetric='rollout';const gearChartInputs={};
function gearChartHtml(input,scope) {
  gearChartInputs[scope]=input;
  const c=TelemetryModel.gearChart(input),[label,metricUnit,digits]=GEAR_CHART_METRICS[gearChartMetric],unit=Units.label(metricUnit);
  if(!c.pinions.length)return '<p class="hint">Enter whole-number pinion and driven-gear ranges in Gear finder to draw the chart.</p>';
  const metricButtons=Object.entries(GEAR_CHART_METRICS).map(([key,[name]])=>`<button type="button" class="btn small" data-gear-chart-metric="${key}" aria-pressed="${key===gearChartMetric}">${name}</button>`).join('');
  const band=e=>e===null?'':Math.abs(e)<=1?' gear-cell-match':Math.abs(e)<=3?' gear-cell-near':'';
  const cell=x=>{const isCurrent=x.pinion===c.current.pinion&&x.gear===c.current.gear,title=`${x.pinion} / ${x.gear} · ratio ${performanceNumber(x.ratio,3)}:1 · rollout ${unitText(x.rollout,'mm/motor rev')} · ${unitText(x.speedKmh,'km/h',1)}${x.errorPercent===null?'':` · ${x.errorPercent>=0?'+':''}${performanceNumber(x.errorPercent,1)}% vs target`}${isCurrent?' · current setup':''}`;
    return `<td class="gear-cell${band(x.errorPercent)}${isCurrent?' gear-cell-current':''}"><button type="button" data-gear-cell="${scope}" data-pinion="${x.pinion}" data-gear="${x.gear}" title="${esc(title)}" aria-label="${esc(title)}">${unitValue(x[gearChartMetric],metricUnit,digits)}</button></td>`;};
  const action=scope==='live'?'Click a cell to try that gearing in your draft.':'Click a cell to open this saved setup with that gearing.';
  return `<div class="gear-chart-toolbar"><span class="muted tiny">Show</span>${metricButtons}</div>
    <div class="table-wrap gear-chart-wrap"><table class="gear-chart"><caption>${label} (${unit}) · rows: pinion teeth · columns: driven-gear teeth</caption><thead><tr><th scope="col">P \\ G</th>${c.gears.map(g=>`<th scope="col"${g===c.current.gear?' class="gear-axis-current"':''}>${g}</th>`).join('')}</tr></thead><tbody>${c.cells.map((row,i)=>`<tr><th scope="row"${c.pinions[i]===c.current.pinion?' class="gear-axis-current"':''}>${c.pinions[i]}</th>${row.map(cell).join('')}</tr>`).join('')}</tbody></table></div>
    <p class="hint"><span class="gear-key gear-cell-match"></span> within 1% of target rollout <span class="gear-key gear-cell-near"></span> within 3% <span class="gear-key gear-cell-current"></span> current setup. Target: ${unitText(c.target,'mm/motor rev')}${input.targetRollout?'':' (current setup)'}. ${action} Check pitch, mesh and fit before buying parts.${c.extended?` The chart reaches past your Gear finder ranges to include your current ${c.current.pinion} / ${c.current.gear}.`:''}${c.truncated?` Showing the first ${TelemetryModel.CHART_LIMIT.pinions} pinions × ${TelemetryModel.CHART_LIMIT.gears} gears; narrow the ranges to see the rest.`:''}</p>`;
}
function useSavedGearing(pinion,gear){openLibraryTask('load',analysisId);libraryTask.gearing={pinion,gear};$('#library-editor-description').textContent='Open this saved setup in Telemetry and apply '+pinion+' / '+gear+' gearing? This replaces the current draft. The saved setup stays unchanged until you save.';}
document.addEventListener('click',event=>{
  const metric=event.target.closest('[data-gear-chart-metric]');
  if(metric){gearChartMetric=metric.dataset.gearChartMetric;for(const box of document.querySelectorAll('[data-gear-chart]'))if(gearChartInputs[box.dataset.gearChart])box.innerHTML=gearChartHtml(gearChartInputs[box.dataset.gearChart],box.dataset.gearChart);return;}
  const cell=event.target.closest('[data-gear-cell]');if(!cell)return;
  const {pinion,gear}=cell.dataset;
  if(cell.dataset.gearCell==='saved'){useSavedGearing(pinion,gear);return;}
  // Live: change the draft directly, like typing the values. Undo by clicking the previous cell.
  const before=state.setup.pinion+' / '+state.setup.gear;
  state.setup.pinion=pinion;state.setup.gear=gear;fillInputs();persist();toast(`Gearing set to ${pinion} / ${gear} (was ${before}). Save setup to keep it.`);
});
function telemetryFields(keys) {
  return '<div class="form-grid">'+keys.map(key=>{
    const [label,max,zero]=TelemetryModel.fields[key],integer=/^(pinion|gear)(Min|Max)$/.test(key),token=UnitSystem.INPUTS[key];
    // Unit-aware labels: the metric unit in brackets becomes a span that follows the chosen units.
    const shown=token?`${label.replace(/\s*\([^)]*\)\s*$/,'')} <span class="unit" data-unit="${token}">${token}</span>`:label;
    return `<label class="field">${shown}<input name="${key}" type="number" min="${key==='wornDiameter'?8:zero?0:integer?1:0.000001}" max="${['wornDiameter','gearDiameter'].includes(key)?30:max}" step="${integer?1:'any'}" inputmode="decimal"></label>`;
  }).join('')+'</div>';
}
for(const [id,title,keys,note] of [
  ['weight','Weight & ballast',['ballast','frontWeight','rearWeight','wheelbase','ballastPosition','efficiency','motorPercent'],'Scale readings describe the car before added ballast. Leave total weight blank to use their sum. For balance, support both axles at equal height with the guide clear and no magnetic pull on the scales. Ballast position runs from 0 at the front axle to the wheelbase at the rear axle. Efficiency defaults to the ideal 100%.'],
  ['wear','Tyre wear & clearance',['wornDiameter','gearDiameter'],'Measure the driven gear’s actual outside diameter, including tooth tips. Clearance assumes the gear is concentric with the rear axle and both rear tyres have the entered diameter.'],
  ['gears','Gear finder',['targetRollout','pinionMin','pinionMax','gearMin','gearMax'],'Leave target rollout blank to match the current setup. To compensate for tyre wear, enter the old rollout as your target and change the fitted tyre diameter in Rear tyres.'],
  ['laps','Lap speed',['trackLength','lapTime','scaleFactor'],'Use the distance of the lane actually driven and a measured lap time. Scale speed is a simple scale-factor conversion, not equivalent full-size vehicle performance.']
]) {
  const section=document.createElement('section');section.id='inputs-'+id;section.dataset.category=topicStyle[id][0];
  section.className='setup-input-group';
  section.innerHTML=`<h3>${sfIcon(topicStyle[id][1])}${title}</h3>${telemetryFields(keys)}<p class="hint">${note}</p>`;
  if(id==='weight') {
    section.querySelector('h3').remove();
    document.querySelector('[name=totalWeight]').closest('.panel').append(section);
  } else if(id==='wear') {
    document.querySelector('[name=tyreMode]').closest('.panel').append(section);
  } else {
    section.classList.add('panel');
    document.querySelector('.input-column').append(section);
  }
}
// Both helpers follow the chosen display units; values stay metric everywhere else.
const telemetryValue=(n,unit='',digits=2)=>Number.isFinite(n)?unitText(n,unit,digits):`${performanceNumber(n,digits)}${unit?' '+Units.label(unit):''}`;
function telemetryCard(label,value,unit,digits) {return `<div class="performance-stat"><span class="metric-label">${sfIcon(/speed/i.test(label)?'timer':'scales')}${label}</span><strong>${unitValue(value,unit,digits??2)} <small>${Units.label(unit)}</small></strong></div>`;}
function balanceResults(m) {
  const fmt=telemetryValue;
  return `<section class="panel calculation-detail" data-category="weight"><h3>${sfIcon('scales')}Ballast placement & balance</h3>
    <div class="table-wrap"><table><thead><tr><th>Static balance</th><th>Current</th><th>With ballast</th></tr></thead><tbody>
    <tr><th>Front axle load</th><td>${fmt(m.frontWeight,'g')}</td><td data-telemetry="ballast-front">${fmt(m.ballastFront,'g')}</td></tr>
    <tr><th>Rear axle load</th><td>${fmt(m.rearWeight,'g')}</td><td data-telemetry="ballast-rear">${fmt(m.ballastRear,'g')}</td></tr>
    <tr><th>Front / rear share</th><td>${fmt(m.frontPercent,'%')} / ${fmt(m.rearPercent,'%')}</td><td>${fmt(m.ballastFrontPercent,'%')} / ${fmt(m.ballastRearPercent,'%')}</td></tr>
    <tr><th>Centre of gravity behind front axle</th><td>${fmt(m.cg,'mm')}</td><td data-telemetry="ballast-cg">${fmt(m.ballastCg,'mm')}</td></tr>
    </tbody></table></div>
    ${m.positionInvalid?'<p class="note">Ballast position must be between the axles: 0 to the wheelbase.</p>':''}
    ${m.massMismatch?'<p class="note">Axle readings differ from total car weight. Balance uses the axle readings; power-to-weight and acceleration use total car weight.</p>':''}
    <p class="hint">Enter both axle readings and wheelbase for centre of gravity; add ballast and its position for the second scenario. Position describes the centre of the added ballast. This is a static two-axle model: weigh level, with the guide clear and no magnetic pull on the scales. It does not predict grip, dynamic load transfer or centre-of-gravity height.</p></section>`;
}
function clearanceResults(m) {
  const value=fit=>fit.state==='interference'?`No clearance · gear protrudes ${telemetryValue(fit.interference,'mm',3)} below the tyre contact plane`:fit.state==='touching'?'0 mm · no clearance (gear touches the track plane)':telemetryValue(fit.gap,'mm',3);
  return `<section class="panel calculation-detail" data-category="tyres"><h3>${sfIcon('wheel-tyre-set')}Driven gear clearance</h3>
    <div class="table-wrap"><table><thead><tr><th>Nominal clearance</th><th>Current tyre</th><th>Worn tyre</th></tr></thead><tbody><tr><th>Gap below driven gear</th><td data-telemetry="clearance">${value(m.gearFit)}</td><td data-telemetry="worn-clearance">${value(m.wornGearFit)}</td></tr></tbody></table></div>
    <p class="hint">(Tyre diameter − measured driven gear outside diameter) ÷ 2. Requires a gear concentric with the rear axle and equal rear tyres on a flat track. Nominal geometry only: tyre compression, gear runout and track irregularities reduce usable clearance. Positive clearance does not confirm chassis clearance or gear compatibility.</p></section>`;
}
function accelerationCurve(input,m) {
  if(m.acceleration===null)return '';
  const start=TelemetryModel.calculate({...input,motorPercent:'0'}),max=start.acceleration;
  if(!(max>0))return '';
  const line=(mass)=>Array.from({length:21},(_,i)=>{
    const p=PerformanceModel.point(input,i*5),a=p.forceN*(m.efficiency/100)/(mass/1000);
    return `${50+i*14},${154-a/max*130}`;
  }).join(' ');
  return `<figure class="performance-curve acceleration-curve"><figcaption>Ideal acceleration · grip and inertia excluded · current (teal) / with ballast (amber)</figcaption><svg viewBox="0 0 350 200" role="img" aria-label="Ideal acceleration decreases to zero at no-load RPM. Added ballast reduces acceleration."><path class="curve-grid" d="M50 24H330M50 89H330M50 154H330"/><path class="curve-axis" d="M50 24V154H330"/><polyline class="curve-line torque" points="${line(m.massG)}"/>${m.loadedG>0?`<polyline class="curve-line power" points="${line(m.loadedG)}"/>`:''}<text x="44" y="28" text-anchor="end">${performanceNumber(max,1)}</text><text x="44" y="157" text-anchor="end">0</text><text x="50" y="175">0</text><text x="330" y="175" text-anchor="end">${performanceNumber(m.motor.ratedRpm,0)}</text><text x="190" y="194" text-anchor="middle">Motor RPM · acceleration in m/s²</text></svg></figure>`;
}
function renderTelemetry(input) {
  const m=TelemetryModel.calculate(input),fmt=telemetryValue;
  $('#weight-results').innerHTML=`<div class="table-wrap"><table><thead><tr><th>Metric</th><th>Current</th><th>With ballast</th></tr></thead><tbody>
    <tr><th>Mass used</th><td>${fmt(m.massG,'g')}</td><td>${fmt(m.loadedG,'g')}</td></tr>
    <tr><th>Estimated peak motor power / mass</th><td>${fmt(m.powerToWeight,'W/kg')}</td><td>${fmt(m.loadedPowerToWeight,'W/kg')}</td></tr>
    <tr><th>Ideal acceleration at ${fmt(m.motorPercent,'%')} no-load RPM<br><small>Grip and inertia excluded</small></th><td data-telemetry="acceleration">${fmt(m.acceleration,'m/s²')}</td><td>${fmt(m.loadedAcceleration,'m/s²')}</td></tr>
    </tbody></table></div><div class="performance-stats">${telemetryCard('Front weight distribution',m.frontPercent,'%')}${telemetryCard('Rear weight distribution',m.rearPercent,'%')}</div>
    ${m.massMismatch?'<p class="note">Axle readings do not add up to total car weight. Acceleration uses total weight; distribution uses the axle readings.</p>':''}
    <p class="hint">Saved operating point: ${fmt(m.point?.rpm,'RPM',0)} · ${fmt(m.point?.speedKmh,'km/h')}. Separate from the exploratory Performance slider. Power-to-weight uses peak motor mechanical power before drivetrain losses.</p>
    <div class="performance-stats">${telemetryCard('Estimated wheel force after losses',m.wheelForce,'N')}${telemetryCard('Estimated wheel power after losses',m.wheelPower,'W')}</div><p class="hint">At the saved operating point and ${fmt(m.efficiency,'%')} assumed drivetrain efficiency, before grip limits. Efficiency adjusts these wheel outputs and acceleration; motor ratings stay unchanged.</p>
    ${accelerationCurve(input,m)}<p class="note">Acceleration = motor-curve driving force × efficiency ÷ mass in kg. Requires the same confirmed brushed DC stall ratings as the power curves. This ignores traction limits, rotating inertia and drag; weight alone cannot predict grip, cornering or lap time.</p>${balanceResults(m)}`;
  const worn=m.worn;
  $('#wear-results').innerHTML=`${m.wornDiameter!==null&&m.motor.rearDiameter!==null&&m.wornDiameter>m.motor.rearDiameter?'<p class="note">Worn diameter must be no larger than the current tyre diameter.</p>':''}<div class="table-wrap"><table><thead><tr><th>Metric</th><th>Current tyre</th><th>Worn tyre</th><th>Change</th></tr></thead><tbody>${[
    ['Outside diameter','rearDiameter','mm'],['No-load speed','speedKmh','km/h'],['Rollout','rollout','mm/motor rev'],[m.motor.torqueType==='Stall'?'Ideal stall driving force':'Ideal force at rated torque','forceN','N']
  ].map(([label,key,unit])=>{const a=m.motor[key],b=worn?.[key];return `<tr><th>${label}</th><td>${fmt(a,unit)}</td><td>${fmt(b,unit)}</td><td>${fmt(a!=null&&b!=null?b-a:null,unit)}</td></tr>`;}).join('')}</tbody></table></div><p class="hint">Rear axle-height change: <strong data-telemetry="ride-height">${fmt(m.rideHeightChange,'mm')}</strong>. Half the diameter change, assuming unchanged axle mounting; chassis pitch and front clearance are not modelled. Force is before drivetrain losses and uses the selected torque rating, not no-load speed.</p>${clearanceResults(m)}${magneticResults(input)}`;
  const candidates=TelemetryModel.gears(input);
  $('#gears-results').innerHTML=`<p class="hint">Target: ${fmt(candidates.target,'mm/motor rev')} · showing ${candidates.rows.length} of ${candidates.count} combinations, ordered by ${candidates.target!==null&&m.motor.rearDiameter!==null?'closest rollout':'gear ratio'}. Mechanical compatibility must be checked separately.</p><div class="table-wrap gear-table"><table><thead><tr><th>Pinion / gear</th><th>Ratio</th><th>Rollout</th><th>Target error</th><th>No-load speed</th><th></th></tr></thead><tbody>${candidates.rows.map(r=>`<tr><td>${r.pinion} / ${r.gear}</td><td>${fmt(r.ratio,':1',3)}</td><td>${fmt(r.rollout,'mm/motor rev')}</td><td>${fmt(r.error,'mm/motor rev')}</td><td>${fmt(r.speedKmh,'km/h')}</td><td><button class="btn small" data-gearing="${r.pinion},${r.gear}" aria-label="Use ${r.pinion} tooth pinion and ${r.gear} tooth gear">Use</button></td></tr>`).join('')}</tbody></table></div>`;
  $('#gears-results').insertAdjacentHTML('beforeend',`<section class="panel calculation-detail" data-category="gearing"><h3>${sfIcon('spur-gear')}Gear chart</h3><div data-gear-chart="saved">${gearChartHtml(input,'saved')}</div></section>`);
  for(const button of document.querySelectorAll('[data-gearing]'))button.onclick=()=>{const [pinion,gear]=button.dataset.gearing.split(',');useSavedGearing(pinion,gear);};
  $('#laps-results').innerHTML=`<div class="performance-stats">${telemetryCard('Measured average speed',m.lapSpeed,'km/h')}${telemetryCard('Scale-equivalent average speed',m.scaleSpeed,'km/h')}</div><p class="hint">Average speed = lap distance ÷ lap time × 3.6. Scale speed = average speed × scale denominator. These are measured lap averages, separate from the motor’s theoretical no-load ceiling.</p>`;
}
