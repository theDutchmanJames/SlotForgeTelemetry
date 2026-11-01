const test=require('node:test'),assert=require('node:assert/strict'),model=require('../renderer/race-model.js');
function run(id,extra={}){return {id,hostId:'h',hostName:'Host',sourceId:'s',sourceName:'Timing',carId:'c',car:'Car',trackId:'t',track:'Track',lane:1,type:'race',laneLengthM:20,startedAt:'2026-10-01T12:00:00.000Z',driver:'Alex',configuration:{technical:{gear:'27'},components:[]},laps:Array.from({length:5},(_,i)=>({id:id+i,stintId:'s',heatId:'h',number:i+1,endedAtMs:(i+1)*10000,durationMs:9000+i*100,valid:true,pit:false,recordEligible:true})),...extra};}
test('history groups never combine identities, lanes, session types or recorded lane lengths',()=>{
 const a=run('a'),b=run('b',{driver:'Someone else'});assert.equal(model.progressGroups([a,b]).length,1);
 for(const change of [{hostId:'other'},{sourceId:'other'},{carId:'other'},{trackId:'other'},{lane:2},{type:'practice'},{laneLengthM:21},{laneLengthM:null}])assert.equal(model.progressGroups([a,run('x',change)]).length,2);
});
test('drivers remain separate observations even for the same session and timestamp',()=>{
 const a=run('a',{sessionId:'same'}),b=run('b',{sessionId:'same',driver:'Alex',driverId:'another'}),entries=model.progressEntries([b,a]);
 assert.equal(entries.length,2);assert.deepEqual(entries.map(e=>e.run.id),['a','b']);assert.equal(entries[0].statistics.count,5);
});
test('history minimum counts included laps only, ordering uses race dates and metrics preserve missing values',()=>{
 const early=run('early'),late=run('late',{startedAt:'2026-11-01T12:00:00.000Z'}),short=run('short');short.laps[0].pit=true;
 early.laps.forEach(l=>l.recordEligible=false);
 assert.deepEqual(model.progressEntries([late,short,early]).map(e=>e.run.id),['early','late']);assert.equal(model.progressEntries([early])[0].statistics.best,null);
 assert.equal(model.progressEntries([short],1).length,1);assert.equal(model.progressEntries([run('one',{laps:short.laps.slice(1,2)})],1)[0].statistics.spread,null);
});
test('captured setup differences ignore signing metadata and component ordering but detect quantities and missing specifications',()=>{
 const a=run('a'),b=run('b');a.configuration.components=[{partId:'p',name:'Gear',quantity:1,field:'gear',position:'rear',assemblyId:null},{partId:'q',name:'Wheel',quantity:2,field:'rearWheels',position:'rear',assemblyId:null}];
 b.configuration={...structuredClone(a.configuration),capturedAt:'another time',signature:'different',revision:'changed'};b.configuration.components.reverse();
 assert.deepEqual(model.configurationChanges(a,b),{technical:[],componentsChanged:false});
 b.configuration.components[0].quantity=1;b.configuration.technical.gear='28';b.configuration.technical.weight='80';
 assert.deepEqual(model.configurationChanges(a,b),{technical:[{field:'gear',before:'27',after:'28'},{field:'weight',before:null,after:'80'}],componentsChanged:true});
});
test('new corrections and withdrawals replace or remove history through the imported evidence model',()=>{
 const normal=structuredClone(require('../integration/paddock-telemetry-v1/fixtures/original-detail.json')),corrected=structuredClone(require('../integration/paddock-telemetry-v1/fixtures/corrected-detail.json')),withdrawn=require('../integration/paddock-telemetry-v1/fixtures/withdrawn-detail.json');
 const entries=result=>model.progressEntries(model.runs({hosts:[{id:'paddock-demo',results:[result]}]}),1);
 assert.equal(entries(normal)[0].statistics.best,10000);assert.equal(entries(corrected)[0].statistics.best,11000);assert.equal(entries(withdrawn).length,0);
});
