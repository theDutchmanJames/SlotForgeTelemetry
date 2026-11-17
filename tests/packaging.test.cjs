const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),pkg=require('../package.json'),build=pkg.build;
const targets=value=>(Array.isArray(value)?value:[value]).map(t=>typeof t==='string'?t:t.target);
test('every desktop platform builds a portable app and an installer',()=>{
  // Windows: portable .exe + NSIS Setup.exe; macOS: ZIP + DMG; Linux: AppImage + DEB.
  assert.deepEqual(targets(build.win.target).sort(),['nsis','portable']);
  assert.deepEqual(targets(build.mac.target).sort(),['dmg','zip']);
  assert.deepEqual(targets(build.linux.target).sort(),['AppImage','deb']);
  assert.equal(pkg.scripts.dist,'electron-builder --win','dist must use the configured Windows targets, not override them');
});
test('Windows portable and installer filenames cannot collide',()=>{
  assert.match(build.portable.artifactName,/-Portable\.\$\{ext\}$/);
  assert.match(build.nsis.artifactName,/-Setup\.\$\{ext\}$/);
  assert.notEqual(build.portable.artifactName,build.nsis.artifactName);
});
test('Windows installer lets people choose, and uninstalling keeps saved data',()=>{
  assert.equal(build.nsis.oneClick,false);
  assert.equal(build.nsis.allowToChangeInstallationDirectory,true);
  assert.equal(build.nsis.perMachine,false);
  assert.equal(build.nsis.deleteAppDataOnUninstall,false);
});
test('local Windows builder checks for both outputs and uses CRLF',()=>{
  const text=fs.readFileSync(path.join(root,'build-windows.cmd'),'utf8');
  assert.ok(!/[^\r]\n/.test(text),'build-windows.cmd must use CRLF line endings');
  assert.match(text,/-Portable\.exe/);assert.match(text,/-Setup\.exe/);assert.match(text,/--publish never/);
});
