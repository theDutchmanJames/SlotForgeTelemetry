// Settings in the SlotForge Restyle look: a side list of the sections (Paddock Rail) with a one-line status under
// each name, and every section as a Settings Sheet: a head, then groups of slim two-half rows (name and one line
// left, the control right). The modules keep their own ids and handlers; this file only lays them out.
const SettingsUI=(()=>{
  const GROUPS=[['Workbench',['appearance','units','calculations']],['Data and connections',['paddock','backups','updates']]];
  const INFO={
    appearance:['palette','How Telemetry looks'],units:['calipers','How values are shown and entered'],calculations:['list','What each number means'],
    paddock:['transfer','Import races and cars'],backups:['history','Copies of all your data'],updates:['download','New versions']
  };
  const statuses={};
  const keyOf=link=>link.hash.split('/')[1]||'appearance';
  // Markup helpers for the modules' own section strings.
  const head=(key,title,lead)=>`<header class="ss-head"><span class="ss-tile">${sfIcon(INFO[key][0])}</span><div><h2>${title}</h2><p>${lead}</p></div></header>`;
  const group=title=>`<h3 class="ss-gh">${title}</h3>`;
  const row=(title,desc,control,attrs='')=>`<div class="ss-row"${attrs?' '+attrs:''}><div class="ss-t"><b>${title}</b>${desc?`<span class="ss-desc">${desc}</span>`:''}</div><div class="ss-c">${control||''}</div></div>`;
  function status(key,text){statuses[key]=text;const s=document.querySelector(`.settings-nav [data-rail-status="${key}"]`);if(s&&s.textContent!==text)s.textContent=text;}
  function refresh(){
    const theme=document.documentElement.dataset.theme,label=(typeof Theme!=='undefined'?Theme.THEMES:[]).find(([k])=>k===theme)?.[1];
    if(label)status('appearance',label);
    if(typeof Units!=='undefined'&&typeof UnitSystem!=='undefined'){const preset=Object.entries(UnitSystem.PRESETS).find(([,p])=>Object.entries(p).every(([q,k])=>Units.prefs[q]===k))?.[0];status('units',preset==='metric'?'Metric':preset==='imperial'?'Imperial':'Custom mix');}
  }
  // The side list: the links the modules added, sorted into groups, each with its icon, name and status line.
  function build(){
    const nav=document.querySelector('.settings-nav');if(!nav||nav.dataset.rail)return;nav.dataset.rail='1';
    const links=new Map([...nav.querySelectorAll('a')].map(a=>[keyOf(a),a]));
    nav.textContent='';
    for(const [title,keys] of GROUPS){
      const box=document.createElement('div');box.className='rail-group';box.innerHTML=`<span class="rail-label">${title}</span>`;
      for(const key of keys){const a=links.get(key);if(!a)continue;links.delete(key);
        const name=a.textContent.trim();a.className='rail-item';a.removeAttribute('data-category');
        a.innerHTML=`${sfIcon(INFO[key]?.[0]||'settings')}<span class="rail-text"><span>${esc(name)}</span><small data-rail-status="${key}">${esc(statuses[key]||INFO[key]?.[1]||'')}</small></span>`;
        box.append(a);}
      nav.append(box);
    }
    for(const a of links.values())nav.lastElementChild.append(a);
    // Sections written in index.html name their head; the modules' sections write theirs with head().
    for(const s of document.querySelectorAll('[data-ss-head]')){const [key,title,lead]=s.dataset.ssHead.split('|');s.insertAdjacentHTML('afterbegin',head(key,esc(title),esc(lead)));s.removeAttribute('data-ss-head');}
    refresh();
  }
  // One section at a time: the one the address names.
  function route(page,sub){
    if(page!=='settings')return;
    const open='settings-'+(sub||'appearance');
    for(const s of document.querySelectorAll('.settings-canvas>section'))s.hidden=s.id!==open;
    refresh();
  }
  return {head,group,row,status,refresh,build,route};
})();
