const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {GarageStore}=require('../src/garage-store.cjs'),{LocalHistoryClient}=require('../src/paddock-local.cjs'),{createHost}=require('./support/shared-history-host.cjs');
const temp=t=>{const dir=fs.mkdtempSync(path.join(os.tmpdir(),'telemetry-garage-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));return dir;};
test('local cars and tracks: create, edit, unique names, lanes, persistence',t=>{
 const dir=temp(t),file=path.join(dir,'garage.json'),g=new GarageStore(file);
 const car=g.saveCar({name:'Club GT',maker:'NSR'});assert.equal(car.data.cars[0].name,'Club GT');
 assert.throws(()=>g.saveCar({name:' club gt '}),/already exists/);assert.throws(()=>g.saveCar({name:'  '}),/Enter a car name/);
 g.saveCar({id:car.savedId,name:'Club GT 2',maker:'NSR'});assert.equal(g.data.cars.length,1);assert.equal(g.data.cars[0].name,'Club GT 2');
 const tr=g.saveTrack({name:'Home track',lanes:[{lane:2,lengthM:20.4},{lane:1,lengthM:20.1}]});assert.deepEqual(tr.data.tracks[0].lanes.map(l=>l.lane),[1,2]);
 for(const lanes of [[],[{lane:1,lengthM:1},{lane:1,lengthM:2}],[{lane:0,lengthM:1}],[{lane:1,lengthM:-2}]])assert.throws(()=>g.saveTrack({name:'Bad',lanes}));
 g.saveTrack({name:'No lengths',lanes:[{lane:1,lengthM:null}]});
 const again=new GarageStore(file);assert.equal(again.data.cars[0].name,'Club GT 2');assert.equal(again.data.tracks.length,2);
 again.remove('tracks',tr.savedId);assert.equal(new GarageStore(file).data.tracks.length,1);assert.throws(()=>again.remove('tracks','missing'));
});
test('an unreadable garage is kept untouched until it is reset',t=>{
 const dir=temp(t),file=path.join(dir,'garage.json');fs.writeFileSync(file,'{broken');
 const g=new GarageStore(file);assert.match(g.view().error,/could not be read/);assert.throws(()=>g.saveCar({name:'X'}));assert.equal(fs.readFileSync(file,'utf8'),'{broken');
 const r=g.reset();assert.equal(r.error,'');assert.equal(fs.readFileSync(r.backup,'utf8'),'{broken');g.saveCar({name:'X'});
});
test('Paddock cars arrive with their configuration and a verified photo; changes are incremental',async t=>{
 const dir=temp(t),h=await createHost();t.after(()=>h.close());
 const client=new LocalHistoryClient(path.join(dir,'shared.json'),{scanner:async()=>[{...h.descriptor(),key:'a'.repeat(64)+'.json'}]});t.after(()=>client.disconnect());
 await client.connect();await client.sync();
 const view=client.carsView();assert.equal(view.error,'');const cars=view.hosts[0].cars;
 assert.deepEqual(cars.map(c=>c.name),['Renamed example','Example prototype']);assert.equal(cars[0].technical.pinion,'9');assert.equal(cars[1].technical.motor,'25k');
 const uri=client.photo(cars[0].photo.hash);assert.match(uri,/^data:image\/png;base64,/);assert.equal(client.photo('f'.repeat(64)),null,'only photos the catalogue uses');
 const profiles=()=>h.s.requests.filter(r=>r.endsWith('/profile')).length,before=profiles();
 await client.sync();assert.equal(profiles(),before,'unchanged cars are not fetched again');
 h.s.cars.invalid=['car-b'];h.s.cars.technical['car-b']={motor:'27k'};await client.sync();
 assert.equal(profiles(),before+1);assert.equal(client.carsView().hosts[0].cars[1].technical.motor,'27k');
 // A tampered photo is refused and does not stop the races importing.
 h.s.cars.list=h.s.cars.list.map(c=>c.media?{...c,revision:9,media:{...c.media,hash:'e'.repeat(64),url:`/v1/scalable/cars/${c.id}/media/${'e'.repeat(64)}`}}:c);
 const r=await client.sync();assert.equal(r.skipped,0);assert.match(client.carsView().error,/fingerprint/);
 // The cache survives a restart.
 const again=new LocalHistoryClient(path.join(dir,'shared.json'));assert.equal(again.carsView().hosts[0].cars.length,2);
});
