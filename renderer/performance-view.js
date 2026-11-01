// Extracted from SlotForge Paddock performance.js; standalone state adapter.
let buildCurvePercent=50;
const performanceMetrics=[
  ['ratio','Gear ratio',':1',3,1],['axleRpm','No-load rear-axle speed','RPM',0,1],
  ['speedKmh','No-load theoretical speed','km/h',2,1],['rollout','Rollout','mm/motor rev',2,1],
  ['axleTorque','Rear-axle torque from rating','gf·cm',1,1/0.0000980665],['forceN','Driving force from rating','N',2,1],
  ['peakPowerW','Estimated peak mechanical power','W',2,1],['peakMotorRpm','Motor speed at peak power','RPM',0,1]
];
function performanceNumber(n,d=2){return Number.isFinite(n)?n.toLocaleString('en-GB',{maximumFractionDigits:d}):'—';}
function performanceValue(m,key,d,multiplier=1){return m[key]===null||m[key]===undefined?'—':performanceNumber(m[key]*multiplier,d);}
function performanceStats(input){
  const m=PerformanceModel.calculate(input);
  return `<div class="performance-stats">${performanceMetrics.map(([key,label,unit,d,multiplier])=>`<div class="performance-stat" data-category="${metricStyle[key][0]}">${metricHeading(key,key==='forceN'?(m.torqueType==='Stall'?'Ideal stall driving force':'Ideal force at rated torque'):label)}<strong data-performance-result="${key}">${performanceValue(m,key,d,multiplier)} <small>${unit}</small></strong></div>`).join('')}</div><p class="tiny muted">Torque and force are before drivetrain losses and grip limits. Torque basis: <strong>${esc(m.torqueType)}</strong> at ${performanceNumber(m.torqueVoltage)} V. RPM basis: ${performanceNumber(m.ratedVoltage)} V. ${m.torqueType==='Stall'?'Stall torque and force apply at zero speed, not at the no-load speed above.':m.torqueType==='Rated running'?'Rated torque and force apply at the manufacturer’s rated operating point, not at no-load RPM.':'Confirm the torque type to calculate axle torque and driving force.'}</p>`;
}
function performanceCurve(input,kind){
  const m=PerformanceModel.calculate(input),torque=kind==='torque',max=torque?m.motorTorque:m.peakPowerW;
  if(!m.curveReady)return '';
  const x0=50,y0=24,w=280,h=130;
  const points=Array.from({length:41},(_,i)=>{const p=PerformanceModel.point(input,i*2.5),v=torque?p.torqueGfCm:p.powerW;return `${x0+i/40*w},${y0+h-v/max*h}`;}).join(' ');
  const title=torque?'Motor torque (gf·cm)':'Motor mechanical power (W)',cursor=x0+w*buildCurvePercent/100;
  return `<figure class="performance-curve"><figcaption>${title}</figcaption><svg viewBox="0 0 350 200" role="img" aria-label="${title} versus motor RPM. ${torque?'Torque decreases linearly from stall torque at zero RPM to zero at no-load RPM.':'Power peaks at half the no-load RPM.'}"><path class="curve-grid" d="M50 24H330M50 89H330M50 154H330"/><path class="curve-axis" d="M50 24V154H330"/><polyline class="curve-line ${torque?'torque':'power'}" points="${points}"/><line class="curve-cursor" data-curve-cursor x1="${cursor}" x2="${cursor}" y1="24" y2="154"/><text x="44" y="28" text-anchor="end">${performanceNumber(max,1)}</text><text x="44" y="157" text-anchor="end">0</text><text x="50" y="175">0</text><text x="190" y="175" text-anchor="middle">${performanceNumber(m.ratedRpm/2,0)}</text><text x="330" y="175" text-anchor="end">${performanceNumber(m.ratedRpm,0)}</text><text x="190" y="194" text-anchor="middle">Motor RPM</text></svg></figure>`;
}
function buildPerformanceReadout(input){
  const p=PerformanceModel.point(input,buildCurvePercent);if(!p)return '';
  return `<strong>${performanceNumber(p.rpm,0)} motor RPM</strong> · ${performanceNumber(p.torqueGfCm,1)} gf·cm · ${performanceNumber(p.powerW)} W<br><span class="muted">${performanceNumber(p.axleRpm,0)} axle RPM · ${performanceNumber(p.speedKmh)} km/h · ${performanceNumber(p.forceN)} N driving force (before losses / grip limits)</span>`;
}

