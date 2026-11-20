// SlotForge Rework (Calculation Map): how each number on the workbench is built from your inputs. Pure: the nodes, the
// lines between them, their values for a setup, and the path behind any number. Formulas match the calculation models.
(function(root){
 const node=typeof module==='object'&&module.exports;
 const T=node?require('./telemetry-model.js'):root.TelemetryModel;
 const num=v=>{const n=Number(v);return v===''||v===null||v===undefined||!Number.isFinite(n)?null:n;};
 // column 0: your inputs · 1: in between · 2: results. topic: the explanation in Settings › Calculations explained.
 const NODES=[
  {id:'pinion',col:0,label:'Pinion',unit:'teeth',topic:'gearing',field:'pinion'},
  {id:'gear',col:0,label:'Driven gear',unit:'teeth',topic:'gearing',field:'gear'},
  {id:'rpm',col:0,label:'Motor RPM',unit:'RPM',topic:'speed',field:'ratedRpm'},
  {id:'torque',col:0,label:'Stall torque',unit:'gf·cm',topic:'torque',field:'motorTorque'},
  {id:'tyre',col:0,label:'Rear tyre',unit:'mm',topic:'tyres',field:'rearDiameter'},
  {id:'weight',col:0,label:'Weight',unit:'g',topic:'weight',field:'totalWeight'},
  {id:'ratio',col:1,label:'Gear ratio',unit:':1',topic:'gearing',formula:'driven gear ÷ pinion',from:['gear','pinion']},
  {id:'axleRpm',col:1,label:'Axle RPM',unit:'RPM',topic:'speed',formula:'motor RPM ÷ ratio',from:['rpm','ratio']},
  {id:'circ',col:1,label:'Circumference',unit:'mm',topic:'tyres',formula:'π × tyre',from:['tyre']},
  {id:'peakPowerW',col:1,label:'Peak power',unit:'W',topic:'power',formula:'stall torque × no-load speed ÷ 4',from:['torque','rpm']},
  {id:'speedKmh',col:2,label:'No-load speed',unit:'km/h',topic:'speed',formula:'axle RPM × circumference × 60 ÷ 1,000,000',from:['axleRpm','circ']},
  {id:'rollout',col:2,label:'Rollout',unit:'mm/rev',topic:'gearing',formula:'circumference ÷ ratio',from:['circ','ratio']},
  {id:'forceN',col:2,label:'Pull at the wheels',unit:'N',topic:'torque',formula:'stall torque × ratio ÷ tyre radius',from:['torque','ratio','tyre']},
  {id:'powerToWeight',col:2,label:'Power / weight',unit:'W/kg',topic:'weight',formula:'peak power ÷ weight',from:['peakPowerW','weight']}
 ];
 const LIMITS={
  ratio:'Teeth are whole numbers; a direct, single-stage drivetrain.',axleRpm:'At the rated no-load RPM: under load the motor turns slower.',
  circ:'The fitted tyre’s outside diameter; worn tyres are smaller.',peakPowerW:'Ideal brushed DC motor, before drivetrain losses; not a continuous rating. Needs stall torque and RPM at the same test voltage.',
  speedKmh:'A ceiling with no load: real speed is lower because of losses, grip and the track.',rollout:'Assumes no tyre slip.',
  forceN:'At zero speed, before drivetrain losses and grip limits.',powerToWeight:'Peak motor power per kg of car; not a lap-time prediction.'};
 const byId=Object.fromEntries(NODES.map(n=>[n.id,n]));
 const edges=()=>NODES.flatMap(n=>(n.from||[]).map(f=>({from:f,to:n.id})));
 // Everything a number is made from, itself included.
 function path(id){const seen=new Set(),walk=k=>{if(seen.has(k))return;seen.add(k);for(const f of byId[k]?.from||[])walk(f);};walk(id);return seen;}
 // Which numbers use this one.
 const usedBy=id=>NODES.filter(n=>(n.from||[]).includes(id)).map(n=>n.id);
 // Values for a calculation input (CalculatorModel.inputOf of a setup).
 function values(input){
  const m=T.calculate(input),mo=m.motor||{},d=num(mo.rearDiameter);
  return {pinion:num(input.pinion),gear:num(input.gear),rpm:num(input.ratedRpm),torque:num(input.motorTorque),tyre:d,weight:num(m.massG),
   ratio:num(mo.ratio),axleRpm:num(mo.axleRpm),circ:d===null?null:Math.PI*d,peakPowerW:num(mo.peakPowerW),
   speedKmh:num(mo.speedKmh),rollout:num(mo.rollout),forceN:num(mo.forceN),powerToWeight:num(m.powerToWeight)};
 }
 const api={NODES,LIMITS,byId,edges,path,usedBy,values};
 if(node)module.exports=api;else root.CalcMapModel=api;
})(typeof globalThis!=='undefined'?globalThis:this);
