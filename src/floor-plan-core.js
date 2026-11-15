/**
 * CUBIKEITOR 3000 — núcleo experimental de planta libre.
 * Coordinates, offsets, heights and wall thicknesses use integer millimetres.
 * Pure immutable functions. Independent of the published fixed-face viewer.
 */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.CubikeitorFloorPlan=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const copy=x=>JSON.parse(JSON.stringify(x));
const goodId=x=>typeof x==='string'&&/^[a-zA-Z0-9_-]{1,64}$/.test(x);
const integer=(v,min=0,max=1000000)=>Number.isSafeInteger(v)&&v>=min&&v<=max;
const requireValid=(condition,message)=>{if(!condition)throw new Error(message);};
const initialProjectState={
 revision:0,
 metadata:{name:'Proyecto Planta Libre',currency:'CLP',defaultWallHeight:2400,defaultWallThickness:120},
 nodes:{
  n1:{id:'n1',x:0,y:0},n2:{id:'n2',x:6000,y:0},
  n3:{id:'n3',x:6000,y:4000},n4:{id:'n4',x:0,y:4000}
 },
 walls:{
  w1:{id:'w1',startNodeId:'n1',endNodeId:'n2',height:2400,thickness:120,type:'perimetral',finishExterior:'siding_fibrocemento',finishInterior:'yeso_carton_10mm'},
  w2:{id:'w2',startNodeId:'n2',endNodeId:'n3',height:2400,thickness:120,type:'perimetral',finishExterior:'siding_fibrocemento',finishInterior:'yeso_carton_10mm'},
  w3:{id:'w3',startNodeId:'n3',endNodeId:'n4',height:2400,thickness:120,type:'perimetral',finishExterior:'siding_fibrocemento',finishInterior:'yeso_carton_10mm'},
  w4:{id:'w4',startNodeId:'n4',endNodeId:'n1',height:2400,thickness:120,type:'perimetral',finishExterior:'siding_fibrocemento',finishInterior:'yeso_carton_10mm'}
 },
 openings:{op1:{id:'op1',wallId:'w1',type:'ventana',width:1200,height:1050,offsetFromStart:500,sillHeight:900}}
};
function getWallGeometry(state,wallId){
 const w=state?.walls?.[wallId];
 requireValid(w&&w.id===wallId,'Muro '+wallId+' no encontrado');
 const a=state.nodes?.[w.startNodeId],b=state.nodes?.[w.endNodeId];
 requireValid(a&&b&&a.id===w.startNodeId&&b.id===w.endNodeId,'Muro '+wallId+' referencia un nodo inexistente');
 for(const n of [a,b])requireValid(integer(n.x,-1000000,1000000)&&integer(n.y,-1000000,1000000),'Coordenadas inválidas');
 const dx=b.x-a.x,dy=b.y-a.y;
 const length=Math.hypot(dx,dy);
 requireValid(Number.isFinite(length)&&length>=300,'El muro debe medir al menos 300 mm');
 requireValid(integer(w.height,300,10000),'Altura de muro inválida');
 requireValid(integer(w.thickness,20,1000),'Espesor de muro inválido');
 requireValid(['perimetral','tabique_interior'].includes(w.type),'Tipo de muro inválido');
 return {id:wallId,lengthMm:length,heightMm:w.height,thicknessMm:w.thickness,startNodeId:w.startNodeId,endNodeId:w.endNodeId};
}
function validateOpening(state,o,ignoreId){
 requireValid(o&&goodId(o.id)&&goodId(o.wallId),'ID de abertura o muro inválido');
 requireValid(['ventana','puerta','vano'].includes(o.type),'Tipo de abertura inválido');
 requireValid(integer(o.width,300,6000)&&integer(o.height,300,5000),'Dimensiones de abertura inválidas');
 requireValid(integer(o.offsetFromStart,0,1000000)&&integer(o.sillHeight,0,10000),'Ubicación de abertura inválida');
 requireValid((o.type!=='puerta'&&o.type!=='vano')||o.sillHeight===0,'Una puerta debe iniciar a nivel de piso');
 const wall=getWallGeometry(state,o.wallId);
 const MARGIN=100,SEPARATION=80;
 requireValid(o.offsetFromStart>=MARGIN&&o.offsetFromStart+o.width<=wall.lengthMm-MARGIN,'La abertura excede el largo disponible del muro');
 requireValid(o.sillHeight+o.height<=wall.heightMm-MARGIN,'La abertura excede la altura disponible del muro');
 for(const other of Object.values(state.openings||{})){
  if(other.id===ignoreId||other.wallId!==o.wallId)continue;
  const horizontal=o.offsetFromStart<other.offsetFromStart+other.width+SEPARATION&&other.offsetFromStart<o.offsetFromStart+o.width+SEPARATION;
  const vertical=o.sillHeight<other.sillHeight+other.height+SEPARATION&&other.sillHeight<o.sillHeight+o.height+SEPARATION;
  requireValid(!(horizontal&&vertical),'Aberturas superpuestas o con separación insuficiente');
 }
 return true;
}
function validateProject(state){
 requireValid(state&&typeof state==='object'&&Number.isSafeInteger(state.revision)&&state.revision>=0,'Revisión inválida');
 requireValid(state.nodes&&state.walls&&state.openings&&typeof state.nodes==='object'&&typeof state.walls==='object'&&typeof state.openings==='object','Estructura de planta libre inválida');
 requireValid(Object.keys(state.nodes).length<=2000&&Object.keys(state.walls).length<=3000&&Object.keys(state.openings).length<=2000,'Proyecto excede límites');
 for(const [key,n] of Object.entries(state.nodes))requireValid(goodId(key)&&n.id===key&&integer(n.x,-1000000,1000000)&&integer(n.y,-1000000,1000000),'Nodo inválido: '+key);
 for(const key of Object.keys(state.walls))getWallGeometry(state,key);
 for(const [key,o] of Object.entries(state.openings)){requireValid(goodId(key)&&o.id===key,'ID de abertura inconsistente');validateOpening(state,o,key);}
 return true;
}
function addOpeningToWall(state,openingData){
 validateProject(state);
 requireValid(openingData&&goodId(openingData.id),'ID de abertura inválido');
 // Updating an existing opening must ignore its own footprint.
 const next=copy(state);
 next.openings[openingData.id]=copy(openingData);
 validateOpening(next,openingData,openingData.id);
 next.revision++;
 validateProject(next);
 return next;
}
function moveNode(state,nodeId,{x,y}){
 validateProject(state);
 requireValid(state.nodes[nodeId],'Nodo '+nodeId+' no encontrado');
 requireValid(integer(x,-1000000,1000000)&&integer(y,-1000000,1000000),'Coordenadas inválidas');
 const next=copy(state);
 next.nodes[nodeId]={...next.nodes[nodeId],x,y};
 next.revision++;
 // Reject motions that would reduce wall length or push existing openings outside a wall.
 validateProject(next);
 return next;
}
function getWallMetrics(state,wallId){
 const w=getWallGeometry(state,wallId);
 const openings=Object.values(state.openings).filter(o=>o.wallId===wallId);
 const grossMm2=w.lengthMm*w.heightMm;
 const holesMm2=openings.reduce((sum,o)=>sum+o.width*o.height,0);
 return {...w,openings:copy(openings),grossAreaM2:grossMm2/1000000,openingAreaM2:holesMm2/1000000,netAreaM2:(grossMm2-holesMm2)/1000000,revision:state.revision};
}
function createFloorPlanStore(seed=initialProjectState){
 let current=copy(seed),past=[],future=[],listeners=new Set();
 validateProject(current);
 const emit=()=>{for(const fn of listeners)fn(copy(current));};
 function commit(next){past.push(current);if(past.length>100)past.shift();future=[];current=next;emit();return copy(current);}
 return {
  getState:()=>copy(current),
  subscribe(fn){requireValid(typeof fn==='function','Suscriptor inválido');listeners.add(fn);return()=>listeners.delete(fn);},
  addOpening(data){return commit(addOpeningToWall(current,data));},
  moveNode(id,point){return commit(moveNode(current,id,point));},
  undo(){if(!past.length)return false;future.push(current);current={...past.pop(),revision:current.revision+1};emit();return true;},
  redo(){if(!future.length)return false;past.push(current);current={...future.pop(),revision:current.revision+1};emit();return true;},
  canUndo:()=>past.length>0,canRedo:()=>future.length>0
 };
}
return {initialProjectState,validateProject,validateOpening,getWallGeometry,getWallMetrics,addOpeningToWall,moveNode,createFloorPlanStore};
});
