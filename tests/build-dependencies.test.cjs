const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{pathToFileURL}=require('node:url');
function fixture(t){const root=fs.mkdtempSync(path.join(os.tmpdir(),'slotforge-build-check-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));const source=path.join(root,'source');fs.mkdirSync(path.join(source,'nested'),{recursive:true});fs.writeFileSync(path.join(source,'main.cjs'),'module.exports=42');fs.writeFileSync(path.join(source,'nested','module.node'),'synthetic binary');fs.writeFileSync(path.join(source,'nested','note.txt'),'note');fs.writeFileSync(path.join(source,'.hidden'),'hidden');return {root,source};}
test('patched build matcher retains recursive, brace, dotfile and exclusion matching',t=>{
 const {source}=fixture(t),{Minimatch,minimatch}=require('minimatch'),glob=require('glob');
 assert.equal(new Minimatch('renderer/**/*',{dot:true}).match('renderer/.hidden'),true);assert.equal(minimatch('nested/module.node','*.node',{matchBase:true}),true);
 assert.deepEqual(glob.sync('**/*.{cjs,txt}',{cwd:source,ignore:'**/note.txt'}),['main.cjs']);assert.ok(glob.sync('**/*',{cwd:source,dot:true}).includes('.hidden'));
 const {FileList}=require('filelist'),list=new FileList();list.include(path.join(source,'**','*.txt').replaceAll('\\','/'));assert.equal(list.toArray().length,1);
});
test('updated ASAR packs, extracts and preserves unpacked files and integrity headers',async t=>{
 const {root,source}=fixture(t),asar=await import('@electron/asar'),archive=path.join(root,'app.asar');
 await asar.createPackageWithOptions(source,archive,{unpack:'*.node'});
 assert.equal(asar.extractFile(archive,'main.cjs').toString(),'module.exports=42');assert.equal(asar.extractFile(archive,'nested/module.node').toString(),'synthetic binary');assert.equal(asar.statFile(archive,'nested/module.node').unpacked,true);assert.ok(asar.getRawHeader(archive).headerString);
 const extracted=path.join(root,'extracted');asar.extractAll(archive,extracted);assert.equal(fs.readFileSync(path.join(extracted,'.hidden'),'utf8'),'hidden');
});
test('universal builder preserves its platform guard and archive merge API',async t=>{
 const {root,source}=fixture(t),asar=await import('@electron/asar'),universal=await import('@electron/universal');assert.equal(typeof universal.makeUniversalApp,'function');
 // The public macOS builder rejects Windows before using POSIX archive paths.
 if(process.platform==='win32'){await assert.rejects(universal.makeUniversalApp({}),/only supported on darwin/);return;}
 const utils=await import(pathToFileURL(path.join(path.dirname(require.resolve('@electron/universal')),'asar-utils.js')).href),a=path.join(root,'x64.asar'),b=path.join(root,'arm64.asar'),output=path.join(root,'merged.asar');
 await asar.createPackage(source,a);await asar.createPackage(source,b);await utils.mergeASARs({x64AsarPath:a,arm64AsarPath:b,outputAsarPath:output});assert.equal(asar.extractFile(output,'main.cjs').toString(),'module.exports=42');
});
