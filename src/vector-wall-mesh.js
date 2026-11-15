/**
 * Geometría 3D de muros vectoriales de CUBIKEITOR 3000.
 * El estado conserva milímetros enteros y Three.js trabaja en metros.
 * Compatible con THREE global (Three.js r128) y CommonJS para pruebas.
 * NOTA: construye un muro macizo; los huecos de ventanas/puertas requieren
 * un generador de geometría con recortes independiente.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 root.CubikeitorVectorWalls=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const SCALE=0.001;
function requireNumber(x,name,min,max){
 if(!Number.isSafeInteger(x)||x<min||x>max)throw Error(name+' inválido (mm enteros)');
}
function getWallTransform(wall,nodes){
 if(!wall||!nodes)throw Error('Datos de muro incompletos');
 const start=nodes[wall.startNodeId],end=nodes[wall.endNodeId];
 if(!start||!end)throw Error('Nodos inválidos para el muro '+String(wall.id));
 for(const [name,value] of [['x inicio',start.x],['y inicio',start.y],['x fin',end.x],['y fin',end.y]]){
  requireNumber(value,name,-1000000,1000000);
 }
 requireNumber(wall.height,'Altura',300,10000);
 requireNumber(wall.thickness,'Espesor',20,1000);
 const dx=end.x-start.x,dz=end.y-start.y;
 const lengthMm=Math.hypot(dx,dz);
 if(!Number.isFinite(lengthMm)||lengthMm<300)throw Error('Muro demasiado corto');
 return {
  wallId:wall.id,
  lengthMm,
  heightMm:wall.height,
  thicknessMm:wall.thickness,
  origin:{x:start.x*SCALE,y:0,z:start.y*SCALE},
  angleY:Math.atan2(dx,dz),
  lengthM:lengthMm*SCALE,
  heightM:wall.height*SCALE,
  thicknessM:wall.thickness*SCALE
 };
}
function createVectorWallMesh(wall,nodes,three){
 const THREE=three||(typeof globalThis!=='undefined'?globalThis.THREE:null);
 if(!THREE||!THREE.BoxGeometry||!THREE.MeshStandardMaterial||!THREE.Mesh)throw Error('Three.js no está disponible');
 const t=getWallTransform(wall,nodes);
 const geometry=new THREE.BoxGeometry(t.thicknessM,t.heightM,t.lengthM);
 // Malla local: su extremo inicial está en (0,0,0) y avanza en +Z.
 geometry.translate(0,t.heightM/2,t.lengthM/2);
 const material=new THREE.MeshStandardMaterial({color:0xf0f0f0,roughness:0.8,metalness:0.1});
 const mesh=new THREE.Mesh(geometry,material);
 mesh.castShadow=true;
 mesh.receiveShadow=true;
 mesh.position.set(t.origin.x,t.origin.y,t.origin.z);
 mesh.rotation.y=t.angleY;
 mesh.userData={type:'wall',wallId:wall.id,startNodeId:wall.startNodeId,endNodeId:wall.endNodeId,sourceLengthMm:t.lengthMm};
 return mesh;
}
function updateVectorWallMesh(previous,wall,nodes,three){
 // Reemplazar malla evita deformaciones acumulativas en cambios repetidos.
 const next=createVectorWallMesh(wall,nodes,three);
 if(previous){
  const parent=previous.parent;
  if(parent){parent.remove(previous);parent.add(next);}
  previous.geometry?.dispose?.();
  previous.material?.dispose?.();
 }
 return next;
}
return {SCALE,getWallTransform,createVectorWallMesh,updateVectorWallMesh};
});
