'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const I=require('../src/inspector-core.js'),ISO=require('../src/iso-presets.js'),FP=require('../src/floor-plan-core.js');
function seed(){const s=ISO.buildPreset('20ft');s.openings={op1:{id:'op1',wallId:'w1',type:'ventana',width:1200,height:1050,offsetFromStart:700,sillHeight:900},op2:{id:'op2',wallId:'w2',type:'puerta',width:900,height:2100,offsetFromStart:300,sillHeight:0}};return s;}
test('editar muro incrementa revisión sin mutar proyecto original',()=>{
 const s=seed(),n=I.editWall(s,'w1',{height:2800,thickness:180});
 assert.equal(n.walls.w1.height,2800);assert.equal(n.walls.w1.thickness,180);
 assert.equal(n.revision,s.revision+1);assert.equal(s.walls.w1.height,2591);
 assert.equal(n.metadata.model,undefined);
});
test('editar abertura actualiza su posición y respeta márgenes y superposición',()=>{
 const s=seed(),n=I.editOpening(s,'op1',{offsetFromStart:1400,width:1500});
 assert.equal(n.openings.op1.width,1500);assert.equal(s.openings.op1.width,1200);
 assert.throws(()=>I.editOpening(s,'op1',{offsetFromStart:5900}),/excede/);
 assert.throws(()=>I.editOpening(s,'op2',{sillHeight:100}),/nivel de piso/);
});
test('borrar muro elimina sus aberturas y conserva los demás',()=>{
 const s=seed(),n=I.deleteElement(s,'wall','w1');
 assert.equal(n.walls.w1,undefined);assert.equal(n.openings.op1,undefined);
 assert(n.openings.op2);assert.equal(n.metadata.model,undefined);
 assert(s.walls.w1&&s.openings.op1);
});
test('borrar abertura no afecta otras geometrías',()=>{
 const s=seed(),n=I.deleteElement(s,'opening','op1');
 assert.equal(n.openings.op1,undefined);assert(n.openings.op2);
 assert.equal(Object.keys(n.walls).length,4);
});
test('rechaza ids y valores inválidos sin mutación',()=>{
 const s=seed(),str=JSON.stringify(s);
 assert.throws(()=>I.editWall(s,'w1',{thickness:-1}),/Espesor/);
 assert.throws(()=>I.editOpening(s,'op1',{width:1.2}),/Dimensiones/);
 assert.throws(()=>I.deleteElement(s,'wall','missing'),/no encontrado/);
 assert.throws(()=>I.deleteElement(s,'node','n1'),/Tipo/);
 assert.equal(JSON.stringify(s),str);
});
test('raycast prioriza geometría más cercana y reconoce elementos por metadata',()=>{
 const s=seed();const hits=[{object:{userData:{type:'opening',openingId:'op1'}}},{object:{userData:{type:'wall',wallId:'w1'}}}];
 assert.deepEqual(I.resolveHit(hits,s),{type:'opening',id:'op1'});
 assert.deepEqual(I.resolveHit([hits[1]],s),{type:'wall',id:'w1'});
 assert.equal(I.resolveHit([{object:{userData:{type:'containerFrame'}}}],s),null);
});
test('HTML PRO tiene script sintácticamente válido y módulos del visor',()=>{
 const html=fs.readFileSync('cubikeitor-cpq-pro.html','utf8');
 const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
 assert(scripts.length>0);
 for(const [,body] of scripts)assert.doesNotThrow(()=>new vm.Script(body));
 for(const name of ['inspector-core.js','wall-cutouts.js','vector-opening-mesh.js','iso-presets.js','iso-structure.js'])assert(html.includes('src/'+name));
 for(const id of ['inspector','view','iso-apply','ai-process','undo','redo'])assert(html.includes('id="'+id+'"'));
});
