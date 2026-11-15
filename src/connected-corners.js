/**
 * Connected-corner editing for vector walls. State coordinates in mm.
 * Every wall holds references to shared nodes; never duplicate a corner.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.CubikeitorCorners=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const F=typeof module==='object'&&module.exports?require('./floor-plan-core.js'):null;
const SNAP=typeof module==='object'&&module.exports?require('./snap-engine.js'):null;
const requireValid=(v,m)=>{if(!v)throw Error(m);};
function edgesIntersect(a,b,c,d){
 const cross=(p,q,r)=>(q.x-p.x)*(r.y-p.y)-(q.y-p.y)*(r.x-p.x);
 const x=cross(a,b,c),y=cross(a,b,d),z=cross(c,d,a),w=cross(c,d,b);
 return (x*y<0&&z*w<0);
}
function validateClosedPerimeter(state,wallIds=['w1','w2','w3','w4']){
 requireValid(state&&state.nodes&&state.walls,'Estado incompleto');
 const walls=wallIds.map(id=>{const w=state.walls[id];requireValid(w,'Muro perimetral faltante: '+id);return w;});
 requireValid(walls.length>=3,'Un perímetro requiere al menos tres muros');
 const seen=new Set();
 for(let i=0;i<walls.length;i++){
  const current=walls[i],next=walls[(i+1)%walls.length];
  requireValid(current.endNodeId===next.startNodeId,'Esquina desconectada entre '+current.id+' y '+next.id);
  requireValid(state.nodes[current.startNodeId]&&state.nodes[current.endNodeId],'Nodo inexistente');
  requireValid(!seen.has(current.startNodeId),'Vértice repetido: '+current.startNodeId);
  seen.add(current.startNodeId);
 }
 const pts=walls.map(w=>state.nodes[w.startNodeId]);
 for(let i=0;i<pts.length;i++)for(let j=i+1;j<pts.length;j++){
  requireValid(pts[i].x!==pts[j].x||pts[i].y!==pts[j].y,'Esquinas diferentes coinciden físicamente');
 }
 const signedArea=pts.reduce((sum,p,i)=>{const q=pts[(i+1)%pts.length];return sum+p.x*q.y-q.x*p.y;},0)/2;
 requireValid(Math.abs(signedArea)>=100000,'Perímetro sin área suficiente');
 for(let i=0;i<pts.length;i++)for(let j=i+1;j<pts.length;j++){
  if(j===i+1||(i===0&&j===pts.length-1))continue;
  requireValid(!edgesIntersect(pts[i],pts[(i+1)%pts.length],pts[j],pts[(j+1)%pts.length]),'Los muros perimetrales se cruzan');
 }
 return {closed:true,cornerCount:pts.length,areaMm2:Math.abs(signedArea),nodeIds:walls.map(w=>w.startNodeId)};
}
function moveConnectedNode(state,nodeId,x,y,options={}){
 const core=options.core||F||(typeof globalThis!=='undefined'?globalThis.CubikeitorFloorPlan:null);
 const snap=options.snap||SNAP||(typeof globalThis!=='undefined'?globalThis.CubikeitorSnap:null);
 requireValid(core&&snap,'Motores de geometría incompletos');
 requireValid(state.nodes?.[nodeId],'Nodo desconocido: '+nodeId);
 requireValid(Number.isFinite(x)&&Number.isFinite(y),'Coordenadas no finitas');
 const result=snap.getSnappedPosition(x,y,state.nodes,state.walls,nodeId,options.threshold??150);
 // Merging a distinct node needs full graph rewriting. Never produce overlapping IDs.
 requireValid(result.snappedTo?.type!=='wall','Una unión en T requiere dividir el muro antes de imantar');
 let next;
 if(result.snappedTo?.type==='node'){
  // Topological merge: replace every occurrence of old ID with the target ID.
  const targetId=result.snappedTo.id;
  next=JSON.parse(JSON.stringify(state));
  for(const wall of Object.values(next.walls)){
   if(wall.startNodeId===nodeId)wall.startNodeId=targetId;
   if(wall.endNodeId===nodeId)wall.endNodeId=targetId;
  }
  delete next.nodes[nodeId];
  next.revision++;
  core.validateProject(next); // rejects zero-length incident walls
  const edgeKeys=new Set();
  for(const wall of Object.values(next.walls)){
   const key=[wall.startNodeId,wall.endNodeId].sort().join(':');
   requireValid(!edgeKeys.has(key),'La fusión duplicaría un muro existente');
   edgeKeys.add(key);
  }
 }else{
  next=core.moveNode(state,nodeId,{x:result.x,y:result.y});
 }
 const ids=options.perimeterWallIds||['w1','w2','w3','w4'];
 if(ids.every(id=>!!next.walls[id]))validateClosedPerimeter(next,ids);
 // Manual topology edits are no longer the chosen ISO normalized rectangle.
 if(next.metadata?.model&&(result.snappedTo?.type==='node'||state.nodes[nodeId].x!==result.x||state.nodes[nodeId].y!==result.y)){
  next.metadata={...next.metadata};delete next.metadata.model;delete next.metadata.nominalExteriorDimensionsMm;
 }
 return {state:next,snappedTo:result.snappedTo};
}
return {validateClosedPerimeter,moveConnectedNode};
});
