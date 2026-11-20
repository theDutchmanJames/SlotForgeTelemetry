// The Library in the SlotForge Restyle look: Saved setups and Garage in a side list (Paddock Rail) with
// a status line each, and the setup list's tools as one Control Strip. The links, buttons and fields are moved, not
// recreated, so routing, handlers and ids stay as they were.
const LibraryUI=(()=>{
  const q=s=>document.querySelector(s);
  const ITEMS={'#library':['setup','Your setups'],'#library/garage':['car','Cars and tracks']};
  const statuses={};
  function status(key,text){statuses[key]=text;const s=document.querySelector(`.library-rail [data-rail-status="${key}"]`);if(s&&s.textContent!==text)s.textContent=text;}
  const keyOf=hash=>hash==='#library'?'setups':hash.split('/')[1];
  // A field's visible caption moves out of sight: the Control Strip shows the placeholder, screen readers keep the name.
  function quietLabel(label){for(const n of [...label.childNodes])if(n.nodeType===3&&n.textContent.trim()){const s=document.createElement('span');s.className='sr-only';s.textContent=n.textContent;n.replaceWith(s);}}
  function build(){
    const page=q('[data-page=library]'),head=page?.querySelector(':scope>.page-head'),nav=page?.querySelector('.race-library-nav');
    if(!page||!head||!nav||page.querySelector('.library-shell'))return;
    // The side list.
    nav.classList.remove('segmented');nav.classList.add('library-rail');nav.setAttribute('aria-label','Library');
    const group=document.createElement('div');group.className='rail-group';group.innerHTML='<span class="rail-label">Library</span>';
    for(const a of [...nav.querySelectorAll('a')]){const [icon,line]=ITEMS[a.hash]||['library',''],key=keyOf(a.hash),name=a.textContent.trim();
      a.className='rail-item';a.innerHTML=`${sfIcon(icon)}<span class="rail-text"><span>${esc(name)}</span><small data-rail-status="${key}">${esc(statuses[key]||line)}</small></span>`;group.append(a);}
    nav.append(group);
    // The page: everything after the head, beside the list.
    const shell=document.createElement('div');shell.className='library-shell';const main=document.createElement('div');main.className='library-main';
    for(const el of [...page.children])if(el!==head&&el!==nav)main.append(el);
    shell.append(nav,main);head.after(shell);
    // Control Strip: the main action and the library tools on the left, search and sort on the right.
    const toolbar=q('.library-toolbar'),actions=head.querySelector('.actions');
    if(toolbar&&actions){
      const tools=document.createElement('div');tools.className='strip-tools';
      const open=actions.querySelector('a.btn.primary');if(open)tools.append(open);
      for(const b of actions.querySelectorAll('.btn')){b.classList.add('ghost');tools.append(b);}
      actions.remove();
      const controls=document.createElement('div');controls.className='strip-controls';
      for(const label of [...toolbar.querySelectorAll(':scope>label')]){quietLabel(label);controls.append(label);}
      q('#library-search')?.closest('label')?.classList.add('strip-search');
      toolbar.classList.add('control-strip');toolbar.append(tools,controls);
    }
  }
  return {build,status};
})();
