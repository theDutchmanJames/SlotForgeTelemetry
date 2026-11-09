(function(root) {
  const P = typeof module === 'object' && module.exports ? require('./performance-model.js') : root.PerformanceModel;
  const T = typeof module === 'object' && module.exports ? require('./telemetry-model.js') : root.TelemetryModel;
  const M = typeof module === 'object' && module.exports ? require('./magnetic-model.js') : root.MagneticModel;
  const W = typeof module === 'object' && module.exports ? require('./workshop-model.js') : root.WorkshopModel;
  const EXAMPLE = { name: 'Example · 21,500 RPM / 9:27', pinion: '9', gear: '27', ratedRpm: '21500', ratedVoltage: '12', motorTorque: '285', torqueVoltage: '12', torqueType: 'Stall', motorType: 'Brushed DC', rearDiameter: '20', tyreMode: 'diameter', rimDiameter: '16', tyreThickness: '2' };
  Object.assign(EXAMPLE, T.defaults(), M.defaults(), W.defaults());
  const blank = () => ({ ...P.blank(), ...T.defaults(), ...M.defaults(), ...W.defaults(), name: '', pinion: '', gear: '', tyreMode: 'diameter', rimDiameter: '', tyreThickness: '' });
  function diameter(input) {
    if (input.tyreMode !== 'rim') return P.positive(input.rearDiameter, 1000);
    const rim = P.positive(input.rimDiameter, 1000), thickness = P.positive(input.tyreThickness, 500);
    const value = rim !== null && thickness !== null ? rim + 2 * thickness : null;
    return value !== null && value <= 1000 ? value : null;
  }
  function inputOf(setup) {
    const d = diameter(setup);
    return { ...setup, rearDiameter: d === null ? '' : String(d) };
  }
  function cleanSetup(data) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw Error('This setup is not valid.');
    const out = { ...blank(), ...P.baseline({ ...P.blank(), ...data }), ...T.clean(data), ...M.clean(data), ...W.clean(data) };
    if (typeof data.name !== 'string' || data.name.length > 100) throw Error('Setup name must be at most 100 characters.');
    out.name = data.name;
    if (!['diameter', 'rim'].includes(data.tyreMode)) throw Error('Choose a tyre measurement method.');
    out.tyreMode = data.tyreMode;
    for (const [key, max] of [['rimDiameter', 1000], ['tyreThickness', 500]]) {
      const value = data[key] ?? '';
      if (typeof value !== 'string' || value.length > 32 || (value !== '' && P.positive(value, max) === null)) throw Error('Enter a positive number for ' + (key === 'rimDiameter' ? 'rim diameter.' : 'tyre thickness.'));
      out[key] = value === '' ? '' : String(P.positive(value, max));
    }
    if (out.tyreMode === 'rim' && out.rimDiameter && out.tyreThickness && diameter(out) === null) throw Error('Overall tyre diameter must be at most 1,000 mm.');
    const workshopInput=inputOf(out);
    for(const key of Object.keys(W.tools)){const result=W.calculate(workshopInput,key);if(result.error)throw Error(W.tools[key].title+': '+result.error);}
    return out;
  }
  function decode(text) {
    if (typeof text !== 'string' || text.length > 100000) throw Error('Choose a SlotForge Calculator setup file smaller than 100 KB.');
    const data = JSON.parse(text);
    if (data?.format !== 'slotforge-calculator' || data.version !== 1) throw Error('This is not a supported SlotForge Calculator setup file.');
    return { setup: cleanSetup(data.setup), reference: data.reference == null ? null : P.baseline(data.reference) };
  }
  function encode(setup, reference) {
    return JSON.stringify({ format: 'slotforge-calculator', version: 1, setup: cleanSetup(setup), reference: reference == null ? null : P.baseline(reference) }, null, 2);
  }
  const api = { EXAMPLE, blank, diameter, inputOf, cleanSetup, decode, encode };
  if (typeof module === 'object' && module.exports) module.exports = api; else root.CalculatorModel = api;
})(globalThis);
