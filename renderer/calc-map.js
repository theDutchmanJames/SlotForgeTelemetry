// SlotForge Rework (Calculation Map): Settings › Calculations explained opens on a map of how your numbers are made, with
// your workbench values on every box. Click a box: the path to it lights up and its formula shows with your numbers.
// Below, every explanation grouped by area with a search. A ? next to a number elsewhere opens the map at that number.
const CalcMapUI=(()=>{
 const M=CalcMapModel,$=id=>document.getElementById(id),W=900,ROW=58,COLS=[{x:10,w:205},{x:335,w:200},{x:655,w:235}];
 let selected='rollout',ready=false;
 // In metric, like the formulas: mixing units inside one formula would read wrong.
 const show=(v,n)=>v===null?'—':n.unit===':1'?performanceNumber(v,3)+':1':performanceNumber(v,['RPM','teeth'].includes(n.unit)?0:2)+(n.unit==='teeth'?'':' '+n.unit);
 function layout(){
  const pos={};for(const c of [0,1,2]){const list=M.NODES.filter(n=>n.col===c),top=40+((6-list.length)*ROW)/2;list.forEach((n,i)=>pos[n.id]={x:COLS[c].x,y:top+i*ROW,w:COLS[c].w});}
  return pos;
 }
 function init(){
  const section=$('settings-calculations');if(!section||$('calc-map'))return;
  $('help-topics').insertAdjacentHTML('beforebegin',`<section class="cm-card" id="calc-map"><div class="cm-head"><h3 class="cm-h">How your numbers are made</h3><p class="hint">Your inputs on the left, the results on the right, with the values from your workbench (in metric, like the formulas). Click any box: the path to it lights up.</p></div><div class="cm-scroll"><svg id="cm-svg" viewBox="0 0 ${W} 400" role="group" aria-label="How your numbers are made"></svg></div><div class="cm-detail" id="cm-detail" aria-live="polite"></div></section>
   <section class="cm-card cm-index"><h3 class="cm-h">Every explanation</h3><label class="field cm-search"><span class="sr-only">Search the explanations</span><input id="help-search" type="search" maxlength="60" placeholder="Search: rollout, clearance, magnet…"></label></section>`);
  section.querySelector('.cm-index').append($('help-topics'));
  const svg=$('cm-svg');
  svg.addEventListener('click',e=>{const g=e.target.closest('[data-node]');if(g)select(g.dataset.node);});
  svg.addEventListener('keydown',e=>{const g=e.target.closest('[data-node]');if(g&&(e.key==='Enter'||e.key===' ')){e.preventDefault();select(g.dataset.node);}});
  $('help-search').addEventListener('input',filter);
  // A ? next to a number anywhere: open the map at that number.
  document.addEventListener('click',e=>{const b=e.target.closest('[data-calc-node]');if(!b)return;e.preventDefault();open(b.dataset.calcNode);});
  ready=true;
 }
 function filter(){
  const q=$('help-search').value.trim().toLowerCase();
  for(const a of document.querySelectorAll('#help-topics a')){const hit=!q||a.textContent.toLowerCase().includes(q)||(calculationHelp[a.hash.split('/')[2]]?.formula||'').toLowerCase().includes(q);a.hidden=!hit;}
  for(const g of document.querySelectorAll('#help-topics .cm-group'))g.hidden=![...g.querySelectorAll('a')].some(a=>!a.hidden);
 }
 function render(){
  if(!ready||$('settings-calculations').hidden)return;
  const v=M.values(calculationInput()),pos=layout(),on=M.path(selected);
  let s=['YOUR INPUTS','IN BETWEEN','RESULTS'].map((t,i)=>`<text class="cm-col" x="${COLS[i].x}" y="20">${t}</text>`).join('');
  for(const e of M.edges()){const a=pos[e.from],b=pos[e.to],x1=a.x+a.w,y1=a.y+19,x2=b.x,y2=b.y+19,mx=(x1+x2)/2;s+=`<path class="cm-edge${on.has(e.from)&&on.has(e.to)?' on':''}" d="M${x1} ${y1} C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}"/>`;}
  for(const n of M.NODES){const p=pos[n.id];s+=`<g class="cm-node c${n.col}${on.has(n.id)?' on':''}${n.id===selected?' sel':''}" data-node="${n.id}" tabindex="0" role="button" aria-pressed="${n.id===selected}" aria-label="${esc(n.label)}: ${esc(show(v[n.id],n))}"><rect x="${p.x}" y="${p.y}" width="${p.w}" height="38" rx="9"/><text x="${p.x+12}" y="${p.y+24}">${esc(n.label)}</text><text class="cm-val" x="${p.x+p.w-12}" y="${p.y+24}" text-anchor="end">${esc(show(v[n.id],n))}</text></g>`;}
  $('cm-svg').innerHTML=s;
  const n=M.byId[selected],uses=M.usedBy(n.id).map(id=>M.byId[id].label);
  const made=(n.from||[]).map(id=>`${esc(M.byId[id].label.toLowerCase())} <b>${esc(show(v[id],M.byId[id]))}</b>`).join(', ');
  $('cm-detail').innerHTML=`<div class="cm-detail-main"><p class="eyebrow">${n.col===0?'YOUR INPUT':n.col===1?'IN BETWEEN':'RESULT'}</p><h4>${esc(n.label)} <span class="cm-now">${esc(show(v[n.id],n))}</span></h4>
   ${n.formula?`<div class="cm-formula">${esc(n.label.toLowerCase())} = ${esc(n.formula)}</div><p class="cm-with">With your numbers: ${made} → <b>${esc(show(v[n.id],n))}</b>${v[n.id]===null?'. Enter the missing input on the workbench to see it.':''}</p>`:`<p class="cm-with">Your input on the workbench${v[n.id]===null?': not entered yet':`: <b>${esc(show(v[n.id],n))}</b>`}.</p>`}
   ${uses.length?`<p class="hint">Used by: ${uses.map(esc).join(', ')}.</p>`:''}${M.LIMITS[n.id]?`<p class="cm-limit">${esc(M.LIMITS[n.id])}</p>`:''}</div>
   <div class="cm-detail-actions"><button type="button" class="btn small" id="cm-full">Full explanation</button>${n.field?`<button type="button" class="btn small ghost" id="cm-edit">Change it on the workbench</button>`:''}</div>`;
  $('cm-full').onclick=()=>{navigate('settings/calculations/'+n.topic);requestAnimationFrame(()=>$('help-content').scrollIntoView({block:'start'}));};
  if(n.field)$('cm-edit').onclick=()=>{navigate('telemetry');requestAnimationFrame(()=>focusSetupInput(n.field==='rearDiameter'&&state.setup.tyreMode==='rim'?'rimDiameter':n.field));};
 }
 function select(id){if(!M.byId[id])return;const keep=document.activeElement?.closest?.('#cm-svg');selected=id;render();if(keep)$('cm-svg').querySelector(`[data-node="${id}"]`)?.focus({preventScroll:true});}
 function open(id){if(!M.byId[id])return;selected=id;navigate('settings/calculations/'+M.byId[id].topic);requestAnimationFrame(()=>{render();$('calc-map')?.scrollIntoView({block:'start'});$('cm-svg')?.querySelector(`[data-node="${id}"]`)?.focus({preventScroll:true});});}
 return {init,render,select,open,state:()=>selected};
})();
