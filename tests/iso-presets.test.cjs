'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const ISO=require('../src/iso-presets.js'),FP=require('../src/floor-plan-core.js'),CPQ=require('../src/cpq-parser.js'),CUT=require('../src/wall-cutouts.js');
test('ISO external nominal dimensions match templates provided',()=>{
 const expected={
  '20ft':[6058,2438,2591],
  '40ft':[12192,2438,2591],
  '20ftHC':[6058,2438,2896],
  'oficinaModular':[6000,3000,2600]
 };
 for(const [name,d] of Object.entries(expected)){
  const state=ISO.buildPreset(name);
  assert.equal(FP.validateProject(state),true);
  assert.deepEqual(Object.values(state.metadata.nominalExteriorDimensionsMm),d);
  assert.equal(state.walls.w1.height,d[2]);
  assert.equal(Math.hypot(state.nodes.n2.x-state.nodes.n1.x,state.nodes.n2.y-state.nodes.n1.y),d[0]);
  assert.equal(state.nodes.n3.y,d[1]);
 }
});
test('preset selection never shares mutable nodes or wall state',()=>{
 const one=ISO.buildPreset('40ft'),two=ISO.buildPreset('40ft');
 one.nodes.n2.x=1000;assert.equal(two.nodes.n2.x,12192);
});
test('CPQ placement on ISO 20ft rejects overflow atomically',()=>{
 const s=ISO.buildPreset('20ft'),p=CPQ.parseOrder('dos puertas, tres ventanas y un vano');
 const placed=CPQ.distributeOnWalls(s,p.items);
 const next={...s,openings:placed};
 assert.equal(FP.validateProject(next),true);
 for(const wall of Object.values(next.walls)){
  const openings=Object.values(next.openings).filter(o=>o.wallId===wall.id);
  assert.doesNotThrow(()=>CUT.cutWallSegments(wall,next.nodes,openings));
 }
 assert.deepEqual(s.openings,{});
});
test('oversized requests fail on ISO perimeter without changing model',()=>{
 const s=ISO.buildPreset('20ft'),initial=JSON.stringify(s);
 assert.throws(()=>CPQ.distributeOnWalls(s,CPQ.parseOrder('20 puertas').items),/no caben/);
 assert.equal(JSON.stringify(s),initial);
});
test('invalid preset throws instead of falling back silently',()=>{
 assert.throws(()=>ISO.buildPreset('45ft'),/Modelo desconocido/);
});
