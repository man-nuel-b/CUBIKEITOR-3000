/** In-memory custom APU library and project assignments.
 * All money is stored in integer cents; quantities in thousandths.
 * No persistence or external prices.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.CubikeitorAPU=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const clone=x=>JSON.parse(JSON.stringify(x));
const validId=id=>typeof id==='string'&&/^[A-Za-z0-9_-]{1,64}$/.test(id);
const safe=(n,min,max)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
const expect=(condition,message)=>{if(!condition)throw Error(message)};
const MAX_CENTS=1_000_000_000_000;
const UNITS=['global','ml','m²','unidad','corte'];
function withDefaults(state){expect(state&&typeof state==='object','Proyecto inválido');const next=clone(state);next.apuLibrary??={};next.apuApplied??={};return next;}
function validateLibrary(state){
 expect(state.apuLibrary&&typeof state.apuLibrary==='object'&&!Array.isArray(state.apuLibrary),'Biblioteca APU inválida');
 expect(state.apuApplied&&typeof state.apuApplied==='object'&&!Array.isArray(state.apuApplied),'Partidas aplicadas inválidas');
 expect(Object.keys(state.apuLibrary).length<=200,'Biblioteca APU excede 200 partidas');
 for(const [id,apu] of Object.entries(state.apuLibrary)){
  expect(validId(id)&&apu.id===id,'ID APU inválido');
  expect(typeof apu.name==='string'&&apu.name.trim().length>=2&&apu.name.length<=120,'Nombre de APU inválido');
  expect(UNITS.includes(apu.unit),'Unidad de APU inválida');
  expect(Array.isArray(apu.materials)&&apu.materials.length>=1&&apu.materials.length<=30,'Materiales APU inválidos');
  for(const m of apu.materials){
   expect(typeof m.name==='string'&&m.name.trim().length>=2&&m.name.length<=100,'Nombre de material inválido');
   expect(safe(m.qtyMilli,1,1_000_000),'Cantidad de material inválida');
   expect(safe(m.unitCostCents,0,MAX_CENTS),'Costo unitario inválido');
  }
  calculateUnitCostCents(apu);
 }
 for(const [id,item] of Object.entries(state.apuApplied)){
  expect(validId(id)&&item.id===id&&validId(item.apuId)&&state.apuLibrary[item.apuId],'APU aplicado inexistente');
  expect(safe(item.qtyMilli,1,1_000_000),'Cantidad aplicada inválida');
 }
 return true;
}
function checkedTotal(value){expect(Number.isSafeInteger(value)&&value>=0&&value<=MAX_CENTS,'Subtotal APU excede el límite');return value;}
function lineCostCents(qtyMilli,unitCostCents){return checkedTotal(Math.round(qtyMilli*unitCostCents/1000));}
function calculateUnitCostCents(apu){return checkedTotal(apu.materials.reduce((total,m)=>checkedTotal(total+lineCostCents(m.qtyMilli,m.unitCostCents)),0));}
function normalizeApu(record,id){
 expect(record&&typeof record==='object','Datos de APU inválidos');
 const apu={id,name:String(record.name??'').trim(),unit:record.unit,materials:(record.materials||[]).map(m=>({
  name:String(m.name??'').trim(),qtyMilli:m.qtyMilli,unitCostCents:m.unitCostCents
 }))};
 return apu;
}
function commit(state,change){
 const next=withDefaults(state);change(next);validateLibrary(next);
 next.revision=state.revision+1;return next;
}
function createApu(state,record){
 return commit(state,next=>{
  let idx=1;while(next.apuLibrary['apu'+idx])idx++;
  const id='apu'+idx;next.apuLibrary[id]=normalizeApu(record,id);
 });
}
function updateApu(state,id,record){
 return commit(state,next=>{expect(next.apuLibrary[id],'APU no encontrado');next.apuLibrary[id]=normalizeApu(record,id);});
}
function deleteApu(state,id){
 return commit(state,next=>{expect(next.apuLibrary[id],'APU no encontrado');delete next.apuLibrary[id];for(const [key,item] of Object.entries(next.apuApplied))if(item.apuId===id)delete next.apuApplied[key];});
}
function applyApu(state,apuId,qtyMilli=1000){
 return commit(state,next=>{
  expect(next.apuLibrary[apuId],'APU no encontrado');
  let i=1;while(next.apuApplied['item'+i])i++;
  const id='item'+i;next.apuApplied[id]={id,apuId,qtyMilli};
 });
}
function updateApplied(state,id,qtyMilli){return commit(state,next=>{expect(next.apuApplied[id],'Partida aplicada no encontrada');next.apuApplied[id].qtyMilli=qtyMilli;});}
function removeApplied(state,id){return commit(state,next=>{expect(next.apuApplied[id],'Partida aplicada no encontrada');delete next.apuApplied[id];});}
function calculateApplied(state){
 const next=withDefaults(state);validateLibrary(next);
 const lines=Object.values(next.apuApplied).map(item=>{
  const apu=next.apuLibrary[item.apuId],unitPriceCents=calculateUnitCostCents(apu);
  return {id:item.id,apuId:apu.id,name:apu.name,unit:apu.unit,qtyMilli:item.qtyMilli,unitPriceCents,
   subtotalCents:lineCostCents(item.qtyMilli,unitPriceCents)};
 });
 const subtotalCents=checkedTotal(lines.reduce((s,l)=>checkedTotal(s+l.subtotalCents),0));
 return {lines,subtotalCents};
}
return {UNITS,withDefaults,validateLibrary,calculateUnitCostCents,createApu,updateApu,deleteApu,applyApu,updateApplied,removeApplied,calculateApplied};
});
