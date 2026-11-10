(function(root){
  'use strict';
  const H=typeof module==='object'&&module.exports?require('./chassis-model.js'):root.ChassisModel;
  const A=typeof module==='object'&&module.exports?require('./prediction-model.js'):root.PredictionModel;
  const defaults=()=>({chassisRunSnapshots:'[]'});
  function records(raw='[]'){
    if(typeof raw!=='string'||raw.length>40000)throw Error('Chassis run snapshots exceed 40,000 characters. Start a new test setup.');
    const rows=JSON.parse(raw);if(!Array.isArray(rows)||rows.length>20)throw Error('Use at most 20 chassis run snapshots per setup.');
    const seen=new Set();
    return rows.map(r=>{
      if(!r||r.version!==1||!Number.isInteger(r.row)||r.row<0||r.row>=50||typeof r.run!=='string'||r.run.length>6000||r.run.includes('\n')||r.run.includes('\r'))throw Error('Invalid chassis run snapshot.');
      if(typeof r.setupId!=='string'||!/^[-a-zA-Z0-9_]{1,80}$/.test(r.setupId)||typeof r.name!=='string'||!r.name.trim()||r.name.length>100||typeof r.capturedAt!=='string'||!Number.isFinite(Date.parse(r.capturedAt)))throw Error('Invalid chassis snapshot identity.');
      if(seen.has(r.row))throw Error('Multiple chassis snapshots refer to the same run row.');seen.add(r.row);
      if(!r.setup||typeof r.setup!=='object'||Array.isArray(r.setup))throw Error('Invalid captured setup.');
      for(const k of ['wheelbase','totalWeight'])if(r.setup[k]!==''&&r.setup[k]!=null)H.numeric(r.setup[k],0.001,k==='wheelbase'?1000:100000);
      if(r.prediction!=null&&(!r.prediction||typeof r.prediction!=='object'||Array.isArray(r.prediction)))throw Error('Invalid prediction evidence.');
      return {version:1,row:r.row,run:r.run,setupId:r.setupId,name:r.name,capturedAt:r.capturedAt,setup:H.snapshot(r.setup),...(r.prediction?{prediction:A.snapshot(r.prediction)}:{})};
    });
  }
  function clean(input){return {chassisRunSnapshots:JSON.stringify(records(input.chassisRunSnapshots??'[]'))};}
  function capture(input,{row,entry,now}){
    const lines=(input.experimentRows||'').split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
    if(!Number.isInteger(row)||row<0||row>=lines.length)throw Error('Choose an entered run to capture against.');
    const list=records(input.chassisRunSnapshots??'[]').filter(r=>r.row!==row);
    const item={version:1,row,run:lines[row],setupId:entry.id,name:entry.setup.name,capturedAt:now,setup:H.snapshot(entry.setup),prediction:A.snapshot(entry.setup)};
    const serialized=JSON.stringify([...list,item]);records(serialized);return serialized;
  }
  function attached(record,rows){const lines=(rows||'').split(/\r?\n/).map(s=>s.trim()).filter(Boolean);return lines[record.row]===record.run;}
  const api={defaults,records,clean,capture,attached};if(typeof module==='object'&&module.exports)module.exports=api;else root.ChassisTestModel=api;
})(globalThis);
