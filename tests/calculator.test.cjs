const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../renderer/calculator-model.js');
const P = require('../renderer/performance-model.js');
test('rim and radial tyre thickness reproduce the measured outside diameter', () => {
  const rim = { ...C.EXAMPLE, tyreMode: 'rim', rearDiameter: '99' };
  assert.equal(C.diameter(rim), 20);
  assert.deepEqual(P.calculate(C.inputOf(rim)), P.calculate(C.EXAMPLE));
  for (const changes of [{ rimDiameter: '' }, { tyreThickness: '' }, { tyreThickness: '-1' }, { rimDiameter: '999', tyreThickness: '2' }]) {
    assert.equal(C.diameter({ ...rim, ...changes }), null);
    assert.equal(P.calculate(C.inputOf({ ...rim, ...changes })).speedKmh, null);
  }
});
test('setup and comparison round trip without dependence on Paddock', () => {
  const reference = P.baseline(C.inputOf(C.EXAMPLE));
  const setup = { ...C.EXAMPLE, pinion: '10', name: 'My club setup' };
  assert.deepEqual(C.decode(C.encode(setup, reference)), { setup, reference });
  assert.deepEqual(C.decode(C.encode(C.blank(), null)), { setup: C.blank(), reference: null });
});
test('malformed files and invalid specifications are rejected before replacing a setup', () => {
  for (const text of ['{', '{}', 'null', '[]', JSON.stringify({ format: 'slotforge-calculator', version: 2 }), ' '.repeat(100001)]) assert.throws(() => C.decode(text));
  for (const changes of [{ pinion: '0' }, { gear: '2.5' }, { ratedRpm: '-1' }, { motorType: 'Turbo' }, { tyreMode: 'guess' }, { name: 'x'.repeat(101) }, { rimDiameter: [] }, { tyreThickness: 'Infinity' }]) assert.throws(() => C.encode({ ...C.EXAMPLE, ...changes }, null));
  assert.throws(() => C.encode(C.EXAMPLE, { ...C.EXAMPLE, pinion: '0' }));
});
test('file parsing discards unexpected properties', () => {
  const parsed = C.decode(JSON.stringify({ format: 'slotforge-calculator', version: 1, setup: { ...C.EXAMPLE, unexpected: 'ignored' } }));
  assert.equal(parsed.setup.unexpected, undefined);
});
