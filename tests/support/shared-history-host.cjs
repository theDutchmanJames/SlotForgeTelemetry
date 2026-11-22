// A stand-in for Paddock's trusted-local shared-history API, serving Paddock's own contract fixtures
// with real content hashes. Used by model and desktop tests; tests/paddock-local-interop.test.cjs
// covers the real Paddock implementation.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto');
const {hash}=require('../../src/paddock-local.cjs');
const fixtures=path.join(__dirname,'../../integration/paddock-shared-history-v1/fixtures'),read=n=>JSON.parse(fs.readFileSync(path.join(fixtures,n+'.json')));
const DB='paddock-demo';
function sessionsFromFixtures(){
 const th=read('timing-head'),tl=read('timing-laps'),payload=structuredClone(th.body.payload);payload.participants[0].laps=tl.laps;
 return [
  {format:'timing-v1',sourceId:payload.source.id,sessionId:payload.sessionId,state:'active',revision:1,full:payload},
  {format:'history-v1',sourceId:'timing-demo',sessionId:'session-class-race',state:'active',revision:1,full:read('history-create').bundle}
 ];
}
async function createHost({sessions=sessionsFromFixtures(),pageSize=1,lapPageSize=2}={}){
 // Car catalogue: Paddock's scalable-v1 fixtures. car-a has a photo; car-b does not.
 const listed=read('scalable-car-with-media').cars,profile=read('scalable-profile').profile,media=read('scalable-media');
 const cars={version:1,list:listed,technical:{'car-a':profile.configuration.technical,'car-b':{motor:'25k',pinion:'10',gear:'28'}},photo:Buffer.from(media.data,'base64'),sequence:1,invalid:[]};
 const s={cars,sessions,sequence:1,token:crypto.randomBytes(32).toString('base64url'),instanceId:'instance-1',requests:[],hook:null,tamper:null,recoveryId:'recovery-1'};
 const snapshot=()=>'snap-'+s.sequence;
 const accepted=x=>({revision:x.revision,contentHash:x.state==='withdrawn'?hash({withdrawn:x.sessionId,revision:x.revision}):hash(x.full),state:x.state});
 const token=x=>crypto.createHash('sha256').update(JSON.stringify([DB,s.recoveryId,x.sourceId,x.sessionId,accepted(x).contentHash])).digest('hex');
 const participants=x=>x.format==='timing-v1'?x.full.participants:x.full.race.participants;
 const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url,'http://127.0.0.1');s.requests.push(url.pathname+url.search);
  const send=(status,value)=>{res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(value));};
  if(req.headers.origin!==undefined)return send(403,{code:'BROWSER_ORIGIN_FORBIDDEN',error:'Browser access is not supported.'});
  if(req.headers.authorization!=='Bearer '+s.token)return send(401,{code:'UNAUTHENTICATED',error:'Incorrect credential.'});
  if(req.headers['x-slotforge-instance']!==s.instanceId)return send(409,{code:'INSTANCE_CHANGED',error:'Rediscover.'});
  // A network cut halfway through a response (Wi-Fi dropped, Paddock closed): headers, part of the body, then nothing.
  if(s.cut?.(url)){res.writeHead(200,{'Content-Type':'application/json','Content-Length':'100000'});res.write('{"version":1,"databaseId":');setTimeout(()=>res.destroy(),30);return;}
  if(url.pathname==='/v1/status'){const st=read('history-status');return send(200,{protocol:2,id:DB,revision:1,name:'Home collection',localInstanceId:s.instanceId,permissions:{browse:true,submit:false,timingResults:true,localImport:true},capabilities:{...(req.headers['x-slotforge-extensions']==='shared-history-v1'?{sharedHistory:{...st.capability,formats:['timing-v1','history-v1']}}:{}),telemetry:{version:1}}});}
  if(req.headers['x-slotforge-database']!==DB)return send(409,{code:'DATABASE_MISMATCH',error:'Wrong database.'});
  if(s.hook)await s.hook(url);
  if(url.pathname==='/v1/scalable/cars'){
   const offset=Number(url.searchParams.get('offset')||0),snap='cars-'+cars.sequence;if(url.searchParams.get('snapshot')&&url.searchParams.get('snapshot')!==snap)return send(409,{code:'SNAPSHOT_CHANGED',error:'Restart listing.'});
   return send(200,{version:1,databaseId:DB,snapshot:snap,cursor:snap,cars:cars.list.slice(offset,offset+1),nextOffset:offset+1<cars.list.length?offset+1:null});
  }
  if(url.pathname==='/v1/scalable/changes'){const entries=cars.invalid.map(id=>({carId:id,operation:'invalidate'}));cars.invalid=[];return send(200,{version:1,databaseId:DB,kind:'cars',resetRequired:false,reason:null,cursor:'cars-'+cars.sequence,entries,more:false});}
  const car=url.pathname.match(/^\/v1\/scalable\/cars\/([\w-]+)\/(profile|media\/([a-f0-9]{64}))$/);
  if(car){
   const meta=cars.list.find(c=>c.id===car[1]);if(!meta)return send(404,{code:'CAR_NOT_FOUND',error:'No car.'});
   if(car[2]==='profile')return send(200,{version:1,profile:{integrationVersion:1,databaseId:DB,databaseRevision:1,car:{...meta,picture:''},configuration:{databaseId:DB,carId:meta.id,kind:'current',technical:cars.technical[meta.id],components:[]}},media:meta.media});
   // Two chunks, so reassembly is exercised.
   const offset=Number(url.searchParams.get('offset')||0),half=60,part=offset===0?cars.photo.subarray(0,half):cars.photo.subarray(half);
   return send(200,{version:1,databaseId:DB,hash:car[3],offset,size:cars.photo.length,data:part.toString('base64'),nextOffset:offset===0?half:null});
  }
  if(url.pathname==='/v1/shared-history/status')return send(200,{version:1,databaseId:DB,recoveryId:s.recoveryId,capability:{},cursor:snapshot()});
  if(url.pathname==='/v1/shared-history/sessions'){
   let offset=0;const page=url.searchParams.get('page');
   if(page){const v=JSON.parse(Buffer.from(page,'base64url'));if(v.snapshot!==snapshot())return send(409,{code:'SNAPSHOT_CHANGED',error:'History changed; restart this listing.'});offset=v.offset;}
   const slice=s.sessions.slice(offset,offset+pageSize),more=offset+pageSize<s.sessions.length;
   return send(200,{version:1,databaseId:DB,recoveryId:s.recoveryId,snapshot:snapshot(),cursor:snapshot(),entries:slice.map(x=>({sourceId:x.sourceId,sessionId:x.sessionId,accepted:accepted(x),name:'n',startedAt:null,trackId:null,trackName:'',carIds:[],resultToken:token(x),format:x.format,provenance:'measured'})),nextPage:more?Buffer.from(JSON.stringify({snapshot:snapshot(),offset:offset+pageSize})).toString('base64url'):null});
  }
  const m=url.pathname.match(/^\/v1\/shared-history\/sessions\/([\w-]+)\/([\w-]+)(?:\/laps\/([\w-]+))?$/),x=m&&s.sessions.find(v=>v.sourceId===m[1]&&v.sessionId===m[2]);
  if(!x)return send(404,{code:'SESSION_NOT_FOUND',error:'No session.'});
  if(!m[3]){
   const stripped=structuredClone(x.full);for(const p of (x.format==='timing-v1'?stripped.participants:stripped.race.participants))delete p.laps;
   return send(200,{version:1,databaseId:DB,recoveryId:s.recoveryId,sourceId:x.sourceId,sessionId:x.sessionId,accepted:accepted(x),resultToken:token(x),body:x.state!=='active'?null:x.format==='timing-v1'?{format:'timing-v1',payload:stripped}:stripped,lapCounts:participants(x).filter(p=>p.laps.length).map(p=>({participantId:p.id,count:p.laps.length}))});
  }
  if(url.searchParams.get('token')!==token(x))return send(409,{code:'RESULT_CHANGED',error:'Discard partial pages.'});
  const p=participants(x).find(v=>v.id===m[3]),offset=Number(url.searchParams.get('offset')||0);let laps=p.laps.slice(offset,offset+lapPageSize);
  if(s.tamper)laps=s.tamper(x,laps);
  return send(200,{version:1,databaseId:DB,recoveryId:s.recoveryId,sourceId:x.sourceId,sessionId:x.sessionId,participantId:p.id,resultToken:token(x),format:x.format,offset,total:p.laps.length,nextOffset:offset+lapPageSize<p.laps.length?offset+lapPageSize:null,laps});
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const descriptor=()=>({format:'slotforge-local-library',version:1,instanceId:s.instanceId,pid:1,address:'http://127.0.0.1:'+server.address().port,token:s.token,databaseId:DB,name:'Home collection'});
 return {s,server,descriptor,close(){server.closeAllConnections();server.close();}};
}
module.exports={createHost,sessionsFromFixtures,read,DB};
