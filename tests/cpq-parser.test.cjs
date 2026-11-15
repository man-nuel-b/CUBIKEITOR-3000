'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const P=require('../src/cpq-parser.js'),FP=require('../src/floor-plan-core.js'),C=require('../src/wall-cutouts.js');
const seed=()=>JSON.parse(JSON.stringify(FP.initialProjectState));
test('interpreta cantidades con palabras, dígitos y vano',()=>{
 const p=P.parseOrder('Necesito un contenedor con dos puertas, tres ventanas y un vano de acceso');
 assert.deepEqual(p.summary,{ventana:3,puerta:2,vano:1});
 assert.equal(p.items.length,6);
});
test('interpreta cantidades explícitas en otros órdenes',()=>{
 const p=P.parseOrder('3 ventanas y 2 puertas');
 assert.equal(p.items.length,5);assert.equal(p.summary.ventana,3);assert.equal(p.summary.puerta,2);
});
test('no inventa elementos cuando el texto no nombra aberturas',()=>{
 assert.throws(()=>P.parseOrder('necesito un container estándar'),/No se reconocieron/);
});
test('rechaza pedidos excesivos y cantidades inválidas',()=>{
 assert.throws(()=>P.parseOrder('100 ventanas'),/superior a 24/);
 assert.throws(()=>P.parseOrder('0 puertas'),/inválida/);
});
test('distribuye seis elementos sin solapamiento en perímetro real',()=>{
 const s=seed();const p=P.parseOrder('dos puertas, tres ventanas y un vano');
 s.openings=P.distributeOnWalls(s,p.items);
 assert.equal(Object.keys(s.openings).length,6);
 assert.equal(FP.validateProject(s),true);
 for(const w of Object.values(s.walls))C.cutWallSegments(w,s.nodes,Object.values(s.openings).filter(o=>o.wallId===w.id));
});
test('operación de distribución rechaza petición que no cabe y no muta estado',()=>{
 const s=seed(),before=JSON.stringify(s);
 const p=P.parseOrder('veinte puertas');
 assert.throws(()=>P.distributeOnWalls(s,p.items),/no caben/);
 assert.equal(JSON.stringify(s),before);
});
