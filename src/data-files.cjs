'use strict';
// Plain files for the setup library, the active setup and the workbench draft, in Telemetry's profile.
// The renderer keeps all library rules; this only stores text, atomically, so it can be backed up and copied.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const FILES={library:'setups-library-v1.json',active:'setups-active-v1.txt',workspace:'workbench-draft-v1.json',runnotes:'run-notes-v1.json'};
const MAX_BYTES=4*1024*1024;
// Windows: antivirus or the search indexer can hold a file for a moment (EPERM, EBUSY, EACCES). Try the rename again
// a few times, briefly, before reporting the save as failed.
function renameRetry(from,to,tries=6){
 for(let i=0;;i++){try{fs.renameSync(from,to);return;}catch(e){if(i>=tries-1||!['EPERM','EBUSY','EACCES'].includes(e.code))throw e;const until=Date.now()+25*(i+1);while(Date.now()<until){/* short wait */}}}
}
function writeTemp(file,text){
 fs.mkdirSync(path.dirname(file),{recursive:true});const temp=file+'.'+crypto.randomUUID()+'.tmp';let fd;
 try{fd=fs.openSync(temp,'wx');fs.writeFileSync(fd,text);fs.fsyncSync(fd);fs.closeSync(fd);fd=undefined;return temp;}
 catch(e){if(fd!==undefined)fs.closeSync(fd);try{fs.unlinkSync(temp);}catch{}throw e;}
}
function atomicWrite(file,text){
 const temp=writeTemp(file,text);
 try{renameRetry(temp,file);}catch(e){try{fs.unlinkSync(temp);}catch{}throw e;}
}
class DataFiles{
 constructor(profile){this.profile=profile;}
 file(key){if(!Object.hasOwn(FILES,key))throw Error('Unknown data file.');return path.join(this.profile,FILES[key]);}
 get(key){const file=this.file(key);try{if(fs.statSync(file).size>MAX_BYTES)throw Error('Data file too large.');return fs.readFileSync(file,'utf8');}catch(e){if(e.code==='ENOENT')return null;throw e;}}
 set(key,text){if(typeof text!=='string'||Buffer.byteLength(text)>MAX_BYTES)throw Error('Could not save: the data exceeds 4 MiB.');try{atomicWrite(this.file(key),text);}catch(e){throw Error('Could not save to this computer. Nothing was changed. '+e.message);}return true;}
 remove(key){fs.rmSync(this.file(key),{force:true});return true;}
}
module.exports={DataFiles,FILES,atomicWrite,writeTemp,renameRetry,MAX_BYTES};
