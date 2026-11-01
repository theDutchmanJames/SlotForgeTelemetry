// CI prepares a draft only. Publication is a separate, verified operation.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const repository='theDutchmanJames/SlotForgeTelemetry';
const version=require('../package.json').version,tag='v'+version;
const names=[`SlotForgeTelemetry-${version}-windows-x64-Portable.exe`,`SlotForgeTelemetry-${version}-linux-x64.AppImage`,`SlotForgeTelemetry-${version}-linux-x64.deb`,`SlotForgeTelemetry-${version}-mac-universal.dmg`,`SlotForgeTelemetry-${version}-mac-universal.zip`];
const base='https://api.github.com/repos/'+repository;
async function request(url,method='GET',body,raw=false){
  const response=await fetch(url,{method,headers:{Authorization:'Bearer '+process.env.GH_TOKEN,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28',...(body?{'Content-Type':raw?'application/octet-stream':'application/json'}:{})},...(body?{body:raw?body:JSON.stringify(body)}:{})});
  if(!response.ok)throw Error(`GitHub ${response.status}: ${await response.text()}`);
  return response.json();
}
async function main(){
  if(process.env.GITHUB_REPOSITORY!==repository||process.env.GITHUB_REF!=='refs/heads/main'||!process.env.GH_TOKEN||! /^[a-f0-9]{40}$/.test(process.env.GITHUB_SHA||''))throw Error('Expected authorized main-branch CI environment');
  const files=new Map();
  function scan(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory())scan(file);else if(names.includes(entry.name)){if(files.has(entry.name))throw Error('Duplicate asset '+entry.name);files.set(entry.name,file);}}}
  scan('release-assets');
  const sums=[];
  for(const name of names){const file=files.get(name);if(!file||fs.statSync(file).size===0)throw Error('Missing asset '+name);sums.push(crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')+'  '+name);}
  const sumPath='release-assets/SHA256SUMS.txt';fs.writeFileSync(sumPath,sums.join('\n')+'\n');files.set('SHA256SUMS.txt',sumPath);
  const existing=(await request(base+'/releases?per_page=100')).find(r=>r.tag_name===tag);
  if(existing&&(!existing.draft||existing.target_commitish!==process.env.GITHUB_SHA))throw Error('Release already exists for another state; refusing to overwrite');
  const release=existing||await request(base+'/releases','POST',{tag_name:tag,target_commitish:process.env.GITHUB_SHA,name:'SlotForge Telemetry '+version,body:fs.readFileSync(`docs/releases/${tag}.md`,'utf8'),draft:true,prerelease:false});
  for(const [name,file] of files){
    const prior=release.assets.find(a=>a.name===name);
    if(prior)throw Error('Draft already contains '+name+'; verify or remove incomplete draft before retrying');
    const asset=await request(`https://uploads.github.com/repos/${repository}/releases/${release.id}/assets?name=${encodeURIComponent(name)}`,'POST',fs.readFileSync(file),true);
    if(asset.state!=='uploaded'||asset.size!==fs.statSync(file).size)throw Error('Incomplete upload '+name);
    console.log('Uploaded '+name);
  }
  console.log('Draft prepared: '+release.html_url);
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
