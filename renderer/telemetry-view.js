// Inputs stay mounted while their result panels update, preserving keyboard focus.
function telemetryFields(keys) {
  return '<div class="form-grid">'+keys.map(key=>{
    const [label,max,zero]=TelemetryModel.fields[key],integer=/^(pinion|gear)(Min|Max)$/.test(key);
    return `<label class="field">${label}<input name="${key}" type="number" min="${zero?0:integer?1:0.000001}" max="${max}" step="${integer?1:'any'}" inputmode="decimal"></label>`;
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
const telemetryValue=(n,unit='',digits=2)=>`${performanceNumber(n,digits)}${unit?' '+unit:''}`;
function telemetryCard(label,value,unit,digits) {return `<div class="performance-stat"><span class="metric-label">${sfIcon(/speed/i.test(label)?'timer':'scales')}${label}</span><strong>${performanceNumber(value,digits??2)} <small>${unit}</small></strong></div>`;}
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
  const warning=(value)=>value===null?'':value<0?'Gear extends below the tyre contact plane.':value===0?'Gear touches the track plane; there is no clearance.':'';
  return `<section class="panel calculation-detail" data-category="tyres"><h3>${sfIcon('wheel-tyre-set')}Driven gear clearance</h3>
    <div class="table-wrap"><table><thead><tr><th>Nominal clearance</th><th>Current tyre</th><th>Worn tyre</th></tr></thead><tbody><tr><th>Gear tooth tips above track</th><td data-telemetry="clearance">${telemetryValue(m.clearance,'mm',3)}</td><td data-telemetry="worn-clearance">${telemetryValue(m.wornClearance,'mm',3)}</td></tr></tbody></table></div>
    ${warning(m.clearance)?`<p class="note">Current tyre: ${warning(m.clearance)}</p>`:''}${warning(m.wornClearance)?`<p class="note">Worn tyre: ${warning(m.wornClearance)}</p>`:''}
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
  ].map(([label,key,unit])=>{const a=m.motor[key],b=worn?.[key];return `<tr><th>${label}</th><td>${fmt(a,unit)}</td><td>${fmt(b,unit)}</td><td>${fmt(a!=null&&b!=null?b-a:null,unit)}</td></tr>`;}).join('')}</tbody></table></div><p class="hint">Rear axle-height change: <strong data-telemetry="ride-height">${fmt(m.rideHeightChange,'mm')}</strong>. Half the diameter change, assuming unchanged axle mounting; chassis pitch and front clearance are not modelled. Force is before drivetrain losses and uses the selected torque rating, not no-load speed.</p>${clearanceResults(m)}`;
  const candidates=TelemetryModel.gears(input);
  $('#gears-results').innerHTML=`<p class="hint">Target: ${fmt(candidates.target,'mm/motor rev')} · showing ${candidates.rows.length} of ${candidates.count} combinations, ordered by ${candidates.target!==null&&m.motor.rearDiameter!==null?'closest rollout':'gear ratio'}. Mechanical compatibility must be checked separately.</p><div class="table-wrap gear-table"><table><thead><tr><th>Pinion / gear</th><th>Ratio</th><th>Rollout</th><th>Target error</th><th>No-load km/h</th><th></th></tr></thead><tbody>${candidates.rows.map(r=>`<tr><td>${r.pinion} / ${r.gear}</td><td>${fmt(r.ratio,':1',3)}</td><td>${fmt(r.rollout,'mm/motor rev')}</td><td>${fmt(r.error,'mm/motor rev')}</td><td>${fmt(r.speedKmh)}</td><td><button class="btn small" data-gearing="${r.pinion},${r.gear}" aria-label="Use ${r.pinion} tooth pinion and ${r.gear} tooth gear">Use</button></td></tr>`).join('')}</tbody></table></div>`;
  for(const button of document.querySelectorAll('[data-gearing]'))button.onclick=()=>{const [pinion,gear]=button.dataset.gearing.split(',');openLibraryTask('load',analysisId);libraryTask.gearing={pinion,gear};$('#library-editor-description').textContent='Open this saved setup in Telemetry and apply '+pinion+' / '+gear+' gearing? This replaces the current draft. The saved setup stays unchanged until you save.';};
  $('#laps-results').innerHTML=`<div class="performance-stats">${telemetryCard('Measured average speed',m.lapSpeed,'km/h')}${telemetryCard('Scale-equivalent average speed',m.scaleSpeed,'km/h')}</div><p class="hint">Average speed = lap distance ÷ lap time × 3.6. Scale speed = average speed × scale denominator. These are measured lap averages, separate from the motor’s theoretical no-load ceiling.</p>`;
}
