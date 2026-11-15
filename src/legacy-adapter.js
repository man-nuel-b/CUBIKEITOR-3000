/* Adapter for the existing Cubikeitor app.js project shape.
 * Pure read-only projection: never write the adapted model back over the original.
 * Existing BOM, APU and Supabase systems remain authoritative until fully migrated.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.CubikeitorLegacyAdapter=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const clone=x=>JSON.parse(JSON.stringify(x));
const asMm=n=>Math.round(Number(n)*1000);
const FACES=new Set(['A','B','C','D']);
const isSafeCount=n=>Number.isSafeInteger(Number(n))&&Number(n)>=0&&Number(n)<=100;
function projectLegacy(legacy,data,dimensionProvider){
 if(!legacy||typeof legacy!=='object'||!data?.containers?.[legacy.container])throw Error('Proyecto o contenedor original desconocido');
 const c=data.containers[legacy.container];
 const model={schemaVersion:1,revision:Number.isSafeInteger(legacy.projectMeta?.revision)?legacy.projectMeta.revision:0,projectId:String(legacy.projectMeta?.id||'legacy-unidentified'),container:{lengthMm:asMm(c.length),widthMm:asMm(c.width),heightMm:asMm(c.height)},finish:legacy.finish==='sanitary'?'sanitary':'standard',openings:[],priceListVersion:'legacy-unverified',history:[]};
 const warnings=[];
 if(!['standard','sanitary'].includes(legacy.finish))warnings.push(`Terminación ${legacy.finish} no implementada en la vista nueva`);
 for(const type of ['window','door']){
  const n=legacy.counts?.[type]??0;
  if(!isSafeCount(n))throw Error('Cantidad de '+type+' inválida');
  for(let i=0;i<Number(n);i++){
   const layout=legacy.layout?.[type]?.[i]||{};
   const dims=typeof dimensionProvider==='function'?dimensionProvider(type,i):null;
   const d=dims||legacy.dimensions?.[type]?.[i]||{};
   const face=layout.face|| (type==='window'?'B':'A');
   if(!FACES.has(face))throw Error('Cara inválida en '+type+' '+i);
   const widthMm=asMm(d.width??(type==='window'?1.2:.9));
   const heightMm=asMm(d.height??(type==='window'?1.05:2.1));
   const wallMm=['A','B'].includes(face)?model.container.lengthMm:model.container.widthMm;
   // Cubikeitor legacy stores x at the *centre* of each face; reactive core uses left edge.
   const offsetMm=Math.round(wallMm/2+asMm(layout.x||0)-widthMm/2);
   const nominalWindowCenter=Number(c.height)*.6;
   const bottomMm=type==='door'?0:Math.max(0,asMm(nominalWindowCenter)-Math.floor(heightMm/2));
   model.openings.push({id:`legacy_${type}_${i}`,type,face,widthMm,heightMm,offsetMm,bottomMm});
  }
 }
 const unsupported=Object.entries(legacy.counts||{}).filter(([key,value])=>!['window','door'].includes(key)&&Number(value)>0).map(([key,value])=>`${key}: ${value}`);
 if(unsupported.length)warnings.push('Elementos conservados solo en el proyecto original: '+unsupported.join(', '));
 if(legacy.finish==='basic')warnings.push('Vista 3D reactiva utiliza apariencia standard en lugar de basic');
 // The projection can be invalid when original uses different construction collision rules.
 // Never repair geometry silently or discard the source project.
 return {model,source:clone(legacy),warnings,partial:unsupported.length>0||warnings.length>0};
}
function checkCompatibility(legacy,data,dimensionProvider,core){const projected=projectLegacy(legacy,data,dimensionProvider);try{core.validateState(projected.model);return {...projected,compatible:true};}catch(error){return {...projected,compatible:false,warnings:[...projected.warnings,'Geometría no compatible: '+error.message]};}}
return{projectLegacy,checkCompatibility};
});
