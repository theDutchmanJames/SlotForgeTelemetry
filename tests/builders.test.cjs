const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const shell=process.env.SLOTFORGE_TEST_BASH||(process.platform==='win32'?null:'/bin/bash');
const options={skip:!shell&&'Set SLOTFORGE_TEST_BASH to run shell workflows on Windows.'};
function fixture(){
  const base=path.join(root,'test-results');fs.mkdirSync(base,{recursive:true});
  const dir=fs.mkdtempSync(path.join(base,'builder-'));
  fs.mkdirSync(path.join(dir,'scripts'));fs.mkdirSync(path.join(dir,'assets'));
  fs.copyFileSync(path.join(root,'scripts/platform-build.sh'),path.join(dir,'scripts/platform-build.sh'));
  fs.writeFileSync(path.join(dir,'assets/icon.png'),'test icon');
  fs.writeFileSync(path.join(dir,'mock.sh'),`#!/usr/bin/env bash
uname(){ printf '%s\\n' "$TEST_OS"; }
id(){ printf '1000\\n'; }
chmod(){ return 0; } # File-mode changes are checked only on a native host.
node(){ case "$*" in *process.arch*) printf 'x64\\n';; *package.json*) printf '0.6.2\\n';; *) return 0;; esac; }
npm(){
  printf '%s\\n' "$*" >> calls.log
  [ "$*" != "$TEST_FAIL" ] || return 17
  case "$*" in
    'run dist:linux -- --publish never') mkdir -p dist/linux; printf app > dist/linux/SlotForgeTelemetry-0.6.2-linux-x64.AppImage; printf deb > dist/linux/SlotForgeTelemetry-0.6.2-linux-x64.deb;;
    'run dist:mac -- --publish never') mkdir -p 'dist/mac/mac-universal/SlotForge Telemetry.app'; printf dmg > dist/mac/SlotForgeTelemetry-0.6.2-mac-universal.dmg; printf zip > dist/mac/SlotForgeTelemetry-0.6.2-mac-universal.zip;;
  esac
}
export XDG_DATA_HOME="$PWD/install-root"
source scripts/platform-build.sh "$@"
`);
  return dir;
}
function run(dir,args,os='Linux',fail=''){
  return spawnSync(shell,['mock.sh',...args,'--no-pause'],{cwd:dir,encoding:'utf8',env:{...process.env,TEST_OS:os,TEST_FAIL:fail}});
}
test('Unix builders parse and document their options',options,()=>{
  for(const file of ['build-linux.sh','build-linux-quick.sh','build-mac.command','build-mac-quick.command','scripts/platform-build.sh']){
    assert.ok(!fs.readFileSync(path.join(root,file),'utf8').includes('\r'),file+' must use LF');
    const p=spawnSync(shell,['-n',file],{cwd:root,encoding:'utf8'});assert.equal(p.status,0,p.stderr);
  }
  const p=run(fixture(),['linux','--help']);assert.equal(p.status,0,p.stderr);assert.match(p.stdout,/--uninstall/);
});
test('normal native-host workflows check before packaging both outputs',options,()=>{
  for(const [platform,os] of [['linux','Linux'],['mac','Darwin']]){
    const dir=fixture(),p=run(dir,[platform,'--no-install'],os);assert.equal(p.status,0,p.stderr);
    assert.deepEqual(fs.readFileSync(path.join(dir,'calls.log'),'utf8').trim().split('\n'),['ci --include=dev','run check','test',`run dist:${platform} -- --publish never`]);
    assert.match(p.stdout,/Build complete/);
  }
});
test('quick builds skip checks; failed checks and wrong hosts never package',options,()=>{
  const dir=fixture(),quick=run(dir,['linux','--quick','--no-install']);assert.equal(quick.status,0,quick.stderr);
  assert.equal(fs.readFileSync(path.join(dir,'calls.log'),'utf8').trim(),'run dist:linux -- --publish never');
  const failedDir=fixture(),failed=run(failedDir,['linux','--no-install'],'Linux','test');assert.notEqual(failed.status,0);assert.doesNotMatch(fs.readFileSync(path.join(failedDir,'calls.log'),'utf8'),/dist:linux/);
  assert.notEqual(run(fixture(),['mac','--no-install'],'Linux').status,0);
  assert.notEqual(run(fixture(),['linux','--unknown']).status,0);
});
test('Linux install/uninstall stays in its app-specific directory',options,()=>{
  const dir=fixture(),data=path.join(dir,'install-root');fs.mkdirSync(data);
  fs.writeFileSync(path.join(data,'keep-me'),'unrelated data');
  const installed=run(dir,['linux','--install']);assert.equal(installed.status,0,installed.stderr);
  const desktop=fs.readFileSync(path.join(data,'applications/slotforge-telemetry.desktop'),'utf8');
  assert.match(desktop,/APPIMAGE_EXTRACT_AND_RUN=1/);assert.doesNotMatch(desktop,/--no-sandbox/);
  assert.ok(fs.existsSync(path.join(data,'slotforge-telemetry/SlotForgeTelemetry.AppImage')));
  const removed=run(dir,['linux','--uninstall']);assert.equal(removed.status,0,removed.stderr);
  assert.ok(!fs.existsSync(path.join(data,'applications/slotforge-telemetry.desktop')));
  assert.equal(fs.readFileSync(path.join(data,'keep-me'),'utf8'),'unrelated data');
});
