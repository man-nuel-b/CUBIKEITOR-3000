/* Frame/glazing placeholders anchored in the real wall opening. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.CubikeitorVectorOpenings=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const SCALE=.001;
const V=typeof module==='object'&&module.exports?require('./vector-wall-mesh.js'):null;
const assert=(v,m)=>{if(!v)throw Error(m)};
const valid=(n,min,max)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
function getOpeningTransform(opening,wall,nodes,vector){
 const VM=vector||V||(typeof globalThis!=='undefined'?globalThis.CubikeitorVectorWalls:null);
 assert(VM,'Motor de muros vectoriales no disponible');
 assert(opening&&wall&&opening.wallId===wall.id,'Abertura y muro incompatibles');
 const t=VM.getWallTransform(wall,nodes);
 assert(['ventana','puerta'].includes(opening.type),'Tipo inválido');
 for(const [name,value,min,max] of [['ancho',opening.width,300,6000],['alto',opening.height,300,5000],['offset',opening.offsetFromStart,0,1000000],['antepecho',opening.sillHeight,0,10000]]){
  assert(valid(value,min,max),'Dimensión '+name+' inválida');
 }
 assert(opening.offsetFromStart>=100&&opening.offsetFromStart+opening.width<=t.lengthMm-100,'Abertura fuera del muro');
 assert(opening.sillHeight+opening.height<=t.heightMm-100,'Altura de abertura fuera del muro');
 assert(opening.type!=='puerta'||opening.sillHeight===0,'Puerta fuera de nivel');
 // Local +Z follows wall axis; local +X is perpendicular to wall.
 const distance=(opening.offsetFromStart+opening.width/2)/t.lengthMm;
 const a=nodes[wall.startNodeId],b=nodes[wall.endNodeId];
 return {
  center:{x:(a.x+(b.x-a.x)*distance)*SCALE,y:(opening.sillHeight+opening.height/2)*SCALE,z:(a.y+(b.y-a.y)*distance)*SCALE},
  angleY:t.angleY,
  widthM:opening.width*SCALE,heightM:opening.height*SCALE,depthM:Math.min(.045,t.thicknessM*.5),
  kind:opening.type
 };
}
function createVectorOpeningMesh(opening,wall,nodes,three,vector){
 const THREE=three||(typeof globalThis!=='undefined'?globalThis.THREE:null);
 assert(THREE&&THREE.BoxGeometry&&THREE.MeshStandardMaterial&&THREE.Mesh,'Three.js no disponible');
 const t=getOpeningTransform(opening,wall,nodes,vector);
 // Important: BoxGeometry dimensions are X (wall thickness), Y (height), Z (wall length).
 const geometry=new THREE.BoxGeometry(t.depthM,t.heightM,t.widthM);
 const material=new THREE.MeshStandardMaterial({color:t.kind==='ventana'?0x88ccff:0x8b5a2b,transparent:t.kind==='ventana',opacity:t.kind==='ventana'?.35:1,roughness:t.kind==='ventana'?.15:.55,metalness:.05,side:THREE.DoubleSide});
 const mesh=new THREE.Mesh(geometry,material);
 mesh.position.set(t.center.x,t.center.y,t.center.z);
 mesh.rotation.y=t.angleY;
 mesh.castShadow=t.kind==='puerta';mesh.receiveShadow=true;
 mesh.userData={type:'opening',openingId:opening.id,wallId:wall.id,openingKind:opening.type};
 return mesh;
}
function updateVectorOpeningMesh(previous,opening,wall,nodes,three,vector){
 const next=createVectorOpeningMesh(opening,wall,nodes,three,vector);
 if(previous){const parent=previous.parent;if(parent){parent.remove(previous);parent.add(next);}previous.geometry?.dispose?.();previous.material?.dispose?.();}
 return next;
}
return {SCALE,getOpeningTransform,createVectorOpeningMesh,updateVectorOpeningMesh};
});
