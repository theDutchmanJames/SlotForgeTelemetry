// GitHub Actions only: collect native builds into a draft for a final human review.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
async function main(){
  const {GITHUB_TOKEN:token,GITHUB_REPOSITORY:repo,GITHUB_SHA:sha}=process.env;
  if(!token||repo!=='theDutchmanJames/SlotForgeTelemetry'||!sha)throw Error('Expected this repository and a GitHub Actions commit/token.');
  const {version}=require('../package.json'),tag='v'+version;
  if(!/^\d+\.\d+\.\d+$/.test(version))throw Error('Release version must be major.minor.patch.');
  const names=[`SlotForgeTelemetry-${version}-windows-x64-Portable.exe`,`SlotForgeTelemetry-${version}-linux-x64.AppImage`,`SlotForgeTelemetry-${version}-linux-x64.deb`,`SlotForgeTelemetry-${version}-mac-universal.dmg`,`SlotForgeTelemetry-${version}-mac-universal.zip`];
  const dir=path.resolve(__dirname,'../release-assets');
  for(const name of names)if(!fs.existsSync(path.join(dir,name))||fs.statSync(path.join(dir,name)).size<1000000)throw Error('Missing or unexpectedly small package: '+name);
  const sums=names.map(name=>crypto.createHash('sha256').update(fs.readFileSync(path.join(dir,name))).digest('hex')+'  '+name).join('\n')+'\n';
  fs.writeFileSync(path.join(dir,'SHA256SUMS.txt'),sums);names.push('SHA256SUMS.txt');
  const base=`https://api.github.com/repos/${repo}`;
  async function api(url,method='GET',body){
    const r=await fetch(url.startsWith('https://')?url:base+url,{method,headers:{Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28',...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
    if(!r.ok)throw Error(`GitHub ${method} failed: ${r.status} ${await r.text()}`);
    return r.status===204?null:r.json();
  }
  const releases=await api('/releases?per_page=100');
  let release=releases.find(r=>r.tag_name===tag);
  if(release&&(!release.draft||release.target_commitish!==sha))throw Error('Refusing to replace a published release or one for another commit.');
  const notes=fs.readFileSync(path.resolve(__dirname,`../docs/releases/${tag}.md`),'utf8');
  if(!release)release=await api('/releases','POST',{tag_name:tag,target_commitish:sha,name:`SlotForge Telemetry ${version}`,body:notes,draft:true,prerelease:false});
  for(const name of names){
    const existing=release.assets.find(a=>a.name===name);
    if(existing)await api(`/releases/assets/${existing.id}`,'DELETE');
    const file=path.join(dir,name),upload=release.upload_url.split('{')[0]+'?name='+encodeURIComponent(name);
    const r=await fetch(upload,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/octet-stream','Content-Length':String(fs.statSync(file).size)},body:fs.createReadStream(file),duplex:'half'});
    if(!r.ok)throw Error(`Upload failed for ${name}: ${r.status}`);
    console.log('Uploaded '+name);
  }
  const verified=await api(`/releases/${release.id}`);
  for(const name of names)if(!verified.assets.some(a=>a.name===name&&a.state==='uploaded'&&a.size===fs.statSync(path.join(dir,name)).size))throw Error('Release asset verification failed: '+name);
  console.log('Draft ready: '+verified.html_url);
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
