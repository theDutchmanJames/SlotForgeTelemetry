// Measurement inputs are optional and remain mounted during live refreshes.
function initializeMagnetic(){
  const section=document.createElement('section');section.className='panel magnetic-inputs';section.dataset.category='motor';
  const number=(name,label)=>`<label class="field">${label}<input name="${name}" type="number" min="0" max="${name==='magneticLimit'?100000:1000}" step="any" placeholder="Optional"></label>`;
  const text=(name,label)=>`<label class="field">${label}<input name="${name}" maxlength="200" placeholder="Record the test conditions"></label>`;
  section.innerHTML=`<h2><i class="icon-tile">${sfIcon('short-can-motor')}</i>Magnetic downforce</h2>
    <p class="hint">Enter magnetic pull only, in gram-force (gf). Do not enter car weight or a combined weight + pull reading. This measures attraction to the tester rails, including any extra magnets fitted.</p>
    <label class="field">Repeated pull readings · gf<textarea name="magneticReadings" rows="2" maxlength="2000" placeholder="For example: 19, 20, 21" aria-describedby="magnetic-reading-help"></textarea></label>
    <p class="hint" id="magnetic-reading-help">One reading is enough. Separate readings with spaces, commas or new lines; use decimal points. Repeat at the same clearance and position. Zero means measured zero; blank means unknown.</p>
    <div class="form-grid">${number('magneticClearance','Motor underside to rail top · mm')}${number('magneticLimit','Your club / tester limit · gf')}</div>
    <div class="form-grid">${text('magneticTester','Tester / measuring method')}${text('magneticRails','Test rails / track type')}${text('magneticOrientation','Motor mounting / face towards rails')}
    <label class="field">Additional traction magnets<select name="magneticExtra"><option value="unknown">Not recorded</option><option value="none">None — motor attraction</option><option value="fitted">Fitted — combined attraction</option></select></label>
    <label class="field">Motor during measurement<select name="magneticCondition"><option value="unknown">Not recorded</option><option value="off">Off / stationary</option><option value="running">Running — record conditions in setup notes</option></select></label></div>
    <h3>Measured clearance curve</h3><p class="hint">Use the same motor, tester, rail material and orientation for every point. Each row: clearance in mm, then magnetic pull in gf. Use one point per height (average repeats). Estimates stay inside your measured range.</p>
    <label class="field">Clearance (mm), pull (gf)<textarea name="magneticCurve" rows="4" maxlength="4000" placeholder="Example only:&#10;0.8, 30&#10;1.0, 24&#10;1.2, 20"></textarea></label>
    <h3>Connect to tyre wear</h3><label class="field">Worn motor clearance method<select name="magneticWearMode"><option value="measured">Enter measured worn clearance</option><option value="axle">Approximate: motor follows rear axle</option></select></label>
    ${number('magneticWornClearance','Measured worn motor-to-rail clearance · mm')}
    <p class="hint">The approximation adds half the rear tyre diameter change to current motor clearance. It assumes unchanged mounting and the motor follows the rear axle vertically; chassis pitch, pod movement and compression are excluded. Enter current and worn tyre diameters in Tyres & clearance.</p>
    <p id="magnetic-input-error" class="note" role="status" hidden></p><a class="help-link" href="#settings/calculations/magnetic">How magnetic calculations work →</a>`;
  document.querySelector('[name=totalWeight]').closest('.panel').after(section);
  document.querySelector('.tabs[aria-label="Analysis topics"]').insertAdjacentHTML('beforeend','<button data-analysis-topic="magnetic">Magnetic downforce</button>');
  document.querySelector('[data-analysis-panel=laps]').insertAdjacentHTML('afterend','<section data-analysis-panel="magnetic" hidden><div id="magnetic-results"></div></section>');
}
function refreshMagneticInputs(){
  let error='';try{MagneticModel.clean(state.setup);}catch(e){error=e.message;}
  const notice=document.querySelector('#magnetic-input-error');notice.textContent=error;notice.hidden=!error;
  for(const [name,parse] of [['magneticReadings',MagneticModel.readings],['magneticCurve',MagneticModel.curve]]){
    const field=document.querySelector(`[name="${name}"]`);let invalid=false;
    try{parse(field.value);}catch{invalid=true;}
    field.setAttribute('aria-invalid',String(invalid));field.setAttribute('aria-describedby',(name==='magneticReadings'?'magnetic-reading-help ':'')+'magnetic-input-error');
  }
}
function magneticChart(m){
  if(m.points.length<2)return '<p class="hint">Enter at least two distinct measured clearances to draw a curve. One point can only answer that exact clearance.</p>';
  const lo=m.points[0].height,hi=m.points.at(-1).height,top=Math.max(1,...m.points.map(p=>p.pull));
  const x=h=>55+(h-lo)/(hi-lo)*280,y=f=>150-f/top*120,fmt=performanceNumber;
  return `<figure class="performance-curve magnetic-chart"><figcaption>Magnetic pull versus clearance · measured points joined by straight lines</figcaption><svg viewBox="0 0 360 210" role="img" aria-label="Measured magnetic pull against motor clearance. Exact values and interval slopes are in the table below.">
    <path class="curve-grid" d="M55 30H335M55 90H335M55 150H335"/><path class="curve-axis" d="M55 30V150H335"/>
    <polyline class="curve-line torque" points="${m.points.map(p=>`${x(p.height)},${y(p.pull)}`).join(' ')}"/>
    ${m.points.map(p=>`<circle cx="${x(p.height)}" cy="${y(p.pull)}" r="3" fill="currentColor"/>`).join('')}
    <text x="49" y="34" text-anchor="end">${fmt(top,1)}</text><text x="49" y="153" text-anchor="end">0</text><text x="55" y="17">Pull · gf</text>
    <text x="55" y="173">${fmt(lo,3)}</text><text x="335" y="173" text-anchor="end">${fmt(hi,3)}</text><text x="195" y="198" text-anchor="middle">Motor underside to rail top · mm</text></svg></figure>`;
}
function magneticResults(input,full=false){
  const t=TelemetryModel.calculate(input),m=MagneticModel.calculate(input,t.massG,t.rideHeightChange),fmt=telemetryValue;
  if(m.error)return `<section class="panel" data-category="motor"><h3>Magnetic downforce</h3><p class="note">${esc(m.error)}</p></section>`;
  if(!full&&!m.count&&!m.points.length&&m.limit===null)return '<section class="panel" data-category="motor"><h3>Magnetic downforce</h3><p class="hint">Add measured pull readings in Magnetic downforce to see force, repeatability and support load. Save a clearance curve to explore it in Analyze.</p></section>';
  const measured=`<div class="performance-stats">${telemetryCard('Mean measured magnetic pull',m.mean,'gf')}${telemetryCard('Magnetic force',m.forceN,'N',4)}${telemetryCard('Pull relative to car weight',m.loadPercent,'%')}${telemetryCard('Total static support load',m.supportN,'N',4)}</div>`;
  const wornReason=m.wornHeight!==null&&m.wornHeight<=0?'Motor reaches or passes the rail-top plane; do not interpret this as usable running clearance.':m.wornHeight!==null&&m.wornEstimate===null?'Worn clearance is outside the measured curve range. No extrapolation is made.':'';
  return `<section class="panel magnetic-result" data-category="motor"><h3>${sfIcon('short-can-motor')}Magnetic downforce</h3>${measured}
    <p class="hint">${m.count} reading${m.count===1?'':'s'} · min ${fmt(m.min,'gf')} · max ${fmt(m.max,'gf')} · range ${fmt(m.range,'gf')}. This is observed repeatability, not instrument accuracy.</p>
    <p class="hint">Support load: ${fmt(m.supportGf,'gf')} equivalent. Actual mass stays ${fmt(m.massG,'g')}; hypothetical added ballast is excluded. This is total support (tyres and guide), not rear-tyre load or a grip / lap-time prediction.</p>
    ${m.limit!==null?`<p class="note" data-magnetic="limit">Limit ${fmt(m.limit,'gf')}: margin to mean ${fmt(m.margin,'gf')}; margin to highest reading ${fmt(m.minMargin,'gf')}. ${m.minMargin!==null&&m.minMargin<0?'At least one reading exceeds the entered limit.':'Positive margin means below the entered limit.'} Use your club’s tester and procedure; this is not a compliance certificate.</p>`:''}
    ${full?`<p class="hint">Tester: ${esc(input.magneticTester||'Not recorded')} · rails: ${esc(input.magneticRails||'Not recorded')} · mounting: ${esc(input.magneticOrientation||'Not recorded')} · extra magnets: ${esc(input.magneticExtra||'unknown')} · motor: ${esc(input.magneticCondition||'unknown')}</p>`:''}
    <h3>Clearance-based estimates</h3><div class="table-wrap"><table><thead><tr><th>Scenario</th><th>Motor clearance</th><th>Pull from curve</th></tr></thead><tbody>
    <tr><th>Current</th><td>${fmt(m.height,'mm',3)}</td><td data-magnetic="current-estimate">${fmt(m.estimate,'gf')}</td></tr>
    <tr><th>Worn tyres · ${m.approximate?'rear-axle approximation':'entered clearance'}</th><td>${fmt(m.wornHeight,'mm',3)}</td><td data-magnetic="worn-estimate">${fmt(m.wornEstimate,'gf')}</td></tr>
    </tbody></table></div><p class="hint">Curve-estimated change: ${fmt(m.estimateChange,'gf')}. These estimates do not replace the mean measured pull above. ${m.approximate?'Assumes the motor follows the rear axle; chassis pitch and pod movement are excluded.':''}</p>
    ${m.height!==null&&m.height<=0?'<p class="note">Current clearance is zero: the motor is at the rail-top plane.</p>':''}
    ${m.height!==null&&m.estimate===null?'<p class="hint">No curve value at current clearance. Add measurements spanning this height.</p>':''}
    ${wornReason?`<p class="note">${wornReason}</p>`:''}${m.increasing?'<p class="note">Some readings rise as clearance increases. Check position, units and test conditions; the measured points are retained unchanged.</p>':''}
    ${full?magneticChart(m)+`<div class="table-wrap"><table><caption>Measured points and local sensitivity</caption><thead><tr><th>Clearance · mm</th><th>Pull · gf</th><th>Slope from previous point · gf/mm</th></tr></thead><tbody>${m.points.map((p,i)=>`<tr><td>${fmt(p.height,'',3)}</td><td>${fmt(p.pull)}</td><td>${fmt(i?m.segments[i-1].slope:null)}</td></tr>`).join('')}</tbody></table></div><p class="hint">Slope = change in pull ÷ increase in clearance. A negative slope means pull falls as the gap grows. Linear interpolation is an estimate between adjacent points, not a universal magnetic-force law.</p>`:''}
    <a href="#settings/calculations/magnetic">Calculations and measurement guide →</a></section>`;
}
