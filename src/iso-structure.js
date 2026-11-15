/** Non-load-bearing illustrative container frame for the CPQ viewer.
 * 3D rails and corner posts are visualization only, not a structural model.
 * Includes roof and floor visual slabs; no automatic structural reinforcements.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.CubikeitorISOStructure=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function createISOFrame(dim,three){
 const T=three||(typeof globalThis!=='undefined'?globalThis.THREE:null);
 if(!T||!T.Group||!T.BoxGeometry||!T.MeshStandardMaterial||!T.Mesh)throw Error('Three.js no disponible');
 if(!dim||![dim.length,dim.width,dim.height].every(n=>Number.isSafeInteger(n)&&n>=1000&&n<=20000))throw Error('Dimensiones de contenedor inválidas');
 const l=dim.length/1000,w=dim.width/1000,h=dim.height/1000;
 const frame=new T.Group();
 frame.userData={type:'containerFrame',note:'Estructura referencial no certificada'};
 const steel=new T.MeshStandardMaterial({color:0x284963,metalness:0.55,roughness:0.38});
 const floorMaterial=new T.MeshStandardMaterial({color:0x7a654b,roughness:0.85});
 const roofMaterial=new T.MeshStandardMaterial({color:0x61768a,metalness:0.32,roughness:0.72,transparent:true,opacity:0.32,depthWrite:false,side:T.DoubleSide});
 function bar(x,y,z,sx,sy,sz,material){
  const g=new T.BoxGeometry(sx,sy,sz),m=new T.Mesh(g,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;frame.add(m);return m;
 }
 const post=.11,rail=.09;
 for(const x of [0,l])for(const z of [0,w])bar(x,h/2,z,post,h,post,steel);
 for(const y of [0,h]) {
  for(const z of [0,w])bar(l/2,y,z,l,rail,rail,steel);
  for(const x of [0,l])bar(x,y,w/2,rail,rail,w,steel);
 }
 bar(l/2,.06,w/2,l-.14,.11,w-.14,floorMaterial);
 bar(l/2,h-.035,w/2,l,.065,w,roofMaterial);
 return frame;
}
function disposeFrame(group){
 if(!group)return;
 const materials=new Set();
 group.traverse?.(o=>{o.geometry?.dispose?.();const m=o.material;if(m)materials.add(m);});
 materials.forEach(m=>m.dispose?.());
}
return {createISOFrame,disposeFrame};
});
