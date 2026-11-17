// Display units. Everything is calculated and saved in metric; only what people see and type is converted.
// Conversions are keyed by the metric unit token the app already uses (km/h, g, gf·cm, mm, ...).
(function(root){
 const OZ=28.349523125,IN=25.4,FT=0.3048,MILE=1.609344,OZIN=OZ*2.54,LB=0.45359237;
 // quantity → choices: [key, label, factor (display = metric × factor), extra decimals]
 const QUANTITIES={
  speed:{title:'Speed',choices:[['kmh','km/h',1,0],['mph','mph',1/MILE,0]]},
  mass:{title:'Weight',choices:[['g','g',1,0],['oz','oz',1/OZ,2]]},
  torque:{title:'Motor torque',choices:[['gfcm','gf·cm',1,0],['ozin','oz·in',1/OZIN,2],['mnm','mN·m',0.0980665,1]]},
  length:{title:'Small lengths (tyres, gears, wheelbase)',choices:[['mm','mm',1,0],['in','in',1/IN,2]]},
  distance:{title:'Lap distance',choices:[['m','m',1,0],['ft','ft',1/FT,0]]}
 };
 // Metric tokens shown by the app, and which quantity converts them.
 const TOKENS={'km/h':['speed'],'g':['mass'],'gf·cm':['torque'],'mm':['length'],'mm/motor rev':['length','/motor rev'],'mm/rev':['length','/rev'],'m':['distance'],'W/kg':['mass','power']};
 const PRESETS={metric:{speed:'kmh',mass:'g',torque:'gfcm',length:'mm',distance:'m'},imperial:{speed:'mph',mass:'oz',torque:'ozin',length:'in',distance:'ft'}};
 // Input fields on the main path that show and accept the chosen unit, by their metric token.
 const INPUTS={motorTorque:'gf·cm',rearDiameter:'mm',rimDiameter:'mm',tyreThickness:'mm',totalWeight:'g',ballast:'g',frontWeight:'g',rearWeight:'g',wheelbase:'mm',ballastPosition:'mm',gearDiameter:'mm',wornDiameter:'mm',targetRollout:'mm/motor rev',trackLength:'m'};
 function clean(prefs){const out={...PRESETS.metric};for(const [q,{choices}] of Object.entries(QUANTITIES))if(choices.some(([k])=>k===prefs?.[q]))out[q]=prefs[q];return out;}
 function create(prefs=PRESETS.metric){
  const p=clean(prefs);
  const choice=q=>QUANTITIES[q].choices.find(([k])=>k===p[q]);
  // Returns {factor,label,extra} for a metric token, or null for tokens that never convert (N, W, RPM, gf, %…).
  function rule(token){
   const t=TOKENS[token];if(!t)return null;const [q,suffix]=t,[,label,factor,extra]=choice(q);
   if(suffix==='power')return p.mass==='g'?null:{factor:LB,label:'W/lb',extra:0}; // W/kg → W/lb
   return {factor,label:label+(suffix||''),extra};
  }
  const label=token=>rule(token)?.label??token;
  const value=(n,token)=>{const r=rule(token);return Number.isFinite(n)&&r?n*r.factor:n;};
  const digits=(token,d)=>d+(rule(token)?.extra||0);
  const toMetric=(n,token)=>{const r=rule(token);return Number.isFinite(n)&&r?n/r.factor:n;};
  const metric=()=>Object.entries(p).every(([q,k])=>PRESETS.metric[q]===k);
  return {prefs:p,label,value,digits,toMetric,metric,rule};
 }
 // Text for an input box: enough precision to round-trip, without float noise.
 const inputText=n=>Number.isFinite(n)?String(Number(n.toPrecision(10))):'';
 // Seven significant digits: far finer than any slot car measurement, without float noise after converting.
const storedText=n=>Number.isFinite(n)?String(Number(n.toPrecision(7))):'';
 const api={QUANTITIES,PRESETS,INPUTS,TOKENS,create,clean,inputText,storedText};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.UnitSystem=api;
})(globalThis);
