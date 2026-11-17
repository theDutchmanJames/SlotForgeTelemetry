const test=require('node:test'),assert=require('node:assert/strict');
const S=require('../renderer/setup-sheet.js'),C=require('../renderer/calculator-model.js');
const fixed={exportedAt:new Date('2026-11-16T12:00:00Z')};
test('setup sheet shows inputs, calculated results, nearby gearing and a track-notes area',()=>{
  const html=S.html({...C.EXAMPLE,totalWeight:'80'},{...fixed,notes:'Club night',savedAt:'2026-11-15T19:30:00Z'});
  assert.match(html,/^<!doctype html>/);assert.match(html,/Example · 21,500 RPM \/ 9:27/);
  assert.match(html,/<th>Pinion<\/th><td>9 teeth<\/td>/);assert.match(html,/21,500 RPM at 12 V/);
  assert.match(html,/Gear ratio<\/th><td>3:1/);assert.match(html,/No-load theoretical speed<\/th><td>27\.02 km\/h/);
  assert.match(html,/Nearby gearing/);assert.match(html,/class="current">20\.9/);assert.match(html,/At the track/);
  assert.match(html,/Club night/);assert.match(html,/Saved 15 Nov 2026/);
});
test('setup sheet escapes user text and never runs scripts',()=>{
  const html=S.html({...C.EXAMPLE,name:'<img src=x onerror=alert(1)>'},{...fixed,notes:'<script>alert(1)</script>'});
  assert.doesNotMatch(html,/<script>alert/);assert.doesNotMatch(html,/<img src=x/);assert.match(html,/default-src 'none'/);
});
test('blank setups produce a sheet without invented numbers or a gear chart',()=>{
  const html=S.html(C.blank(),fixed);
  assert.match(html,/Untitled setup/);assert.match(html,/Enter gearing, motor and tyre values/);assert.doesNotMatch(html,/Nearby gearing/);assert.doesNotMatch(html,/NaN|undefined|null/);
});
test('invalid setups are refused and file names are safe',()=>{
  assert.throws(()=>S.html({...C.EXAMPLE,pinion:'abc'},fixed));
  assert.equal(S.fileName({name:'Club GT · short/track'}),'Club-GT-short-track-setup-sheet.html');
  assert.equal(S.fileName({name:''}),'setup-setup-sheet.html');
});
