// Your note and tag on a run, kept apart from the run itself: imported Paddock races stay exactly as they were imported.
// Stored as run-notes-v1.json in Telemetry's profile and included in backups.
(function(root){
 const MAX_NOTE=2000,MAX_RUNS=20000,TAGS=['practice','test','club','qualifying','race','endurance'];
 function empty(){return {version:1,runs:{}};}
 function clean(entry){
  if(!entry||typeof entry!=='object')throw Error('Invalid run note.');
  const note=typeof entry.note==='string'?entry.note.slice(0,MAX_NOTE):'';const tag=TAGS.includes(entry.tag)?entry.tag:'';
  return note.trim()||tag?{...(note.trim()?{note}:{}),...(tag?{tag}:{})}:null;
 }
 function decode(text){
  if(text===null||text===undefined||text==='')return empty();
  const data=JSON.parse(text);
  if(!data||data.version!==1||!data.runs||typeof data.runs!=='object'||Array.isArray(data.runs))throw Error('Unsupported run notes file.');
  const runs={};let n=0;
  for(const [id,entry] of Object.entries(data.runs)){if(typeof id!=='string'||id.length>2000)throw Error('Invalid run in the notes file.');const c=clean(entry);if(c){runs[id]=c;if(++n>MAX_RUNS)throw Error('Too many run notes.');}}
  return {version:1,runs};
 }
 function set(data,id,changes){
  const next={version:1,runs:{...data.runs}};const c=clean({...(next.runs[id]||{}),...changes});
  if(c)next.runs[id]=c;else delete next.runs[id];return next;
 }
 const api={decode,set,empty,TAGS,MAX_NOTE};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.RunNotesModel=api;
})(typeof globalThis!=='undefined'?globalThis:this);
