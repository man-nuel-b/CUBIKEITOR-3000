/**
 * Imantación geométrica de planta libre (mm).
 * Determinista: nodos primero, después segmentos de muros; gana el más cercano.
 * El resultado se redondea a milímetros enteros y nunca muta el estado.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 root.CubikeitorSnap=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function assertCoordinate(value,label){
  if(!Number.isFinite(value)||Math.abs(value)>1000000)throw new Error(label+' inválida');
 }
 function getPointSegmentProjection(px,py,p1,p2){
  for(const [v,label] of [[px,'x'],[py,'y'],[p1.x,'inicio X'],[p1.y,'inicio Y'],[p2.x,'fin X'],[p2.y,'fin Y']])assertCoordinate(v,label);
  const dx=p2.x-p1.x,dy=p2.y-p1.y,l2=dx*dx+dy*dy;
  const t=l2===0?0:Math.max(0,Math.min(1,((px-p1.x)*dx+(py-p1.y)*dy)/l2));
  const x=p1.x+t*dx,y=p1.y+t*dy;
  return {x,y,distance:Math.hypot(px-x,py-y),t};
 }
 function getSnappedPosition(x,y,nodes,walls,excludeNodeId=null,threshold=150){
  assertCoordinate(x,'Coordenada X');assertCoordinate(y,'Coordenada Y');
  if(!Number.isFinite(threshold)||threshold<0||threshold>10000)throw new Error('Umbral de imantación inválido');
  if(!nodes||!walls||typeof nodes!=='object'||typeof walls!=='object')throw new Error('Geometría incompleta');
  let closest=null;
  const select=(candidate,priority)=>{
   if(candidate.distance>threshold)return;
   if(!closest||priority<closest.priority||(priority===closest.priority&&(candidate.distance<closest.distance-1e-8||
       (Math.abs(candidate.distance-closest.distance)<1e-8&&candidate.id<closest.id)))){
    closest={...candidate,priority};
   }
  };
  for(const [id,node] of Object.entries(nodes)){
   if(id===excludeNodeId)continue;
   assertCoordinate(node.x,'Nodo X');assertCoordinate(node.y,'Nodo Y');
   select({x:node.x,y:node.y,id,distance:Math.hypot(node.x-x,node.y-y),type:'node'},0);
  }
  // Evitar que un nodo móvil se imante a los muros que él mismo arrastra.
  if(!closest||closest.priority!==0){
   for(const [id,wall] of Object.entries(walls)){
    if(wall.startNodeId===excludeNodeId||wall.endNodeId===excludeNodeId)continue;
    const start=nodes[wall.startNodeId],end=nodes[wall.endNodeId];
    if(!start||!end)continue;
    const projection=getPointSegmentProjection(x,y,start,end);
    if(Math.hypot(end.x-start.x,end.y-start.y)<1)continue;
    select({...projection,id,type:'wall'},1);
   }
  }
  if(!closest)return {x:Math.round(x),y:Math.round(y),snappedTo:null};
  return {
   x:Math.round(closest.x),y:Math.round(closest.y),
   snappedTo:{type:closest.type,id:closest.id,...(closest.type==='wall'?{t:closest.t}:{})}
  };
 }
 return {getPointSegmentProjection,getSnappedPosition};
});
