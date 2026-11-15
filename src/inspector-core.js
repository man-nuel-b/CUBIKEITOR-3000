/**
 * Validated CPQ inspector edits, immutable and atomic.
 * Changes are committed only after whole-project validation.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 root.CubikeitorInspector=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const F=typeof module==='object'&&module.exports?require('./floor-plan-core.js'):null;
 const validate=(state,core)=>{
  const tool=core||F||(typeof globalThis!=='undefined'?globalThis.CubikeitorFloorPlan:null);
  if(!tool)throw Error('No se encontró el motor de validación');
  tool.validateProject(state);
 };
 const copy=x=>JSON.parse(JSON.stringify(x));
 const check=(yes,msg)=>{if(!yes)throw Error(msg);};
 const integer=(v,min,max)=>Number.isSafeInteger(v)&&v>=min&&v<=max;
 function mutate(state,fn,core){
  validate(state,core);
  const draft=copy(state);
  fn(draft);
  draft.revision=state.revision+1;
  validate(draft,core);
  return draft;
 }
 function editWall(state,id,changes,core){
  return mutate(state,draft=>{
   const wall=draft.walls[id];
   check(wall,'Muro no encontrado: '+id);
   check(changes&&typeof changes==='object','Parámetros de muro inválidos');
   const height=changes.height??wall.height,thickness=changes.thickness??wall.thickness;
   check(integer(height,300,10000),'Altura inválida (300–10000 mm)');
   check(integer(thickness,20,1000),'Espesor inválido (20–1000 mm)');
   wall.height=height;wall.thickness=thickness;
   // Edits detach the preset's structural geometry rather than lying about ISO.
   if(draft.metadata?.model&&(height!==state.walls[id].height||thickness!==state.walls[id].thickness))delete draft.metadata.model;
  },core);
 }
 function editOpening(state,id,changes,core){
  return mutate(state,draft=>{
   const opening=draft.openings[id];
   check(opening,'Abertura no encontrada: '+id);
   check(changes&&typeof changes==='object','Parámetros de abertura inválidos');
   for(const key of ['width','height','offsetFromStart','sillHeight','wallId']){
    if(Object.prototype.hasOwnProperty.call(changes,key))opening[key]=changes[key];
   }
  },core);
 }
 function deleteElement(state,type,id,core){
  return mutate(state,draft=>{
   if(type==='wall'){
    check(draft.walls[id],'Muro no encontrado: '+id);
    delete draft.walls[id];
    for(const [openingId,op] of Object.entries(draft.openings))if(op.wallId===id)delete draft.openings[openingId];
    if(draft.metadata?.model)delete draft.metadata.model;
   }else if(type==='opening'){
    check(draft.openings[id],'Abertura no encontrada: '+id);
    delete draft.openings[id];
   }else throw Error('Tipo de objeto no válido');
  },core);
 }
 function resolveHit(hits,state){
  // Three.js raycasting reports closest geometry first. All cutout children
  // expose wallId. Ignore visual frame, grid, lighting and unknown objects.
  for(const hit of hits||[]){
   const obj=hit.object||hit;
   const meta=obj?.userData||{};
   if(meta.type==='opening'&&state.openings[meta.openingId])return {type:'opening',id:meta.openingId};
   if(meta.type==='wall'&&state.walls[meta.wallId])return {type:'wall',id:meta.wallId};
  }
  return null;
 }
 return {editWall,editOpening,deleteElement,resolveHit};
});
