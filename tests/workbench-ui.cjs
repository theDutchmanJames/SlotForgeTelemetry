const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const output=path.join(__dirname,'../test-results');fs.mkdirSync(output,{recursive:true});
app.setPath('userData',fs.mkdtempSync(path.join(output,'workbench-profile-')));app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,width:1440,height:1100,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false,backgroundThrottling:false,offscreen:true}}),errors=[];
 win.webContents.on('console-message',e=>{if(e.level==='error'){errors.push(e.message);console.error(e.message);}});
 const run=s=>win.webContents.executeJavaScript(s,true),pause=()=>new Promise(r=>setTimeout(r,180));
 const click=s=>run(`document.querySelector(${JSON.stringify(s)}).click()`);
 const set=(id,value)=>run(`(()=>{const e=document.getElementById(${JSON.stringify(id)});e.value=${JSON.stringify(value)};e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
 const place=(x,y)=>run(`(()=>{const e=document.querySelector('#ballast-stage'),r=e.getBoundingClientRect();e.dispatchEvent(new MouseEvent('click',{bubbles:true,clientX:r.left+${x}/687*r.width,clientY:r.top+${y}/376.4*r.height}));})()`);
 try{
  await win.loadFile(path.join(__dirname,'../renderer/index.html'));await pause();
  assert.equal(errors.length,0,'load errors');
  assert.equal(await run('document.querySelectorAll(".workbench-folder").length'),9);
  assert.match(await run(`document.querySelector('[data-folder=workshop] .folder-values').textContent`),/Tyre/);
  await click('#workbench-close');await run(`focusSetupInput('chassisGuideSpan')`);
  assert.equal(await run(`document.querySelector('[name=chassisGuideSpan]').closest('details.workbench-folder').open`),true);
  // Start with no dimensions, supports or position inputs: click, enter mass, save.
  await run(`state.setup={...CalculatorModel.blank(),name:'Drawing only'};fillInputs();`);
  await place(333.5,260.5);
  assert.equal(await run(`document.querySelectorAll('.ballast-pin.draft').length`),1);
  assert.equal(await run(`document.querySelector('#chassis-part').value`),'Ballast 1');
  assert.equal(await run(`document.querySelector('#ballast-advanced').open`),false);
  const dragDraft=async(fx,fy)=>{
   await run(`document.querySelector('#ballast-stage').scrollIntoView({block:'center'});`);await pause();
   const pos=await run(`(()=>{const p=document.querySelector('[data-ballast-draft]').getBoundingClientRect(),r=document.querySelector('#ballast-stage').getBoundingClientRect();return {x:Math.round(p.x+p.width/2+4),y:Math.round(p.y+p.height/2),tx:Math.round(r.x+r.width*${fx}+4),ty:Math.round(r.y+r.height*${fy})};})()`);
   win.webContents.sendInputEvent({type:'mouseMove',x:pos.x,y:pos.y});win.webContents.sendInputEvent({type:'mouseDown',button:'left',clickCount:1,x:pos.x,y:pos.y});
   win.webContents.sendInputEvent({type:'mouseMove',x:pos.tx,y:pos.ty});win.webContents.sendInputEvent({type:'mouseUp',button:'left',clickCount:1,x:pos.tx,y:pos.ty});await pause();
  };
  const originalX=await run(`document.querySelector('#chassis-part-x').value`);
  await dragDraft(.65,.3);assert.notEqual(await run(`document.querySelector('#chassis-part-x').value`),originalX);
  assert.equal(await run('JSON.parse(state.setup.chassisChanges).length'),0,'drag does not silently add a part');
  const firstX=await run(`document.querySelector('#chassis-part-x').value`);
  await dragDraft(.45,.7);assert.ok(+await run(`document.querySelector('#chassis-part-x').value`)<+firstX,'new point can be dragged repeatedly');
  assert.equal(await run(`document.querySelector('#ballast-advanced').open`),false,'no position typing needed');
  await set('chassis-part-mass','3');await click('#chassis-add-part');
  assert.equal(await run('JSON.parse(state.setup.chassisChanges)[0].space'),'drawing');
  assert.equal(await run('ChassisModel.calculate(state.setup).planned'),null);
  assert.match(await run('ChassisUI.results(state.setup,true)'),/Ballast 1/,'saved analysis includes drawing-only parts');
  await win.reload();await pause();assert.equal(await run(`document.querySelectorAll('[data-ballast-pin]').length`),1);
  await click('[data-edit-ballast="0"]');await place(456.75,113.5);await click('#chassis-add-part');
  assert.ok(+await run('JSON.parse(state.setup.chassisChanges)[0].y')>0);
  await run(`Object.assign(state.setup,${JSON.stringify(require('./chassis-fixtures.cjs'))},{chassisChanges:state.setup.chassisChanges});fillInputs();`);
  assert.ok(await run('ChassisModel.calculate(state.setup).planned.mass===83'));
  await run(`state.setup={...CalculatorModel.blank(),name:'Visual plan',...${JSON.stringify(require('./chassis-fixtures.cjs'))},chassisChanges:'[]'};fillInputs();persist();`);
  // Removing geometry during a draft move must not reinterpret its old millimetres as percentages.
  await place(333.5,260.5);await set('chassis-action','move');
  await run("state.setup.chassisGuideSpan='';fillInputs();");await place(400,200);
  assert.equal(await run("document.querySelector('#chassis-part-x').value"),'50');
  assert.equal(await run("document.querySelector('#chassis-part-toX').value"),'');
  assert.match(await run("document.querySelector('#ballast-map-status').textContent"),/Restore its dimensions/);
  await run("state.setup.chassisGuideSpan='100';fillInputs();");await click('#ballast-new');
  await set('chassis-part','Left ballast');await set('chassis-part-mass','3');await place(333.5,260.5);
  assert.equal(await run(`document.getElementById('chassis-part-x').value`),'50');
  assert.equal(await run(`document.getElementById('chassis-part-y').value`),'-15');
  assert.equal(await run('JSON.parse(state.setup.chassisChanges).length'),0,'clicks are drafts');
  await click('#chassis-add-part');
  assert.equal(await run('ChassisModel.calculate(state.setup).planned.mass'),83);
  assert.deepEqual(await run('ChassisModel.calculate(state.setup).planned.loads'),[21.5,31.5,30]);
  await click('[data-edit-ballast="0"]');await place(456.75,113.5);await click('#chassis-add-part');
  assert.deepEqual(await run('ChassisModel.calculate(state.setup).planned.loads'),[20.75,30.375,31.875]);
  assert.equal(await run('JSON.parse(state.setup.chassisChanges).length'),1);
  const previous=await run('state.setup.chassisChanges');
  await click('#ballast-references');await click('#ballast-mark');await place(90,188);
  assert.equal(await run('state.setup.chassisChanges'),previous,'calibration preserves millimetres');
  await click('#save-library');await run(`document.getElementById('library-entry-name').value='Visual plan'`);await click('#library-editor-confirm');
  assert.match(await run(`localStorage.getItem('slotforge.telemetry.library.v1')`),/chassisMap/);
  await win.reload();await pause();
  assert.equal(await run('JSON.parse(state.setup.chassisChanges).length'),1);
  assert.ok(Math.abs(await run('ChassisModel.mapReferences(state.setup.chassisMap).guide')-90)<1);
  await click('[data-edit-ballast="0"]');
  await run(`document.querySelector('[data-ballast-pin="0"]').dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));`);
  assert.equal(await run(`document.querySelector('#chassis-part-x').value`),'75.5');
  await run(`document.querySelector('[data-ballast-pin="0"]').dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));`);
  assert.equal(await run(`document.querySelector('#chassis-part-x').value`),'76');
  await click('#chassis-add-part');
  assert.equal(await run('JSON.parse(state.setup.chassisChanges)[0].x'),'76');
  // Native pointer drag: coordinates edit a draft, then Update part commits it.
  await run(`document.querySelector('#ballast-stage').scrollIntoView({block:'center'});`);await pause();
  const coords=await run(`(()=>{const a=document.querySelector('[data-ballast-pin="0"]').getBoundingClientRect(),b=document.querySelector('#ballast-stage').getBoundingClientRect();return {x:Math.round(a.x+a.width/2),y:Math.round(a.y+a.height/2),tx:Math.round(b.x+b.width*.5),ty:Math.round(b.y+b.height*.65)};})()`);
  win.webContents.sendInputEvent({type:'mouseMove',x:coords.x,y:coords.y});win.webContents.sendInputEvent({type:'mouseDown',button:'left',clickCount:1,x:coords.x,y:coords.y});
  win.webContents.sendInputEvent({type:'mouseMove',x:coords.tx,y:coords.ty});win.webContents.sendInputEvent({type:'mouseUp',button:'left',clickCount:1,x:coords.tx,y:coords.ty});await pause();
  assert.equal(await run('JSON.parse(state.setup.chassisChanges)[0].x'),'76');
  assert.ok(+await run(`document.querySelector('#chassis-part-x').value`)<60,'drag edits position');
  await click('#chassis-add-part');
  assert.ok(+await run('JSON.parse(state.setup.chassisChanges)[0].x')<60,'apply dragged position');
  assert.equal(await run(`document.querySelectorAll('.ballast-pin.draft').length`),0,'applied marker is not obscured by a draft');
  for(const width of [1440,760,390]){
   win.setSize(width,1100);await pause();
   for(const tone of ['light','dark']){
    await click('[data-tone-choice='+tone+']');await run(`document.querySelector('#ballast-planner').scrollIntoView({block:'start'});document.querySelector('#toast').hidden=true`);await pause();
    assert.equal(await run('document.documentElement.scrollWidth<=innerWidth'),true,'horizontal overflow '+width);
    fs.writeFileSync(path.join(output,`workbench-${width}-${tone}.png`),(await win.webContents.capturePage()).toPNG());
   }
  }
  await click('[data-remove-chassis="0"]');assert.equal(await run('JSON.parse(state.setup.chassisChanges).length'),0);
  assert.deepEqual(errors,[]);console.log('Workbench UI passed: folding, focus, click coordinates, draft/apply, measured loads, edit/remove, calibration, saving/reload, keyboard and light/dark responsive layouts.');win.destroy();app.quit();
 }catch(e){console.error(e);win.destroy();app.exit(1);}
});
