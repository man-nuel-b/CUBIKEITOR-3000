'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fp=require('../src/floor-plan-core.js');
const sample=()=>structuredClone(fp.initialProjectState);
test('sample free plan validates and yields wall metadata',()=>{
 const state=sample();assert.equal(fp.validateProject(state),true);
 const wall=fp.getWallMetrics(state,'w1');
 assert.equal(wall.lengthMm,6000);assert.equal(wall.openings.length,1);
 assert.equal(wall.grossAreaM2,14.4);assert.equal(wall.openingAreaM2,1.26);
 assert.equal(wall.netAreaM2,13.14);
});
test('addOpeningToWall creates immutable revision and updates only target wall',()=>{
 const s=sample();
 const opening={id:'op2',wallId:'w2',type:'ventana',width:900,height:800,offsetFromStart:500,sillHeight:1000};
 const next=fp.addOpeningToWall(s,opening);
 assert.equal(s.revision,0);assert.equal(s.openings.op2,undefined);
 assert.equal(next.revision,1);assert.equal(next.openings.op2.wallId,'w2');
 assert.equal(fp.getWallMetrics(next,'w2').openingAreaM2,.72);
 assert.equal(fp.getWallMetrics(next,'w1').openingAreaM2,1.26);
});
test('updating an existing opening checks clearance without self-collision',()=>{
 const s=sample();
 const next=fp.addOpeningToWall(s,{...s.openings.op1,width:1400});
 assert.equal(next.openings.op1.width,1400);assert.equal(s.openings.op1.width,1200);
});
test('invalid wall and node references are rejected',()=>{
 const s=sample();
 assert.throws(()=>fp.addOpeningToWall(s,{id:'bad',wallId:'missing',type:'ventana',width:800,height:800,offsetFromStart:500,sillHeight:900}),/no encontrado/);
 const broken=sample();delete broken.nodes.n2;
 assert.throws(()=>fp.validateProject(broken),/inexistente/);
});
test('out-of-wall, negative, fractional, and too-tall openings are rejected',()=>{
 const s=sample(),o={id:'op2',wallId:'w2',type:'ventana',width:900,height:800,offsetFromStart:500,sillHeight:1000};
 for(const x of [{...o,offsetFromStart:3500},{...o,width:-1},{...o,width:900.5},{...o,height:2000},{...o,offsetFromStart:-100}]){
  assert.throws(()=>fp.addOpeningToWall(s,x));
 }
 assert.equal(s.revision,0);
});
test('overlap and minimum separation on the same wall are enforced',()=>{
 const s=sample(),o={id:'op2',wallId:'w1',type:'ventana',width:1000,height:1050,offsetFromStart:1400,sillHeight:900};
 assert.throws(()=>fp.addOpeningToWall(s,o),/superpuestas/);
 assert.doesNotThrow(()=>fp.addOpeningToWall(s,{...o,offsetFromStart:1800}));
});
test('doors must start at floor level',()=>{
 const s=sample();
 assert.throws(()=>fp.addOpeningToWall(s,{id:'d1',wallId:'w2',type:'puerta',width:900,height:2000,offsetFromStart:500,sillHeight:40}),/nivel de piso/);
 const next=fp.addOpeningToWall(s,{id:'d1',wallId:'w2',type:'puerta',width:900,height:2000,offsetFromStart:500,sillHeight:0});
 assert.equal(next.openings.d1.sillHeight,0);
});
test('moving a shared node updates both walls and keeps opening relative',()=>{
 const s=sample(),next=fp.moveNode(s,'n2',{x:7000,y:0});
 assert.equal(next.revision,1);
 assert.equal(fp.getWallGeometry(next,'w1').lengthMm,7000);
 assert.equal(fp.getWallGeometry(next,'w2').lengthMm,Math.hypot(-1000,4000));
 assert.equal(next.openings.op1.offsetFromStart,500);
 assert.equal(s.nodes.n2.x,6000);
});
test('moving a node to invalidate a connected wall rejects the change',()=>{
 const s=sample();
 assert.throws(()=>fp.moveNode(s,'n2',{x:1000,y:0}),/excede el largo/);
 assert.equal(s.nodes.n2.x,6000);
 assert.throws(()=>fp.moveNode(s,'n2',{x:0,y:0}),/al menos 300/);
});
test('store undo and redo preserve monotonic revision',()=>{
 const store=fp.createFloorPlanStore();
 store.moveNode('n2',{x:7000,y:0});
 const revision=store.getState().revision;
 assert.equal(store.undo(),true);
 assert.equal(store.getState().nodes.n2.x,6000);
 assert.equal(store.getState().revision,revision+1);
 assert.equal(store.redo(),true);
 assert.equal(store.getState().nodes.n2.x,7000);
 assert.equal(store.getState().revision,revision+2);
});
