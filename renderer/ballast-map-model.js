(function(root){
  'use strict';
  const H=typeof module==='object'&&module.exports?require('./chassis-model.js'):root.ChassisModel;
  function geometry(input){
    const r=H.calculate(input);
    if(!r.geometry)return {ready:false,reason:'Enter guide-to-rear-axle distance and rear tyre contact-centre spacing in Chassis geometry & balance.'};
    if(r.mode==='mixed')return {ready:false,reason:'Choose a defined front weighing support before mapping ballast positions. Guide and front wheels together do not define a single front support.'};
    const span=r.mode==='none'?r.geometry.length:r.span;
    if(!(span>0))return {ready:false,reason:r.mode==='axle'?'Enter wheelbase in Weight & ballast to locate the front axle.':'Enter the actual front support-to-rear-axle distance in Chassis geometry & balance.'};
    return {ready:true,length:r.geometry.length,track:r.track,span,offset:r.geometry.length-span,
      lateral:['none','tripod'].includes(r.mode),reference:r.mode==='axle'?'front axle':r.mode==='none'||input.chassisSupportReference==='pivot'?'guide pivot / assumed support':'measured front support',
      refs:H.mapReferences(input.chassisMap??'')};
  }
  function pixel(g,x,y){const r=g.refs;return {x:r.guide+(x+g.offset)/g.length*(r.rear-r.guide),y:r.centre-y/(g.track/2)*(y>=0?r.centre-r.right:r.left-r.centre)};}
  function position(g,px,py){
    const r=g.refs,round=n=>Math.round(n*2)/2;
    return {x:round((px-r.guide)/(r.rear-r.guide)*g.length-g.offset),
      y:g.lateral?round((r.centre-py)/(py<=r.centre?r.centre-r.right:r.left-r.centre)*(g.track/2)):0};
  }
  // Dimensionless drawing coordinates: x is a guide-span fraction; y is a half-track fraction.
  function drawing(input){return {length:1,span:1,track:2,offset:0,lateral:true,refs:H.mapReferences(input.chassisMap??'')};}
  function drawingPosition(g,px,py){const r=g.refs;return {x:(px-r.guide)/(r.rear-r.guide),y:(r.centre-py)/(py<=r.centre?r.centre-r.right:r.left-r.centre)};}
  const api={geometry,pixel,position,drawing,drawingPosition};if(typeof module==='object'&&module.exports)module.exports=api;else root.BallastMapModel=api;
})(globalThis);
