'use strict';
// A heavy example profile: hundreds of setups, imported races and lap sessions, garage cars and tracks, written
// straight into a Telemetry profile in each store's own format. Used by the speed check and the random-click run.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const SIZES={setups:200,races:300,manual:300,laps:40,cars:40,tracks:10};
function rand(seed){let s=seed;return ()=>((s=(s*16807)%2147483647)/2147483647);}
function seed(profile,SIZES=module.exports.SIZES){
 const C=require('../renderer/calculator-model.js'),L=require('../renderer/library-model.js'),M=require('../renderer/manual-laps-model.js');
 const {hash,checkCache}=require('../src/paddock-client.cjs'),{summaries}=require('../src/paddock-statistics.cjs');
 const day=i=>new Date(Date.UTC(2025,0,1)+i*86400000);
 // Setup library.
 const entries=Array.from({length:SIZES.setups},(_,i)=>({id:'setup-'+i,setup:{...C.EXAMPLE,name:'Club GT test '+i,pinion:String(8+i%5),gear:String(26+i%6)},notes:'Track notes '.repeat(25),createdAt:day(i).toISOString(),updatedAt:day(i).toISOString()}));
 fs.writeFileSync(path.join(profile,'setups-library-v1.json'),L.encode(entries));
 // Imported Paddock races.
 const fixture=require('../integration/paddock-telemetry-v1/fixtures/original-detail.json'),r=rand(7);
 const race=i=>{const d=structuredClone(fixture),p=d.payload,e=p.participants[0],id='race-'+i,start=day(i).toISOString();
  const times=Array.from({length:SIZES.laps},(_,n)=>Math.round((10+r()*0.4+(n%9===4?0.6:0))*1000)),total=times.reduce((a,b)=>a+b,0);let t=0;
  Object.assign(p,{sessionId:id,name:'Club night '+i,type:'practice',startedAt:start,endedAt:new Date(Date.parse(start)+total).toISOString(),notes:''});
  p.track.name='Club circuit';p.heats[0].endedAtMs=total;e.displayName='Club GT';e.drivers[0].name='Alex';e.stints[0].endedAtMs=total;e.configuration.capturedAt=start;
  e.laps=times.map((ms,n)=>({id:`${id}-lap-${n+1}`,stintId:'stint-1',number:n+1,durationMs:ms,endedAtMs:(t+=ms),valid:true,pit:false,recordEligible:true,countsForDistance:true,distanceM:20,reason:''}));
  Object.assign(p.standings[0],{classifiedLaps:times.length,classifiedElapsedMs:total,points:0});
  d.receipt.sessionId=id;d.receipt.contentHash=hash(p);d.receipt.summaries=summaries(p);return {payload:p,receipt:d.receipt};};
 const results={version:1,hosts:[{id:fixture.payload.participants[0].configuration?.databaseId||'paddock-perf',name:'Home collection',revision:SIZES.races,syncedAt:new Date().toISOString(),results:Array.from({length:SIZES.races},(_,i)=>race(i))}]};
 checkCache(results);fs.writeFileSync(path.join(profile,'paddock-results-v1.json'),JSON.stringify(results));
 // Manual and Track day lap sessions.
 const sha=v=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex'),ids={};const idFor=(k,n)=>ids[k+n]||(ids[k+n]=crypto.randomUUID());
 const sessions=Array.from({length:SIZES.manual},(_,i)=>{const car='Car '+(i%8),track='Track '+(i%4);
  const values=M.normalize({name:'Practice '+i,car,track,driver:'Alex',source:'Manual entry',notes:'',startedAt:day(i).toISOString(),type:'practice',lane:1+i%2,lengthM:20,sequenceConfirmed:true,technical:{pinion:'9',gear:'27',rearDiameter:'19.5',weight:'80',ratedRpm:'21500'},laps:Array.from({length:SIZES.laps},(_,n)=>({number:n+1,durationMs:Math.round((9.8+r()*0.5)*1000),valid:true,pit:false}))});
  return {id:'m-'+i,carId:idFor('car',car),trackId:idFor('track',track),revision:1,createdAt:day(i).toISOString(),updatedAt:day(i).toISOString(),contentHash:sha(values),values};});
 fs.writeFileSync(path.join(profile,'manual-laps-v1.json'),JSON.stringify({format:'slotforge-manual-laps',version:1,id:crypto.randomUUID(),sessions}));
 // Garage.
 const now=new Date().toISOString();
 fs.writeFileSync(path.join(profile,'garage-v1.json'),JSON.stringify({version:1,cars:Array.from({length:SIZES.cars},(_,i)=>({id:'car-'+i,createdAt:now,updatedAt:now,name:'Car '+i,maker:'Home build',raceClass:'GT',notes:''})),tracks:Array.from({length:SIZES.tracks},(_,i)=>({id:'track-'+i,createdAt:now,updatedAt:now,name:'Track '+i,lanes:[{lane:1,lengthM:20},{lane:2,lengthM:20.3}],notes:''}))}));
}

module.exports={seed,SIZES};
