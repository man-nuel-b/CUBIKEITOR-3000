'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const A=require('../src/apu-engine.js'),ISO=require('../src/iso-presets.js'),F=require('../src/floor-plan-core.js');
const initial=()=>A.withDefaults(ISO.buildPreset('20ft'));
const sample=()=>({name:'Corte estructural y refuerzo',unit:'corte',materials:[{name:'Perfil tubular',qtyMilli:2000,unitCostCents:1200000},{name:'Disco de corte',qtyMilli:1000,unitCostCents:650000},{name:'Mano de obra',qtyMilli:1000,unitCostCents:2500000}]});
test('register APU preserves input and does not charge the quote before application',()=>{
 const s=initial(),a=A.createApu(s,sample());
 assert.equal(a.apuLibrary.apu1.name,'Corte estructural y refuerzo');
 assert.equal(A.calculateUnitCostCents(a.apuLibrary.apu1),5550000);
 assert.equal(A.calculateApplied(a).subtotalCents,0);
 assert.deepEqual(s.apuLibrary,{});
 assert.equal(a.revision,s.revision+1);
 assert.equal(F.validateProject(a),true);
});
test('costs remain exact integer cents for fractional quantities',()=>{
 let s=A.createApu(initial(),{name:'Retiro de acero',unit:'m²',materials:[{name:'Planchas',qtyMilli:1500,unitCostCents:1001}]});
 s=A.applyApu(s,'apu1',2500);
 const calc=A.calculateApplied(s);
 assert.equal(calc.lines[0].unitPriceCents,1502);
 assert.equal(calc.subtotalCents,3755);
 assert.equal(Number.isSafeInteger(calc.subtotalCents),true);
});
test('editing a library APU recalculates currently applied line',()=>{
 let s=A.createApu(initial(),sample());s=A.applyApu(s,'apu1',2000);
 assert.equal(A.calculateApplied(s).subtotalCents,11100000);
 const edited={...sample(),materials:[{name:'Refuerzo',qtyMilli:1000,unitCostCents:1200000}]};
 s=A.updateApu(s,'apu1',edited);
 assert.equal(A.calculateApplied(s).subtotalCents,2400000);
 assert.equal(s.apuApplied.item1.apuId,'apu1');
});
test('update applied quantity, remove line, cascade delete APU',()=>{
 let s=A.createApu(initial(),sample());
 s=A.applyApu(s,'apu1');
 s=A.updateApplied(s,'item1',3000);
 assert.equal(A.calculateApplied(s).subtotalCents,16650000);
 const removed=A.removeApplied(s,'item1');
 assert.equal(A.calculateApplied(removed).subtotalCents,0);
 const deleted=A.deleteApu(s,'apu1');
 assert.deepEqual(deleted.apuLibrary,{});assert.deepEqual(deleted.apuApplied,{});
 assert(s.apuLibrary.apu1);
});
test('invalid names, costs, units and references fail without mutation',()=>{
 const s=initial(),serialized=JSON.stringify(s);
 for(const rec of [
  {...sample(),name:''},
  {...sample(),unit:'kg_invalid'},
  {...sample(),materials:[{name:'Perfil',qtyMilli:-1,unitCostCents:100}]},
  {...sample(),materials:[{name:'Perfil',qtyMilli:1000,unitCostCents:1.2}]}
 ])assert.throws(()=>A.createApu(s,rec));
 assert.throws(()=>A.applyApu(s,'missing'));
 assert.equal(JSON.stringify(s),serialized);
});
test('snapshot is not an external persistence API',()=>{
 let s=A.createApu(initial(),sample());const another=initial();
 assert.deepEqual(another.apuLibrary,{});
 assert.equal(Object.keys(s.apuLibrary).length,1);
});
test('PRO HTML includes functional APU inputs and parseable script',()=>{
 const html=fs.readFileSync('cubikeitor-cpq-pro.html','utf8');
 for(const id of ['apu-library','apu-applied','apu-name','apu-materials','apu-unit','apu-save','apu-qty'])assert(html.includes('id="'+id+'"'));
 assert(html.includes('src/apu-engine.js'));
 const matches=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
 assert(matches.length>0);
 for(const m of matches)assert.doesNotThrow(()=>new vm.Script(m[1]));
});
