// SlotForge Remake (Change Sheet): the Setups page (route #analyze). A shelf of your setups grouped by car beside the page:
// click a setup to read it (its results, by topic), tick up to two more, or the workbench as it is now, to see what the
// change does: what you changed, a plain verdict, only the results that moved, and one line each for the rest.
const SetupsUI=(()=>{
 const S=ChangeSheetModel,$=id=>document.getElementById(id),MAX=2,WB='workbench';
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const dateFormat=new Intl.DateTimeFormat(undefined,{day:'numeric',month:'short'}),day=s=>{const d=new Date(s);return Number.isFinite(d.getTime())?dateFormat.format(d):'';};
 let others=[],comparing=false;
 const entry=id=>id===WB?{id:WB,setup:state.setup,workbench:true}:library.find(e=>e.id===id);
 const short=s=>[s.pinion&&s.gear?s.pinion+' / '+s.gear:'',s.totalWeight?unitText(Number(s.totalWeight),'g',1):''].filter(Boolean).join(' · ');
 const carName=s=>(typeof GarageUI!=='undefined'&&s.carRef&&GarageUI.byRef(s.carRef)?.name)||'';
 const LETTERS=['B','C'];
 const NEUTRAL={massG:'neutral: lighter is not always quicker',lapSpeed:'neutral: measured, conditions differ'};
 function markup(){
  const rail=document.querySelector('.analyze-rail');if(!rail||$('setup-shelf'))return;
  rail.insertAdjacentHTML('afterbegin','<div id="setup-shelf" class="setup-shelf" aria-label="Your setups"></div>');
  // The topics of one setup move out of the old mode list, under the shelf.
  const topics=rail.querySelector('.analyze-topics');if(topics){const box=document.createElement('div');box.className='shelf-topics';box.innerHTML='<span class="nav-group-label">Topics</span>';$('setup-shelf').after(box);box.append(topics);}
  document.querySelector('.analysis-toolbar').insertAdjacentHTML('afterbegin','<h2 id="setup-title" class="setup-title"></h2>');
  $('analysis-compare').innerHTML='<div id="change-sheet" class="change-sheet"></div>';
  $('setup-shelf').addEventListener('click',e=>{
   const tick=e.target.closest('[data-shelf-tick]'),pick=e.target.closest('[data-shelf-pick]');
   if(tick){toggle(tick.dataset.shelfTick);return;}
   if(pick){const id=pick.dataset.shelfPick;others=others.filter(o=>o!==id);analysisId=id;if(comparing&&!others.length)navigate('analyze');else{renderAnalysis();}}
  });
 }
 function toggle(id){
  if(id===analysisId)return;
  if(others.includes(id))others=others.filter(o=>o!==id);
  else{if(others.length>=MAX)others.shift();others.push(id);}
  if(others.length)navigate('analyze/compare');else navigate('analyze');
  renderAnalysis();
 }
 // From Library or the workbench: read one setup, or compare it with the next one.
 function select(id,compare){analysisId=id;others=others.filter(o=>o!==id&&o!==WB&&library.some(e=>e.id===o));if(compare&&!others.length){const next=library.find(e=>e.id!==id);if(next)others=[next.id];}if(!compare)others=[];}
 function route(compare){
  comparing=compare;
  if(compare){others=others.filter(o=>o===WB||(o!==analysisId&&library.some(e=>e.id===o)));if(!others.length){const next=library.find(e=>e.id!==analysisId);others=[next?next.id:WB];}}
  render();
 }
 function shelf(){
  const groups=new Map();
  for(const e of library){const name=carName(e.setup);if(!groups.has(name))groups.set(name,[]);groups.get(name).push(e);}
  const order=[...groups.entries()].sort((a,b)=>(a[0]?0:1)-(b[0]?0:1)||a[0].localeCompare(b[0]));
  const ticked=comparing?others:[];
  const row=e=>{const isBase=e.id===analysisId,on=isBase||ticked.includes(e.id),letter=isBase?'Base':LETTERS[ticked.indexOf(e.id)]||'';
   return `<div class="shelf-row${on?' on':''}" data-slot="${isBase?'a':on?letter.toLowerCase():''}"><button class="shelf-tick" data-shelf-tick="${esc(e.id)}" role="checkbox" aria-checked="${on}" aria-label="Compare ${esc(e.setup.name)}"${isBase?' disabled':''}></button><button class="shelf-pick" data-shelf-pick="${esc(e.id)}" aria-pressed="${isBase}"><b>${esc(e.setup.name)}</b><small>${esc([short(e.setup),e.updatedAt?'saved '+day(e.updatedAt):''].filter(Boolean).join(' · '))}</small></button>${on&&comparing?`<span class="shelf-role${isBase?' base':''}">${letter}</span>`:''}</div>`;};
  $('setup-shelf').innerHTML=`<span class="nav-group-label">${comparing?'Compare · the base and up to two more':'Your setups · tick one to compare'}</span>`+order.map(([name,list])=>`<div class="shelf-car"><b>${esc(name||'No car chosen')}</b><small>${list.length} setup${list.length===1?'':'s'}</small></div>${list.map(row).join('')}`).join('')+
   `<div class="shelf-row shelf-live${ticked.includes(WB)?' on':''}" data-slot="${ticked.includes(WB)?LETTERS[ticked.indexOf(WB)].toLowerCase():''}"><button class="shelf-tick" data-shelf-tick="${WB}" role="checkbox" aria-checked="${ticked.includes(WB)}" aria-label="Compare the workbench as it is now"></button><span class="shelf-pick"><b>The workbench now</b><small>${esc(short(state.setup)||'unsaved')} · compare before you save</small></span>${ticked.includes(WB)?`<span class="shelf-role">${LETTERS[ticked.indexOf(WB)]}</span>`:''}</div>`;
 }
 // Field names as the workbench shows them, read from its own labels.
 function fieldName(key){
  const field=document.querySelector(`[data-page=telemetry] [name="${key}"]`);if(!field)return null;
  const label=field.closest('label');let text='';
  if(label)for(const n of label.childNodes){if(n.nodeType===3)text+=n.textContent;else if(n.matches?.('span:not(.unit):not([data-unit])'))text+=n.textContent;}
  text=text.replace(/[·:]\s*$/,'').replace(/\s+/g,' ').trim();
  const group=field.closest('.panel,details')?.querySelector('h2,summary')?.textContent.trim()||'';
  return {label:text||key,group};
 }
 const inputValue=(key,v)=>{if(v===''||v===null||v===undefined)return '—';const token=UnitSystem.INPUTS[key],shown=displayInput(key,v),unit=token?Units.label(token):'';return esc(shown)+(unit&&!unit.startsWith(':')?' '+esc(unit):unit);};
 const value=(n,r)=>Number.isFinite(n)?unitValue(n,r.unit,r.digits)+(r.unit===':1'?':1':' '+esc(Units.label(r.unit))):'—';
 function cellHtml(c,r){
  if(!c.moved)return c.delta===null?`<span class="cs-same">${c.sameBasis?'not in both':'different basis'}</span>`:'<span class="cs-same">same</span>';
  const pct=c.percent===null?'':`${c.percent>0?'+':'−'}${performanceNumber(Math.abs(c.percent),1)}%`,w=Math.min(48,Math.max(3,Math.abs(c.percent??0)*3));
  return `<span class="cs-move"><span class="cs-val ${c.tone}">${value(c.b,r)} <small>${pct}</small></span><span class="cs-bar"><i class="${c.delta>0?'up':'down'} ${c.tone}" data-w="${w}"></i></span></span>`;
 }
 function sentence(v,name,letter){
  if(v.quiet)return `<p><b>${letter}</b> changes ${v.inputs?v.inputs===1?'one input':v.inputs+' inputs':'nothing'}, but no calculated result moves${v.inputs?': the change is in measurements, notes or details the calculations do not use':''}.</p>`;
  const bits=v.parts.map(p=>p.key==='massG'?`<b>${unitText(p.grams,'g',1)} ${p.text}</b>`:`<b class="${p.tone}">${p.text}</b>${p.detail?` (${p.detail})`:''}`);
  const list=bits.length>1?bits.slice(0,-1).join(', ')+' and '+bits.at(-1):bits[0];
  return `<p><b>${letter}</b> · ${esc(name)} is ${list}.</p>`;
 }
 function sheet(){
  const base=entry(analysisId),list=others.map(entry).filter(Boolean);
  if(!base||!list.length){$('change-sheet').innerHTML='<p class="hint">Tick a second setup in the list to see what changes.</p>';return;}
  const s=S.sheet(base.setup,list.map(e=>e.setup)),cols=list.length+1;
  const name=e=>e.workbench?'The workbench now':e.setup.name;
  const head=`<div class="cs-grid cs-head" data-cols="${cols}"><span class="lw-label">Base, then each change</span>${[base,...list].map((e,i)=>`<div class="cs-who" data-slot="${i?LETTERS[i-1].toLowerCase():'a'}"><b>${esc(name(e))}</b><small>${i?`${LETTERS[i-1]} · ${s.pairs[i-1].changes.length} change${s.pairs[i-1].changes.length===1?'':'s'}`:'base'}${short(e.setup)?' · '+esc(short(e.setup)):''}</small></div>`).join('')}</div>`;
  const verdicts=`<div class="cs-grid cs-verdict" data-cols="${cols}"><span class="lw-label">In short</span><span class="cs-basecell">${esc(name(base))} is the base.</span>${s.pairs.map((p,i)=>sentence(S.verdict(p),name(list[i]),LETTERS[i])).join('')}</div>`;
  // What you changed: inputs the workbench knows, named as it names them.
  const shown=s.changed.map(k=>({k,f:fieldName(k)})).filter(x=>x.f),hidden=s.changed.length-shown.length;
  const changed=shown.length?shown.map(({k,f})=>`<div class="cs-grid cs-row" data-cols="${cols}"><span class="cs-lab">${esc(f.label)}<small>${esc(f.group)}</small></span><span class="cs-num">${inputValue(k,base.setup[k])}</span>${list.map(e=>same(base.setup[k],e.setup[k])?'<span class="cs-same">same</span>':`<span><span class="cs-chg">${inputValue(k,base.setup[k])} → ${inputValue(k,e.setup[k])}</span></span>`).join('')}</div>`).join(''):'<p class="hint">No inputs differ.</p>';
  const moved=s.moved.map(r=>`<div class="cs-grid cs-row" data-cols="${cols}" data-sheet-metric="${r.key}"><span class="cs-lab">${esc(r.label)}<small>${r.better?'higher is better':NEUTRAL[r.key]||'neutral: depends on the track'}</small></span><span class="cs-num">${value(r.base,r)}</span>${r.cells.map(c=>cellHtml(c,r)).join('')}</div>`).join('')||'<p class="hint">No calculated result moves.</p>';
  const basis=s.missing.filter(m=>m.reason==='basis'),needs=s.missing.filter(m=>m.reason==='missing');
  const fold=(open,title,items,extra='')=>items.length?`<details class="cs-fold"${open?' open':''}><summary><b>${title}</b> · ${items.map(i=>esc(i.label)).join(', ')}</summary>${extra}</details>`:'';
  $('change-sheet').innerHTML=`<section class="panel cs-panel">${head}${verdicts}<div class="cs-section"><h3>What you changed</h3>${changed}${hidden?`<p class="hint">And ${hidden} detail${hidden===1?'':'s'} the workbench does not show as an input, such as measurement lists.</p>`:''}</div>
   <div class="cs-section"><h3>What it does</h3><p class="hint">Only the results that moved. Green is better for that result, red is worse; neutral results have no colour.</p>${moved}</div>
   ${fold(false,`${s.unchanged.length} result${s.unchanged.length===1?'':'s'} did not change`,s.unchanged)}
   ${fold(false,`${needs.length} result${needs.length===1?'':'s'} need a value in each setup`,needs,'<p class="hint">Add the measurement on the workbench and save, then compare again.</p>')}
   ${fold(true,`${basis.length} result${basis.length===1?'':'s'} measured on a different basis`,basis,'<p class="hint">For example a motor rated at another test voltage, or magnetic pull measured under other conditions. These are not compared, so a difference here is never shown as better or worse.</p>')}</section>`;
  for(const e of $('change-sheet').querySelectorAll('[data-w]'))e.style.width=e.dataset.w+'%';
  for(const e of $('change-sheet').querySelectorAll('[data-cols]'))e.style.setProperty('--cols',e.dataset.cols);
 }
 const same=(x,y)=>String(x??'').trim()===String(y??'').trim();
 function render(){markup();if(!$('setup-shelf'))return;shelf();const base=entry(analysisId);$('setup-title').textContent=base?base.setup.name:'';if(comparing)sheet();}
 // From the Library's binder: two or three ticked setups, the first as the base.
 function compareSet(ids){analysisId=ids[0];others=ids.slice(1,3);navigate('analyze/compare');}
 return {render,route,select,toggle,compareSet,state:()=>({base:analysisId,others:[...others],comparing})};
})();
