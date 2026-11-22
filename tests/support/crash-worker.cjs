// Saves, backs up, restores or imports in a loop until it is killed (tests/crash.test.cjs).
// After every completed round it writes "ok <n>" to stdout with a synchronous write, so the test knows what was
// reported saved before the kill.
const fs=require('node:fs'),path=require('node:path');
const [mode,profile]=process.argv.slice(2);
const {DataFiles}=require('../../src/data-files.cjs'),{Backups}=require('../../src/backups.cjs');
const {ManualLapsStore}=require('../../src/manual-laps-store.cjs'),{GarageStore}=require('../../src/garage-store.cjs');
const L=require('../../renderer/library-model.js'),C=require('../../renderer/calculator-model.js'),N=require('../../renderer/run-notes-model.js');
const ack=n=>fs.writeSync(1,'ok '+n+'\n');
const lap=(i,n)=>({number:n+1,durationMs:9000+(i*37+n*11)%2000,valid:true,pit:false});
const session=i=>({name:'Run '+i,car:'Club GT',track:'Home',driver:'Alex',source:'Manual entry',notes:'x'.repeat(i%300),startedAt:new Date(Date.UTC(2026,0,1)+i*60000).toISOString(),type:'practice',lane:1,lengthM:20,sequenceConfirmed:true,technical:{pinion:'9',gear:'27',rearDiameter:'',weight:'',ratedRpm:''},laps:Array.from({length:20},(_,n)=>lap(i,n))});
const start=Number(fs.readFileSync(path.join(profile,'round.txt'),'utf8'));
if(mode==='saves'){
 const files=new DataFiles(profile),manual=new ManualLapsStore(path.join(profile,'manual-laps-v1.json')),garage=new GarageStore(path.join(profile,'garage-v1.json'));
 if(manual.error||garage.error)throw Error('A store did not open: '+(manual.error||garage.error));
 for(let i=start;;i++){
  const text=files.get('library');let list=text===null?[]:L.decode(text);
  list=L.save(list,{setup:{...C.EXAMPLE,name:'Setup '+i},notes:'notes '.repeat(i%50),now:new Date().toISOString(),newId:'s'+i});if(list.length>40)list=list.slice(0,40);
  files.set('library',L.encode(list));files.set('active','s'+i);
  files.set('runnotes',JSON.stringify(N.set(N.decode(files.get('runnotes')),'run-'+(i%25),{note:'note '+i})));
  manual.save({values:session(i)});if(manual.data.sessions.length>15){const old=manual.data.sessions[0];manual.delete({id:old.id,revision:old.revision});}
  garage.saveCar({name:'Car '+i,maker:'',notes:''});if(garage.data.cars.length>15){garage.remove('cars',garage.data.cars.find(c=>c.name!=='Car '+i).id);}
  ack(i);
 }
}
if(mode==='backups'){const b=new Backups(profile);for(let i=start;;i++){b.write(b.dir,'manual','manual');if(i%3===0)b.auto();ack(i);}}
if(mode==='restore'){
 const b=new Backups(profile),bundles=['a','b'].map(k=>b.read(fs.readFileSync(path.join(profile,'bundle-'+k+'.json'),'utf8')));
 for(let i=start;;i++){b.restore(bundles[i%2]);ack(i);}
}
if(mode==='import'){
 const manual=new ManualLapsStore(path.join(profile,'manual-laps-v1.json'));if(manual.error)throw Error(manual.error);
 const backup=fs.readFileSync(path.join(profile,'manual-export.json'),'utf8');
 for(let i=start;;i++){
  if(manual.data.sessions.length)for(const s of [...manual.data.sessions])manual.delete({id:s.id,revision:s.revision});
  manual.importBackup(backup);ack(i);
 }
}
