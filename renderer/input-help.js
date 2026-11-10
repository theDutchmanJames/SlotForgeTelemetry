// Examples are descriptions, never values. Keep them visible after typing/loading.
const InputHelp=(()=>{
  const entries=[];
  function refresh(){
    for(const {field,help,status,example} of entries){
      const ids=new Set((field.getAttribute('aria-describedby')||'').split(/\s+/).filter(Boolean));
      ids.add(help.id);field.setAttribute('aria-describedby',[...ids].join(' '));
      if(status)status.textContent=field.value.trim()?'Your input is entered; the example is not used.':'Not entered — the example below is not used.';
      if(field.id==='manual-text'){
        const ms=document.getElementById('manual-unit').value==='milliseconds';
        const numbered=document.getElementById('manual-format').value==='numbered';
        document.getElementById('manual-format-help').textContent=(ms?'Enter whole milliseconds: 10235 means 10.235 seconds. ':'Seconds accept decimal dots or commas, or minutes:seconds. ')+(numbered?'Use lap number, then a tab or semicolon, then time. An optional Lap;Time header is accepted. Preserve missing laps with gaps in lap numbers. ':'Enter one time per line. ')+ 'Up to 10,000 laps per session. Changing format or units changes how your input is read; it does not convert existing values.';
        example.textContent=(ms?['10235','10187','62345']:['10.235','10.187','1:02.345']).map((v,i)=>(numbered?(i+1)+';':'')+v).join('\n');
      }
    }
  }
  function init(){
    for(const field of document.querySelectorAll('[data-input-example],[data-input-help]')){
      const help=document.createElement('span');help.className='input-help';help.id='input-help-'+(field.name||field.id);
      let status=null,example=null;
      if(field.hasAttribute('data-input-example')){
        status=document.createElement('small');status.className='input-data-status';help.append(status);
        const title=document.createElement('small');title.textContent='Example only';help.append(title);
        example=document.createElement('code');example.textContent=field.dataset.inputExample;help.append(example);
      }else help.textContent=field.dataset.inputHelp;
      field.after(help);entries.push({field,help,status,example});
    }
    document.addEventListener('input',refresh);document.addEventListener('change',refresh);refresh();
  }
  return {init,refresh};
})();
