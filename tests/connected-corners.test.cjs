'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const ISO=require('../src/iso-presets.js'),FP=require('../src/floor-plan-core.js');
const SNAP=require('../src/snap-engine.js'),C=require('../src/connected-corners.js');
test('all ISO templates use shared IDs at 4 closed corners',()=>{
 for(const name of Object.keys(ISO.PRESETS)){
  const s=ISO.buildPreset(name),topology=C.validateClosedPerimeter(s);
  assert.equal(topology.closed,true);assert.deepEqual(topology.nodeIds,['n1','n2','n3','n4']);
  assert.equal(s.walls.w1.endNodeId,s.walls.w2.startNodeId);
  assert.equal(s.walls.w2.endNodeId,s.walls.w3.startNodeId);
  assert.equal(s.walls.w3.endNodeId,s.walls.w4.startNodeId);
  assert.equal(s.walls.w4.endNodeId,s.walls.w1.startNodeId);
 }
});
test('moving a shared corner updates both adjoining walls from one node',()=>{
 const s=ISO.buildPreset('20ft'),out=C.moveConnectedNode(s,'n4',150,2450,{threshold:150});
 const n=out.state;
 assert.equal(n.nodes.n4.x,150);assert.equal(n.nodes.n4.y,2450);
 assert.equal(n.walls.w3.endNodeId,'n4');assert.equal(n.walls.w4.startNodeId,'n4');
 assert.equal(n.metadata.model,undefined);
 assert.equal(n.revision,1);assert.equal(s.nodes.n4.x,0);
 assert.equal(C.validateClosedPerimeter(n).closed,true);
});
test('a broken wall-node connection fails topology check',()=>{
 const s=ISO.buildPreset('20ft');s.walls.w4.startNodeId='n2';
 assert.throws(()=>C.validateClosedPerimeter(s),/Esquina desconectada/);
});
test('rejects merging distinct corners without rewiring walls',()=>{
 const s=ISO.buildPreset('20ft'),original=JSON.stringify(s);
 assert.throws(()=>C.moveConnectedNode(s,'n4',0,0,{threshold:150}),/fusionar/);
 assert.equal(JSON.stringify(s),original);
});
test('rejects crossing perimeter and preserves source state',()=>{
 const s=ISO.buildPreset('20ft'),old=JSON.stringify(s);
 assert.throws(()=>C.moveConnectedNode(s,'n4',6500,1800,{threshold:0}),/cruzan|área/);
 assert.equal(JSON.stringify(s),old);
});
test('rejects move that violates a window position constraint',()=>{
 const s=ISO.buildPreset('20ft');s.openings.op1={id:'op1',wallId:'w3',type:'ventana',width:1400,height:900,offsetFromStart:4000,sillHeight:900};
 assert.throws(()=>C.moveConnectedNode(s,'n4',5000,2438,{threshold:0}),/excede/);
});
test('PRO browser code parses and contains connected drag handlers',()=>{
 const html=fs.readFileSync('cubikeitor-cpq-pro.html','utf8');
 assert(html.includes('src/connected-corners.js'));
 assert(html.includes("addEventListener('pointermove'"));
 assert(html.includes("addEventListener('pointercancel'"));
 assert(html.includes('CORNERS.moveConnectedNode'));
 for(const [,code] of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))assert.doesNotThrow(()=>new vm.Script(code));
});
