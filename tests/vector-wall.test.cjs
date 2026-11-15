'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const vector=require('../src/vector-wall-mesh.js');
const fp=require('../src/floor-plan-core.js');
function stubThree(){
 class BoxGeometry{
  constructor(...size){this.size=size;this.translations=[];this.disposed=false;}
  translate(...v){this.translations.push(v);}
  dispose(){this.disposed=true;}
 }
 class MeshStandardMaterial{constructor(params){this.params=params;this.disposed=false;}dispose(){this.disposed=true;}}
 class Mesh{
  constructor(geometry,material){this.geometry=geometry;this.material=material;this.position={set:(x,y,z)=>{this.xyz=[x,y,z];}};this.rotation={y:0};this.userData={};this.parent=null;}
 }
 return {BoxGeometry,MeshStandardMaterial,Mesh};
}
test('wall orientation and dimensions: X-axis, Z-axis, reverse and diagonal',()=>{
 const s=fp.initialProjectState, expected=[
  ['w1',[.12,2.4,6],Math.PI/2,[0,0,0]],
  ['w2',[.12,2.4,4],0,[6,0,0]],
  ['w3',[.12,2.4,6],-Math.PI/2,[6,0,4]],
  ['w4',[.12,2.4,4],Math.PI,[0,0,4]],
 ];
 for(const [id,size,angle,position] of expected){
  const m=vector.createVectorWallMesh(s.walls[id],s.nodes,stubThree());
  assert.deepEqual(m.geometry.size,size);
  assert(Math.abs(Math.atan2(Math.sin(m.rotation.y-angle),Math.cos(m.rotation.y-angle)))<1e-9);
  assert.deepEqual(m.xyz,position);
  assert.equal(m.userData.wallId,id);
  assert.deepEqual(m.geometry.translations,[[0,1.2,size[2]/2]]);
 }
 const diagonal=vector.getWallTransform({id:'diag',startNodeId:'n1',endNodeId:'n3',height:2400,thickness:120},s.nodes);
 assert.equal(diagonal.lengthMm,Math.hypot(6000,4000));
 assert(Math.abs(diagonal.angleY-Math.atan2(6000,4000))<1e-9);
});
test('updated node creates a new mesh and disposes old resources',()=>{
 const original=fp.initialProjectState;
 const three=stubThree();
 const parent={children:[],remove(m){this.children=this.children.filter(x=>x!==m);m.parent=null;},add(m){this.children.push(m);m.parent=this;}};
 const first=vector.createVectorWallMesh(original.walls.w1,original.nodes,three);parent.add(first);
 const moved=fp.moveNode(original,'n2',{x:7000,y:0});
 const second=vector.updateVectorWallMesh(first,moved.walls.w1,moved.nodes,three);
 assert.equal(second.geometry.size[2],7);
 assert.equal(first.geometry.disposed,true);
 assert.equal(first.material.disposed,true);
 assert.equal(parent.children.length,1);
 assert.equal(parent.children[0],second);
});
test('invalid positions and degenerate walls are rejected',()=>{
 const s=fp.initialProjectState,three=stubThree(),wall=s.walls.w1;
 assert.throws(()=>vector.createVectorWallMesh(wall,{},three),/Nodos inválidos/);
 assert.throws(()=>vector.createVectorWallMesh(wall,{...s.nodes,n2:{id:'n2',x:0,y:0}},three),/demasiado corto/);
 assert.throws(()=>vector.createVectorWallMesh({...wall,height:0},s.nodes,three),/Altura/);
 assert.throws(()=>vector.createVectorWallMesh(wall,s.nodes,{}),/Three.js/);
});
