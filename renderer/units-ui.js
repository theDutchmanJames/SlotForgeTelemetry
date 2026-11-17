// Current display units for this device, plus the Settings controls. Saved setups stay metric.
const UNITS_KEY='slotforge.telemetry.units.v1';
let Units=UnitSystem.create(UnitSystem.PRESETS.metric);
try{Units=UnitSystem.create(JSON.parse(localStorage.getItem(UNITS_KEY)||'null')||UnitSystem.PRESETS.metric);}catch{/* Metric when storage is unavailable. */}
// "27.02 km/h" in the chosen units; ratios (":1") attach without a space.
function unitText(n,token,d=2){
 if(!Number.isFinite(n))return '—';
 const label=Units.label(token);
 return performanceNumber(Units.value(n,token),Units.digits(token,d))+(label?(label.startsWith(':')?'':' ')+label:'');
}
function unitValue(n,token,d=2){return Number.isFinite(n)?performanceNumber(Units.value(n,token),Units.digits(token,d)):'—';}
// Input boxes show the chosen unit; the stored setup value stays metric.
// Shown rounded (e.g. 0.787 in); the exact metric value is only replaced when the field is edited.
function displayInput(name,stored){const token=UnitSystem.INPUTS[name],rule=token&&Units.rule(token);if(!rule||rule.factor===1||stored===''||stored==null||!Number.isFinite(Number(stored)))return stored;return UnitSystem.inputText(Number(Units.value(Number(stored),token).toFixed((rule.extra||0)+1)));}
function storeInput(name,shown){const token=UnitSystem.INPUTS[name],rule=token&&Units.rule(token);if(!rule||rule.factor===1||shown===''||!Number.isFinite(Number(shown)))return shown;return UnitSystem.storedText(Units.toMetric(Number(shown),token));}
function applyUnitLabels(){
 for(const el of document.querySelectorAll('[data-unit]'))el.textContent=Units.label(el.dataset.unit);
 for(const [name,token] of Object.entries(UnitSystem.INPUTS))for(const input of document.querySelectorAll(`input[name="${name}"]`)){
  // Remember the metric limits once, then express them in the chosen unit (slightly widened against rounding).
  for(const k of ['min','max'])if(input.hasAttribute(k)&&!input.dataset['metric'+k])input.dataset['metric'+k]=input.getAttribute(k);
  for(const k of ['min','max'])if(input.dataset['metric'+k]){const v=Units.value(Number(input.dataset['metric'+k]),token);input.setAttribute(k,String(Number((v*(k==='min'?1-1e-9:1+1e-9)).toPrecision(12))));}
 }
 const note=document.querySelector('#units-note');if(note)note.hidden=Units.metric();
}
function setUnits(prefs){
 Units=UnitSystem.create(prefs);try{localStorage.setItem(UNITS_KEY,JSON.stringify(Units.prefs));}catch{/* Applies for this session. */}
 applyUnitLabels();renderUnitSettings();fillInputs();if(typeof renderRoute==='function')renderRoute();
}
function renderUnitSettings(){
 const box=document.querySelector('#unit-settings');if(!box)return;
 const preset=Object.entries(UnitSystem.PRESETS).find(([,p])=>Object.entries(p).every(([q,k])=>Units.prefs[q]===k))?.[0]||'custom';
 box.innerHTML=`<div class="segmented unit-presets" role="group" aria-label="Unit system">${[['metric','Metric'],['imperial','Imperial'],['custom','Custom']].map(([k,l])=>`<button type="button" class="btn small" data-unit-preset="${k}" aria-pressed="${preset===k}">${l}</button>`).join('')}</div>
  <div class="form-grid unit-grid">${Object.entries(UnitSystem.QUANTITIES).map(([q,{title,choices}])=>`<label class="field">${title}<select data-unit-quantity="${q}">${choices.map(([k,l])=>`<option value="${k}"${Units.prefs[q]===k?' selected':''}>${l}</option>`).join('')}</select></label>`).join('')}</div>`;
 for(const b of box.querySelectorAll('[data-unit-preset]'))b.onclick=()=>{if(b.dataset.unitPreset!=='custom')setUnits(UnitSystem.PRESETS[b.dataset.unitPreset]);};
 for(const s of box.querySelectorAll('[data-unit-quantity]'))s.onchange=()=>setUnits({...Units.prefs,[s.dataset.unitQuantity]:s.value});
}
function initializeUnits(){
 const appearance=document.querySelector('#settings-appearance');
 appearance.insertAdjacentHTML('beforeend',`<h2 class="units-title">Units</h2><p class="muted">Choose how speeds, weights, torque and lengths are shown and entered. Saved setups and files always store metric values, so they stay compatible with every SlotForge app.</p><div id="unit-settings"></div><p class="hint">Applies to the workbench, results, Analyze, setup comparison, the library and setup sheets. Specialist tools (chassis geometry, magnetic downforce, Testing &amp; planning, Driver Feedback) and Calculations explained stay metric for now.</p>`);
 document.querySelector('.input-column').insertAdjacentHTML('afterbegin','<p class="hint units-note" id="units-note" hidden>Specialist tools below the main inputs use metric units.</p>');
 renderUnitSettings();applyUnitLabels();
}
