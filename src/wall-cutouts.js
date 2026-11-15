/* Rectangular cutouts in vector walls. Coordinates mm; meshes in metres. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.CubikeitorWallCutouts=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const V=typeof module==='object'&&module.exports?require('./vector-wall-mesh.js'):null;
const SCALE=.001;
const valid=(n,min,max)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
const assert=(v,m)=>{if(!v)throw Error(m);};
function cutWallSegments(wall,nodes,openings,vector){
 const VM=vector||V||(typeof globalThis!=='undefined'?globalThis.CubikeitorVectorWalls:null);
 assert(VM,'Motor de muros vectoriales no disponible');
 const t=VM.getWallTransform(wall,nodes);
 const holes=(openings||[]).map(o=>{
  assert(o.wallId===wall.id,'La abertura pertenece a otro muro');
  assert(['ventana','puerta','vano'].includes(o.type),'Tipo de abertura inválido');
  assert(valid(o.offsetFromStart,0,1000000)&&valid(o.sillHeight,0,10000)&&valid(o.width,300,6000)&&valid(o.height,300,5000),'Dimensiones o posición de abertura inválidas');
  assert(o.offsetFromStart>=100&&o.offsetFromStart+o.width<=t.lengthMm-100,'Abertura fuera del muro');
  assert(o.sillHeight+o.height<=wall.height-100,'Abertura supera altura del muro');
  assert((o.type!=='puerta'&&o.type!=='vano')||o.sillHeight===0,'Puerta elevada');
  return {z0:o.offsetFromStart,z1:o.offsetFromStart+o.width,y0:o.sillHeight,y1:o.sillHeight+o.height,id:o.id};
 });
 for(let i=0;i<holes.length;i++)for(let j=i+1;j<holes.length;j++){
  const a=holes[i],b=holes[j];
  assert(!(a.z0<b.z1+80&&b.z0<a.z1+80&&a.y0<b.y1+80&&b.y0<a.y1+80),'Aberturas superpuestas');
 }
 const cuts=[0,t.lengthMm,...holes.flatMap(h=>[h.z0,h.z1])].sort((a,b)=>a-b);
 const zCuts=cuts.filter((v,i)=>i===0||v-cuts[i-1]>1e-7);
 const cells=[];
 for(let i=0;i<zCuts.length-1;i++){
  const z0=zCuts[i],z1=zCuts[i+1];
  if(z1-z0<1e-7)continue;
  const mid=(z0+z1)/2;
  const inStrip=holes.filter(h=>mid>h.z0&&mid<h.z1).sort((a,b)=>a.y0-b.y0);
  let y0=0;
  for(const h of inStrip){
   if(h.y0>y0+1e-7)cells.push({z0,z1,y0,y1:h.y0});
   y0=Math.max(y0,h.y1);
  }
  if(y0<wall.height-1e-7)cells.push({z0,z1,y0,y1:wall.height});
 }
 const areaMm2=cells.reduce((sum,c)=>sum+(c.z1-c.z0)*(c.y1-c.y0),0);
 const expected=t.lengthMm*wall.height-holes.reduce((sum,h)=>sum+(h.z1-h.z0)*(h.y1-h.y0),0);
 assert(Math.abs(areaMm2-expected)<1e-5,'Área de recorte inconsistente');
 return {transform:t,segments:cells,netAreaMm2:areaMm2,openings:holes};
}
function createCutWallMesh(wall,nodes,openings,three,vector){
 const THREE=three||(typeof globalThis!=='undefined'?globalThis.THREE:null);
 assert(THREE&&THREE.Group&&THREE.Mesh&&THREE.BoxGeometry&&THREE.MeshStandardMaterial,'Three.js no disponible');
 const layout=cutWallSegments(wall,nodes,openings,vector);
 const group=new THREE.Group();
 const t=layout.transform;
 group.position.set(t.origin.x,0,t.origin.z);
 group.rotation.y=t.angleY;
 group.userData={type:'wall',wallId:wall.id,startNodeId:wall.startNodeId,endNodeId:wall.endNodeId,netAreaMm2:layout.netAreaMm2};
 const material=new THREE.MeshStandardMaterial({color:0xf0f0f0,roughness:.8,metalness:.1});
 for(const segment of layout.segments){
  const height=(segment.y1-segment.y0)*SCALE,length=(segment.z1-segment.z0)*SCALE;
  const geo=new THREE.BoxGeometry(t.thicknessM,height,length);
  const mesh=new THREE.Mesh(geo,material);
  mesh.position.set(0,(segment.y0+segment.y1)*SCALE/2,(segment.z0+segment.z1)*SCALE/2);
  mesh.castShadow=true;mesh.receiveShadow=true;
  mesh.userData={type:'wall',wallId:wall.id};
  group.add(mesh);
 }
 return group;
}
function disposeWallGroup(group){
 if(!group)return;
 const geometries=new Set(),materials=new Set();
 group.traverse?.(obj=>{if(obj.geometry)geometries.add(obj.geometry);const mat=obj.material;if(Array.isArray(mat))mat.forEach(m=>materials.add(m));else if(mat)materials.add(mat)});
 for(const geometry of geometries)geometry.dispose?.();
 for(const material of materials)material.dispose?.();
}
function updateCutWallMesh(previous,wall,nodes,openings,three,vector){
 const next=createCutWallMesh(wall,nodes,openings,three,vector);
 if(previous){const parent=previous.parent;if(parent){parent.remove(previous);parent.add(next);}disposeWallGroup(previous);}
 return next;
}
return {cutWallSegments,createCutWallMesh,updateCutWallMesh,disposeWallGroup};
});
