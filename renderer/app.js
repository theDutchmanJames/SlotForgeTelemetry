'use strict';
const $ = selector => document.querySelector(selector);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const STORAGE = 'slotforge.calculator.workspace.v1';
const APPEARANCE = 'slotforge.calculator.appearance.v1';
const state = { setup: { ...CalculatorModel.EXAMPLE }, reference: null, theme: 'dark', customColors: { ...Theme.DEFAULT } };
let toastTimer;
let preferredThemes={light:'light',dark:'dark'};
function toast(message) {
  $('#toast').textContent = message; $('#toast').hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { $('#toast').hidden = true; }, 4500);
}
function calculationInput() { return CalculatorModel.inputOf(state.setup); }
function persist() {
  try {
    const text = CalculatorModel.encode(state.setup, state.reference);
    localStorage.setItem(STORAGE, text);
    $('#save-state').textContent = 'Workspace saved on this device';
  } catch (error) {
    $('#save-state').textContent = error.name === 'QuotaExceededError' || error.name === 'SecurityError' ? 'Local saving unavailable · use Export setup' : 'Invalid inputs · last valid workspace retained';
  }
}
function readWorkspace() {
  try { const saved = localStorage.getItem(STORAGE); if (saved) Object.assign(state, CalculatorModel.decode(saved)); }
  catch { toast('The saved workspace could not be read. The example is ready; open a saved setup to recover.'); }
  try {
    const appearance = JSON.parse(localStorage.getItem(APPEARANCE) || '{}');
    if (Theme.THEMES.some(([key]) => key === appearance.theme)) state.theme = appearance.theme;
    state.customColors = Theme.customOf(appearance);
    for(const tone of ['light','dark'])if(Theme.THEMES.some(([key])=>key===appearance.preferredThemes?.[tone]))preferredThemes[tone]=appearance.preferredThemes[tone];
  } catch { /* Keep the default appearance if browser storage is unavailable. */ }
}
function fillInputs() {
  for (const el of document.querySelectorAll('[name]')) if (Object.hasOwn(state.setup, el.name)) el.value = state.setup[el.name];
  refresh();
}
function refresh() {
  const input = calculationInput(), m = PerformanceModel.calculate(input), rim = state.setup.tyreMode === 'rim';
  $('#diameter-fields').hidden = rim; $('#rim-fields').hidden = !rim;
  $('#tyre-hint').textContent = rim ? `Outside diameter = rim + 2 × thickness${m.rearDiameter ? ' = ' + performanceNumber(m.rearDiameter, 3) + ' mm' : '.'}` : 'Use the fitted tyre’s outside diameter, after truing.';
  $('#ratio-inline').textContent = m.ratio === null ? '—' : m.ratio.toFixed(3) + ':1';
  $('#flow-rpm').textContent = performanceNumber(m.ratedRpm, 0) + ' RPM';
  $('#flow-gearing').textContent = m.ratio === null ? '— : —' : input.pinion + ' : ' + input.gear + ' teeth';
  $('#flow-tyre').textContent = performanceNumber(m.rearDiameter, 2) + ' mm';
  $('#stats').innerHTML = liveStats(input);
  let error = '';
  try { CalculatorModel.cleanSetup(state.setup); } catch (e) { error = e.message; }
  for (const el of document.querySelectorAll('input[type=number]')) {
    // Blank optional fields are valid; syntax, bounds and tooth counts are not.
    const invalid = el.validity.badInput || (el.value !== '' && !el.validity.valid);
    el.setAttribute('aria-invalid', String(invalid));
    if (invalid && !error) error = 'Check the highlighted input: use positive numbers and whole tooth counts.';
  }
  $('#input-error').textContent = error; $('#input-error').hidden = !error;
  for (const id of ['save-setup', 'save-copy']) $('#' + id).disabled = !!error;
  updateLibraryStatus();
}
function renderCurves(input, model) {
  $('#curve-results').innerHTML = model.curveReady
    ? `<div class="performance-curves">${performanceCurve(input, 'torque')}${performanceCurve(input, 'power')}</div><label class="field performance-slider">Explore motor speed · <span id="build-curve-percent">${buildCurvePercent}% of no-load RPM</span><input id="build-curve-speed" type="range" min="0" max="100" step="1" value="${buildCurvePercent}"></label><output id="build-curve-readout" class="performance-readout" aria-live="polite">${buildPerformanceReadout(input)}</output><p class="hint">Ideal brushed DC model. Stall is at zero speed; no-load RPM is at zero external torque. Test voltages must match.</p>`
    : `<div class="panel"><h3>Complete your motor ratings</h3><p class="muted tiny">${model.reasons.map(esc).join(' ')}</p><button class="btn small" id="edit-motor">Show torque & power inputs</button></div>`;
  if ($('#edit-motor')) $('#edit-motor').onclick = () => {openLibraryTask('load',analysisId);libraryTask.focus='motorTorque';};
  if ($('#build-curve-speed')) $('#build-curve-speed').oninput = event => {
    buildCurvePercent = Number(event.target.value);
    $('#build-curve-percent').textContent = buildCurvePercent + '% of no-load RPM';
    $('#build-curve-readout').innerHTML = buildPerformanceReadout(input);
    for (const cursor of document.querySelectorAll('[data-curve-cursor]')) {
      cursor.setAttribute('x1', 50 + 280 * buildCurvePercent / 100); cursor.setAttribute('x2', 50 + 280 * buildCurvePercent / 100);
    }
  };
}
function downloadSetup() {
  try {
    const text = CalculatorModel.encode(state.setup, state.reference);
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    const anchor = document.createElement('a'); anchor.href = url;
    anchor.download = (state.setup.name.replace(/[^a-z0-9_-]+/gi, '-').slice(0,70) || 'setup') + '.slotforge-calculator.json';
    anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 10000);
  } catch (error) { toast(error.message); }
}
function applyTheme() {
  const root = document.documentElement; root.dataset.theme = state.theme;
  for (const [key] of Theme.COLORS) root.style.removeProperty('--' + key);
  root.style.removeProperty('--on-accent');
  if (state.theme === 'custom') {
    for (const [key, value] of Object.entries(state.customColors)) root.style.setProperty('--' + key, value);
    root.style.setProperty('--on-accent', Theme.onAccent(state.customColors.accent));
  }
  root.dataset.tone = (state.theme === 'custom' ? Theme.isLight(state.customColors.panel) : ['light', 'ocean'].includes(state.theme)) ? 'light' : 'dark';
  for (const button of document.querySelectorAll('[data-theme-choice]')) button.setAttribute('aria-pressed', String(button.dataset.themeChoice === state.theme));
  preferredThemes[root.dataset.tone]=state.theme;
  for(const button of document.querySelectorAll('[data-tone-choice]'))button.setAttribute('aria-pressed',String(button.dataset.toneChoice===root.dataset.tone));
  $('#custom-colors').hidden = state.theme !== 'custom';
  $('#contrast-warning').textContent = Theme.problems(state.customColors).join(' ');
  try { localStorage.setItem(APPEARANCE, JSON.stringify({ theme: state.theme, customColors: state.customColors, preferredThemes })); } catch { /* Appearance still applies for this session. */ }
}
function setupAppearance() {
  $('#theme-grid').innerHTML = Theme.THEMES.map(([key, label]) => `<button class="theme-tile" data-theme="${key}" data-theme-choice="${key}" aria-pressed="false"><span class="theme-swatches" aria-hidden="true"><i></i><i></i><i></i><i></i></span>${esc(label)}</button>`).join('');
  $('#color-grid').innerHTML = Theme.COLORS.map(([key, label, hint]) => `<label class="color-row"><input type="color" data-color="${key}" value="${state.customColors[key]}"><span>${label}<small>${hint}</small></span></label>`).join('');
  for (const button of document.querySelectorAll('[data-theme-choice]')) button.onclick = () => { state.theme = button.dataset.themeChoice; applyTheme(); };
  for (const input of document.querySelectorAll('[data-color]')) input.oninput = () => { state.customColors[input.dataset.color] = Theme.hex6(input.value); applyTheme(); };
  for(const button of document.querySelectorAll('[data-tone-choice]'))button.onclick=()=>{const tone=button.dataset.toneChoice;state.theme=preferredThemes[tone];if(state.theme==='custom' && (Theme.isLight(state.customColors.panel)?'light':'dark')!==tone)state.theme=tone;applyTheme();};
  applyTheme();
}
document.addEventListener('input', event => {
  const el = event.target;
  if (!el.name || !Object.hasOwn(state.setup, el.name)) return;
  state.setup[el.name] = el.validity.badInput ? 'invalid' : el.value;
  refresh(); persist();
});
$('#new-setup').onclick = () => { state.setup = CalculatorModel.blank(); bindLibrary(null); fillInputs(); persist(); $('[name=name]').focus(); };
$('#load-example').onclick = () => { state.setup = { ...CalculatorModel.EXAMPLE }; bindLibrary(null); fillInputs(); persist(); toast('Example loaded: 21,500 RPM, 9:27 gears, 20 mm tyres.'); };
$('#save-setup').onclick = downloadSetup;
$('#open-setup').onclick = () => $('#setup-file').click();
$('#setup-file').onchange = async event => {
  const file = event.target.files[0]; if (!file) return;
  try {
    if (file.size > 100000) throw Error('Choose a setup file smaller than 100 KB.');
    const next = CalculatorModel.decode(await file.text());
    Object.assign(state, next); bindLibrary(null); fillInputs(); persist(); toast('Setup opened.');
  } catch (error) { toast('Could not open setup: ' + error.message); }
  finally { event.target.value = ''; }
};
initializeDesign(); readWorkspace(); setupAppearance(); fillInputs(); initializeLibrary(); initializePages();
$('#save-copy').onclick=()=>{openLibraryTask('save',activeLibraryId);libraryTask.asCopy=true;$('#library-editor-title').textContent='Save a new copy';$('#library-editor-confirm').textContent='Save new copy';$('#library-save-copy').hidden=true;};

