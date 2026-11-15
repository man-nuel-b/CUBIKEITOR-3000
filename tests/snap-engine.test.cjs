'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const snap=require('../src/snap-engine.js');
const fp=require('../src/floor-plan-core.js');
const s=fp.initialProjectState;
test('nearest node wins instead of object insertion order',()=>{
 const r=snap.getSnappedPosition(120,110,{a:{x:0,y:0},b:{x:115,y:110}}, {},null,200);
 assert.deepEqual(r,{x:115,y:110,snappedTo:{type:'node',id:'b'}});
});
test('node priority over closer wall and exclusion of moving node',()=>{
 const nodes={a:{x:0,y:0},b:{x:1000,y:0},c:{x:500,y:100}};
 const walls={w:{startNodeId:'a',endNodeId:'b'}};
 const hit=snap.getSnappedPosition(505,1,nodes,walls,null,120);
 assert.equal(hit.snappedTo.type,'node');
 assert.equal(hit.snappedTo.id,'c');
 const excluding=snap.getSnappedPosition(501,1,nodes,walls,'c',50);
 assert.equal(excluding.snappedTo.type,'wall');
 assert.deepEqual([excluding.x,excluding.y],[501,0]);
});
test('closest wall selected, not first; point projects to segment ends',()=>{
 const nodes={a:{x:0,y:0},b:{x:1000,y:0},c:{x:0,y:130},d:{x:1000,y:130}};
 const walls={first:{startNodeId:'a',endNodeId:'b'},second:{startNodeId:'c',endNodeId:'d'}};
 const r=snap.getSnappedPosition(500,115,nodes,walls,null,150);
 assert.equal(r.snappedTo.id,'second');
 assert.equal(r.y,130);
 assert.equal(snap.getPointSegmentProjection(1200,90,nodes.a,nodes.b).t,1);
});
test('moving node skips incident walls, keeps integer millimeters and does not mutate',()=>{
 const nodes=structuredClone(s.nodes);
 const result=snap.getSnappedPosition(6010.34,100.6,nodes,s.walls,'n2',150);
 assert.equal(Number.isSafeInteger(result.x),true);
 assert.equal(Number.isSafeInteger(result.y),true);
 assert.notEqual(result.snappedTo?.id,'w1');
 assert.notEqual(result.snappedTo?.id,'w2');
 assert.deepEqual(nodes,s.nodes);
});
test('out of radius and invalid inputs return original rounded point or throw',()=>{
 const r=snap.getSnappedPosition(3200.4,2000.6,s.nodes,s.walls,null,10);
 assert.deepEqual(r,{x:3200,y:2001,snappedTo:null});
 assert.throws(()=>snap.getSnappedPosition(NaN,0,s.nodes,s.walls),/inválida/);
 assert.throws(()=>snap.getSnappedPosition(0,0,s.nodes,s.walls,null,-1),/Umbral/);
});
test('diagonal wall projection produces valid millimeter coordinates',()=>{
 const nodes={a:{x:0,y:0},b:{x:1000,y:1000}};
 const result=snap.getSnappedPosition(507,499,nodes,{w:{startNodeId:'a',endNodeId:'b'}},null,40);
 assert.equal(result.snappedTo.type,'wall');
 assert.deepEqual([result.x,result.y],[503,503]);
});
