/** Presets of nominal external container dimensions in integer millimetres.
 * Structural thickness and wall construction are conceptual until verified by
 * a manufacturer; do not infer usable interior dimensions from this model.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.CubikeitorISO=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const PRESETS=Object.freeze({
 '20ft':{label:'Contenedor 20 ft',length:6058,width:2438,height:2591,visualThickness:150},
 '40ft':{label:'Contenedor 40 ft',length:12192,width:2438,height:2591,visualThickness:150},
 '20ftHC':{label:'Contenedor 20 ft High Cube (referencial)',length:6058,width:2438,height:2896,visualThickness:150},
 'oficinaModular':{label:'Oficina modular 6 × 3 m',length:6000,width:3000,height:2600,visualThickness:120}
});
function buildPreset(name){
 const p=PRESETS[name];if(!p)throw Error('Modelo desconocido: '+name);
 const copy=x=>JSON.parse(JSON.stringify(x));
 const nodes={n1:{id:'n1',x:0,y:0},n2:{id:'n2',x:p.length,y:0},n3:{id:'n3',x:p.length,y:p.width},n4:{id:'n4',x:0,y:p.width}};
 const connections=[['n1','n2'],['n2','n3'],['n3','n4'],['n4','n1']];
 const walls={};
 connections.forEach(([startNodeId,endNodeId],i)=>{
  const id='w'+(i+1);walls[id]={id,startNodeId,endNodeId,height:p.height,thickness:p.visualThickness,type:'perimetral',
  finishExterior:'acero_referencial',finishInterior:'aislacion_referencial'};
 });
 return {revision:0,metadata:{name:p.label,currency:'CLP',defaultWallHeight:p.height,defaultWallThickness:p.visualThickness,model:name,nominalExteriorDimensionsMm:{length:p.length,width:p.width,height:p.height}},nodes,walls,openings:{}};
}
function getDimensions(name){const p=PRESETS[name];if(!p)throw Error('Modelo desconocido');return {...p};}
return {PRESETS,buildPreset,getDimensions};
});
