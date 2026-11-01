// Render the same Paddock stopwatch and badge proportions used in the UI.
const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),assets=path.join(root,'assets');
app.setPath('userData',path.join(root,'test-results','icon-profile'));
app.disableHardwareAcceleration();
const source=fs.readFileSync(path.join(root,'renderer','paddock-icons.js'),'utf8');
const mark=vm.runInNewContext(source+';sfIcon("timer")')
  .replace('<svg ','<svg x="7.5" y="7.5" width="27" height="27" ')
  .replace('stroke="currentColor"','stroke="#fff"');
const accent=fs.readFileSync(path.join(root,'renderer','themes.css'),'utf8').match(/\[data-theme="dark"\][^}]*--accent:(#[a-f0-9]+)/i)[1];
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 42 42"><rect width="42" height="42" rx="10" fill="${accent}"/>${mark}</svg>\n`;
app.whenReady().then(async()=>{
  const win=new BrowserWindow({show:false,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false}});
  try{
    await win.loadURL('data:text/html,<html><body></body></html>');
    const sizes=[16,24,32,48,64,128,256],images=[];
    for(const size of [...sizes,1024]){
      const png=await win.webContents.executeJavaScript(`new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>{const canvas=document.createElement('canvas');canvas.width=canvas.height=${size};canvas.getContext('2d').drawImage(img,0,0,${size},${size});resolve(canvas.toDataURL('image/png').split(',')[1]);};img.onerror=()=>reject(Error('Icon render failed'));img.src=${JSON.stringify('data:image/svg+xml;base64,'+Buffer.from(svg).toString('base64'))};})`);
      const bytes=Buffer.from(png,'base64');
      if(size===1024)fs.writeFileSync(path.join(assets,'icon.png'),bytes);else images.push(bytes);
    }
    const header=Buffer.alloc(6+16*sizes.length);header.writeUInt16LE(1,2);header.writeUInt16LE(sizes.length,4);
    let offset=header.length;
    images.forEach((bytes,i)=>{const entry=6+i*16;header[entry]=header[entry+1]=sizes[i]===256?0:sizes[i];header.writeUInt16LE(1,entry+4);header.writeUInt16LE(32,entry+6);header.writeUInt32LE(bytes.length,entry+8);header.writeUInt32LE(offset,entry+12);offset+=bytes.length;});
    fs.writeFileSync(path.join(assets,'icon.svg'),svg);
    fs.writeFileSync(path.join(assets,'icon.ico'),Buffer.concat([header,...images]));
    console.log('Updated SVG, PNG and Windows ICO from the UI stopwatch (16–256 px).');app.exit(0);
  }catch(error){console.error(error);app.exit(1);}
});
