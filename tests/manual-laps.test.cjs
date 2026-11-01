const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const model=require('../renderer/manual-laps-model.js'),race=require('../renderer/race-model.js'),insights=require('../renderer/race-insights.js'),{ManualLapsStore,validate}=require('../src/manual-laps-store.cjs');
const values=(extra={})=>({name:'Evening practice',car:'Porsche',track:'Club layout',driver:'James',source:'Notebook',notes:'',startedAt:'2026-11-01T12:00:00.000Z',type:'practice',lane:1,lengthM:20,sequenceConfirmed:false,technical:{},laps:model.parse('10.235\n10,200\n9.900\n9.850\n10.000\n9.700\n9.650\n9.600\n9.550\n9.500'),...extra});
function store(t){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'slotforge-manual-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));return new ManualLapsStore(path.join(dir,'manual.json'));}
test('manual parser handles explicit seconds, clocks, decimal commas, headers and millisecond columns',()=>{
 assert.deepEqual(model.parse('Time\r\n10.235\r\n1:02,345\n\n').map(l=>l.durationMs),[10235,62345]);
 assert.deepEqual(model.parse('Lap;Time\n1;10,235\n3;9.500',{format:'numbered'}).map(l=>l.number),[1,3]);
 assert.equal(model.parse('Lap number\tLap time\n1\t10235',{format:'numbered',unit:'milliseconds'})[0].durationMs,10235);
 assert.equal(model.duration('0.001'),1);assert.equal(model.duration('1440:00'),86400000);
});
test('manual parser rejects ambiguous or malformed input instead of skipping lines',()=>{
 for(const raw of ['','0','-1','1e3','10.1234','1:60','10,235,99','Infinity','86401'])assert.throws(()=>model.parse(raw));
 for(const raw of ['1;10\n1;11','2;10\n1;11','0;10','1,10.235','1;10;Valid'])assert.throws(()=>model.parse(raw,{format:'numbered'}));
 assert.throws(()=>model.parse('10\nnope\n11'),/Line 2/);assert.throws(()=>model.parse('1.5',{unit:'milliseconds'}));
 assert.throws(()=>model.parse(Array(10001).fill('1').join('\n')),/10,000/);assert.throws(()=>model.parse(Array(8).fill('86400').join('\n')),/seven days/);
});
test('optional manual specifications reject impossible numeric data and fractional teeth',()=>{
 for(const technical of [{pinion:'1.5'},{gear:'1000000'},{weight:'-2'},{ratedRpm:'Infinity'},{rearDiameter:'unknown'},{weight:'0'},{weight:'0x50'},{weight:'80.'}])assert.throws(()=>model.normalize(values({technical})));
 assert.equal(model.normalize(values({technical:{pinion:'11',gear:'33',weight:'82.5',ratedRpm:'2e4'}})).technical.ratedRpm,'2e4');
});
test('damaged manual library can recover a validated backup while preserving its original',t=>{
 const s=store(t);s.save({values:values()});const backup=JSON.stringify(s.data);fs.writeFileSync(s.file,'damaged-original');const broken=new ManualLapsStore(s.file);
 assert.throws(()=>broken.recoverBackup('invalid-json'));assert.equal(fs.readFileSync(s.file,'utf8'),'damaged-original');
 const persist=broken.persist;broken.persist=()=>{throw Error('Simulated write failure');};assert.throws(()=>broken.recoverBackup(backup),/Simulated/);assert.ok(broken.error);assert.equal(fs.readFileSync(s.file,'utf8'),'damaged-original');broken.persist=persist;
 const result=broken.recoverBackup(backup);assert.equal(result.error,'');assert.equal(result.data.sessions.length,1);assert.equal(fs.readFileSync(result.backup,'utf8'),'damaged-original');assert.equal(new ManualLapsStore(s.file).data.sessions.length,1);assert.throws(()=>broken.recoverBackup(backup),/readable/);
});
test('maximum manual session size retains exact statistics and bounded chart sampling',t=>{
 const s=store(t),laps=model.parse(Array.from({length:10000},(_,i)=>String(10+(i%5)/1000)).join('\n'));
 const run=model.runs(s.save({values:values({laps,sequenceConfirmed:true})}).data)[0],stats=race.statistics(run);
 assert.equal(stats.count,10000);assert.equal(stats.median,10002);assert.equal(stats.best,10000);assert.equal(stats.bestRun.mean,10002);assert.ok(race.chartPoints(run.laps,'',false).length<1000);assert.equal(race.stintAnalysis(run)[0].longest,10000);
});
test('manual persistence, optimistic updates and deletion survive restart without modifying Paddock',t=>{
 const s=store(t),paddock=path.join(path.dirname(s.file),'paddock-results-v1.json');fs.writeFileSync(paddock,'untouched');
 const a=s.save({values:values()}),r=a.data.sessions[0];assert.equal(r.revision,1);assert.equal(new ManualLapsStore(s.file).view().data.sessions.length,1);
 const updated=s.save({id:r.id,revision:1,values:values({notes:'Corrected'})});assert.equal(updated.data.sessions[0].revision,2);
 assert.throws(()=>s.save({id:r.id,revision:1,values:values()}),/changed/);assert.throws(()=>s.delete({id:r.id,revision:1}),/changed/);
 s.delete({id:r.id,revision:2});assert.equal(new ManualLapsStore(s.file).data.sessions.length,0);assert.equal(fs.readFileSync(paddock,'utf8'),'untouched');
});
test('manual backups merge atomically, remain repeatable after name remapping, and reject conflicting identities',t=>{
 const a=store(t),b=store(t);a.save({values:values()});b.save({values:values({name:'Another session'})});const backup=JSON.stringify(a.data);
 assert.equal(b.importBackup(backup).added,1);assert.equal(b.data.sessions[0].carId,b.data.sessions[1].carId);assert.equal(b.importBackup(backup).added,0);
 const changed=JSON.parse(backup);changed.sessions[0].revision++;const before=JSON.stringify(b.data);assert.throws(()=>b.importBackup(JSON.stringify(changed)),/different revision/);assert.equal(JSON.stringify(b.data),before);
 const malformed=structuredClone(b.data);malformed.sessions[1].values.car='Different car';malformed.sessions[1].contentHash=crypto.createHash('sha256').update(JSON.stringify(malformed.sessions[1].values)).digest('hex');assert.throws(()=>validate(malformed),/Conflicting/);
});
test('corruption and failed writes preserve existing evidence',t=>{
 const s=store(t);s.save({values:values()});const original=fs.readFileSync(s.file,'utf8');s.file=path.join(s.file,'not-a-directory');assert.throws(()=>s.save({values:values()}));assert.equal(s.data.sessions.length,1);
 const file=path.dirname(s.file);assert.equal(fs.readFileSync(file,'utf8'),original);fs.writeFileSync(file,'damaged');const broken=new ManualLapsStore(file);assert.ok(broken.error);assert.throws(()=>broken.save({values:values()}),/unreadable/);assert.equal(fs.readFileSync(file,'utf8'),'damaged');
});
test('manual analysis gates consecutive metrics, preserves exclusion flags, and separates sources',t=>{
 const s=store(t);let result=s.save({values:values()}),r=model.runs(result.data)[0];assert.equal(race.statistics(r).best,9500);assert.equal(race.statistics(r).bestRun,null);assert.equal(race.stintAnalysis(r)[0].pace,null);
 result=s.save({values:values({sequenceConfirmed:true,name:'Confirmed'})});r=model.runs(result.data).find(r=>r.sequenceConfirmed);assert.equal(race.statistics(r).bestRun.mean,9600);assert.ok(race.stintAnalysis(r)[0].pace);
 const v=values({sequenceConfirmed:true});v.laps[2].valid=false;v.laps[7].pit=true;const excluded=model.runs(s.save({values:v}).data).at(-1);assert.equal(race.statistics(excluded).count,8);assert.equal(race.statistics(excluded).bestRun,null);
 const imported={...r,hostId:'Paddock',sourceId:'Timing'};assert.equal(race.records([r,imported]).length,2);assert.equal(insights.compatible(r,imported),false);assert.match(insights.report(r,imported),/Manual entry/);assert.match(insights.report(r,imported),/not measured race timestamps/);
});
