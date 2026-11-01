// Read-only projection of reviewed Timing results. Uses existing race-director access.
const timing=require('./timing-integration.cjs');
const capability={version:1,index:'/v1/telemetry/results',permission:'timingResults'};
function handle(db,method,url,access,expected){
  if(!expected)throw timing.fault('DATABASE_REQUIRED','Pair with this Paddock database first.');
  if(expected!==db.id)throw timing.fault('DATABASE_MISMATCH','A different database is at this address.',409);
  if(!access.timingResults)throw timing.fault('TIMING_PERMISSION_REQUIRED','Use the Dealership password or the Timing credential to read race results.',403);
  if(method!=='GET')throw timing.fault('NOT_FOUND','This interface is read-only.',404);
  const revision=url.searchParams.get('revision');
  if(revision!==null&&revision!==String(db.revision))throw timing.fault('SNAPSHOT_CHANGED','Paddock changed during transfer. Refresh to try again.',409);
  const sessions=db.timing.sessions;
  if(url.pathname==='/v1/telemetry/results'){
    const raw=url.searchParams.get('offset')||'0',offset=Number(raw);
    if(!/^\d+$/.test(raw)||!Number.isSafeInteger(offset)||offset<0||offset>sessions.length||offset>0&&revision===null)throw timing.fault('INVALID_PAGE','Invalid result page.');
    const entries=sessions.slice(offset,offset+100).map(r=>({sourceId:r.payload.source.id,sessionId:r.payload.sessionId,revision:r.payload.revision,state:r.payload.state,contentHash:r.contentHash}));
    return {version:1,databaseId:db.id,databaseRevision:db.revision,name:db.settings.name,entries,nextOffset:offset+entries.length<sessions.length?offset+entries.length:null};
  }
  const match=url.pathname.match(/^\/v1\/telemetry\/results\/([a-zA-Z0-9_-]{1,100})\/([a-zA-Z0-9_-]{1,100})$/);
  if(match){
    if(revision===null)throw timing.fault('REVISION_REQUIRED','Read the result index before downloading a session.');
    const record=sessions.find(r=>r.payload.source.id===match[1]&&r.payload.sessionId===match[2]);
    if(!record)throw timing.fault('SESSION_NOT_FOUND','This session no longer exists.',404);
    // No database keys, ownership records, inventory, private notes or replica state.
    return {version:1,databaseId:db.id,databaseRevision:db.revision,payload:record.payload,receipt:timing.receipt(db,record)};
  }
  throw timing.fault('NOT_FOUND','Unknown result operation.',404);
}
module.exports={capability,handle};
