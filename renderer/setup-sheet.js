// Printable one-page setup sheet: a static, self-contained HTML snapshot of one setup.
(function(root) {
  const node=typeof module==='object'&&module.exports;
  const C=node?require('./calculator-model.js'):root.CalculatorModel;
  const P=node?require('./performance-model.js'):root.PerformanceModel;
  const T=node?require('./telemetry-model.js'):root.TelemetryModel;
  const M=node?require('./magnetic-model.js'):root.MagneticModel;
  const UnitSystemRef=node?require('./units.js'):root.UnitSystem;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num=(v,d=2)=>Number.isFinite(v)?v.toLocaleString('en-GB',{maximumFractionDigits:d}):null;
  let U=UnitSystemRef.create(); // Replaced per sheet by the viewer's chosen units.
  const join=(n,unit)=>n+(!unit?'':U.label(unit).startsWith(':')?U.label(unit):' '+U.label(unit));
  const val=(v,unit,d=2)=>{const n=num(U.value(v,unit),U.digits(unit,d));return n===null?'—':join(n,unit);};
  // Entered values: format numbers like calculated ones, keep any other text as typed.
  // Converted entries use the same precision as the input boxes (e.g. 0.787 in); metric entries up to 3 decimals.
  const entered=unit=>{const r=U.rule(unit);return r&&r.factor!==1?(r.extra||0)+1:3;};
  const raw=(v,unit)=>v===''||v==null?'—':Number.isFinite(+v)?join(num(U.value(+v,unit),entered(unit)),unit):join(esc(v),unit);
  // Compact chart around the current gearing: ±2 pinion teeth, ±4 driven-gear teeth.
  function nearbyChart(input,m) {
    const p=+input.pinion,g=+input.gear;
    if(!Number.isInteger(p)||!Number.isInteger(g)||m.motor.rollout===null)return '';
    const pins=[-2,-1,0,1,2].map(d=>p+d).filter(x=>x>=1),gears=[-4,-3,-2,-1,0,1,2,3,4].map(d=>g+d).filter(x=>x>=1);
    const cell=(pp,gg)=>{const r=P.calculate({...input,pinion:String(pp),gear:String(gg)});return `<td${pp===p&&gg===g?' class="current"':''}>${num(U.value(r.rollout,'mm/motor rev'),U.digits('mm/motor rev',1))??'—'}<small>${num(U.value(r.speedKmh,'km/h'),1)??'—'}</small></td>`;};
    return `<section class="chart"><h2>Nearby gearing</h2><p class="hint">Rollout in ${U.label('mm/motor rev')}, with no-load ${U.label('km/h')} below. Rows: pinion · columns: driven gear. Current setup outlined.</p><table><thead><tr><th>P \\ G</th>${gears.map(x=>`<th>${x}</th>`).join('')}</tr></thead><tbody>${pins.map(pp=>`<tr><th>${pp}</th>${gears.map(gg=>cell(pp,gg)).join('')}</tr>`).join('')}</tbody></table></section>`;
  }
  function html(setup,{notes='',savedAt=null,exportedAt=new Date(),units}={}) {
    U=UnitSystemRef.create(units);
    const s=C.cleanSetup(setup),input=C.inputOf(s),m=T.calculate(input),mo=m.motor;
    const mag=M.calculate(input,m.massG,m.rideHeightChange);
    const row=(label,value)=>`<tr><th>${esc(label)}</th><td>${value}</td></tr>`;
    const tyre=s.tyreMode==='rim'?`${raw(s.rimDiameter,'mm')} seat + 2 × ${raw(s.tyreThickness,'mm')} = ${val(mo.rearDiameter,'mm',3)}`:raw(s.rearDiameter,'mm');
    const clearance=m.gearFit.state==='interference'?`Gear protrudes ${val(m.gearFit.interference,'mm',2)}`:m.gearFit.state==='touching'?'0 mm · touching':val(m.gearFit.gap,'mm',2);
    const inputs=[
      ['Gearing',[['Pinion',raw(s.pinion,'teeth')],['Driven gear',raw(s.gear,'teeth')]]],
      ['Motor',[['No-load speed',s.ratedRpm?`${raw(s.ratedRpm,'RPM')} at ${raw(s.ratedVoltage,'V')}`:'—'],['Torque',s.motorTorque?`${raw(s.motorTorque,'gf·cm')} at ${raw(s.torqueVoltage,'V')} · ${esc(s.torqueType)}`:'—'],['Motor type',esc(s.motorType||'Unknown')]]],
      ['Rear tyres',[['Fitted diameter',tyre],['Worn diameter',raw(s.wornDiameter,'mm')],['Driven gear outside diameter',raw(s.gearDiameter,'mm')]]],
      ['Weight',[['Total car weight',raw(s.totalWeight,'g')],['Front / rear scale',s.frontWeight||s.rearWeight?`${raw(s.frontWeight,'g')} / ${raw(s.rearWeight,'g')}`:'—'],['Added ballast',s.ballast&&+s.ballast?`${raw(s.ballast,'g')}${s.ballastPosition?' at '+raw(s.ballastPosition,'mm')+' behind front axle':''}`:'—'],['Wheelbase',raw(s.wheelbase,'mm')]]]
    ];
    const results=[
      ['Gear ratio',val(mo.ratio,':1',3)],['Rollout',val(mo.rollout,'mm/motor rev')],['No-load axle speed',val(mo.axleRpm,'RPM',0)],['No-load theoretical speed',val(mo.speedKmh,'km/h')],
      ['Ideal stall driving force',val(mo.forceN,'N')],['Estimated peak mechanical power',mo.peakPowerW==null?'—':`${val(mo.peakPowerW,'W')} at ${val(mo.peakMotorRpm,'RPM',0)}`],
      ['Peak power / mass',val(m.powerToWeight,'W/kg',1)],['Front / rear weight',m.frontPercent==null?'—':`${val(m.frontPercent,'%',1)} / ${val(m.rearPercent,'%',1)}`],
      ['Centre of gravity behind front axle',val(m.cg,'mm',1)],['Driven gear clearance',clearance],
      ...(mag.count?[['Magnetic pull (mean)',`${val(mag.mean,'gf',1)} · ${mag.count} reading(s)`]]:[])
    ].filter(([,v])=>v!=='—');
    const when=d=>d?esc(new Date(d).toLocaleString('en-GB',{dateStyle:'medium',timeStyle:'short'})):'';
    return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><title>${esc(s.name||'Setup')} · SlotForge Telemetry setup sheet</title><style>
@page{size:A4;margin:12mm}*{box-sizing:border-box}body{font:13px/1.45 system-ui,sans-serif;color:#1d2430;background:#edf1f5;margin:0;padding:24px}main{max-width:820px;margin:auto;background:#fff;padding:26px 30px;border-radius:8px;border-top:5px solid #d9414d}
header{display:flex;justify-content:space-between;gap:20px;align-items:flex-end;border-bottom:2px solid #1d2430;padding-bottom:10px}h1{font-size:24px;margin:0}header small{color:#5b6779}.brand{font-weight:700;letter-spacing:.06em;font-size:11px;color:#d9414d;text-align:right}
h2{font-size:13px;text-transform:uppercase;letter-spacing:.08em;margin:18px 0 6px;color:#3c4a5c}.grid{display:grid;grid-template-columns:1fr 1fr;gap:4px 26px}table{border-collapse:collapse;width:100%}th,td{text-align:left;padding:4px 6px;border-bottom:1px solid #dde3ea;vertical-align:top}th{font-weight:500;color:#4a5668;width:52%}td{font-weight:600}
.chart table{table-layout:fixed}.chart th,.chart td{text-align:center;width:auto;border:1px solid #dde3ea;padding:3px 2px;font-variant-numeric:tabular-nums}.chart td small{display:block;font-weight:400;color:#5b6779;font-size:10px}.chart .current{outline:2px solid #d9414d;outline-offset:-2px}
.notes{white-space:pre-wrap;background:#f4f6f9;padding:8px 10px;border-radius:4px}.hint{color:#5b6779;font-size:11px;margin:2px 0 6px}.track{display:grid;grid-template-columns:repeat(3,1fr);gap:8px 18px}.track div{border-bottom:1px solid #9aa6b5;padding-top:16px;font-size:11px;color:#5b6779}
.lines{height:150px;background:repeating-linear-gradient(#fff 0 23px,#c9d1db 23px 24px);margin-top:6px}footer{margin-top:14px;font-size:10px;color:#6a7687}
@media print{body{background:#fff;padding:0}main{padding:0;border:0;max-width:none}section{break-inside:avoid}}@media(max-width:640px){body{padding:8px}main{padding:16px}.grid,.track{grid-template-columns:1fr}}
</style></head><body><main><header><div><h1>${esc(s.name||'Untitled setup')}</h1><small>${savedAt?'Saved '+when(savedAt)+' · ':''}Sheet created ${when(exportedAt)}</small></div><div class="brand">SLOTFORGE TELEMETRY<br>SETUP SHEET</div></header>
${notes?`<h2>Notes</h2><div class="notes">${esc(notes)}</div>`:''}
<div class="grid">${inputs.map(([title,rows])=>`<section><h2>${title}</h2><table>${rows.map(([l,v])=>row(l,v)).join('')}</table></section>`).join('')}</div>
<section><h2>Calculated</h2>${results.length?`<div class="grid"><table>${results.slice(0,Math.ceil(results.length/2)).map(([l,v])=>row(l,v)).join('')}</table><table>${results.slice(Math.ceil(results.length/2)).map(([l,v])=>row(l,v)).join('')}</table></div>`:'<p class="hint">Enter gearing, motor and tyre values to calculate results.</p>'}<p class="hint">Ideal values before drivetrain losses and grip limits. No-load speed is a theoretical ceiling, not a lap-speed prediction.</p></section>
${nearbyChart(input,m)}
<section><h2>At the track</h2><div class="track"><div>Track</div><div>Lane</div><div>Date</div><div>Best lap</div><div>Typical lap</div><div>Driver</div></div><div class="lines" aria-label="Space for handwritten notes"></div></section>
<footer>Created by SlotForge Telemetry. A snapshot: later changes to the setup do not update this sheet. Print with Ctrl+P (or ⌘P), or save as PDF from the print dialog.</footer></main></body></html>`;
  }
  function fileName(setup){return ((setup.name||'setup').replace(/[^a-z0-9_-]+/gi,'-').replace(/^-+|-+$/g,'').slice(0,70)||'setup')+'-setup-sheet.html';}
  function download(setup,options){
    const url=URL.createObjectURL(new Blob([html(setup,options)],{type:'text/html;charset=utf-8'})),a=document.createElement('a');
    a.href=url;a.download=fileName(setup);a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);
  }
  const api={html,fileName,download};
  if(node)module.exports=api;else root.SetupSheet=api;
})(globalThis);
