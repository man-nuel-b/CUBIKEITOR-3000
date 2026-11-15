'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const floor=require('../src/floor-plan-core.js');
const cut=require('../src/wall-cutouts.js');
const mesh=require('../src/vector-opening-mesh.js');
const vector=require('../src/vector-wall-mesh.js');
function mockThree(){
 class BoxGeometry{constructor(...size){this.size=size;this.disposed=false;}dispose(){this.disposed=true;}}
 class MeshStandardMaterial{constructor(options){this.options=options;this.disposed=false;}dispose(){this.disposed=true;}}
 class Mesh{constructor(g,m){this.geometry=g;this.material=m;this.position={set:(...xyz)=>{this.xyz=xyz}};this.rotation={};this.userData={};this.parent=null;} }
 class Group{
  constructor(){this.children=[];this.position={set:(...xyz)=>{this.xyz=xyz}};this.rotation={};this.userData={};this.parent=null;}
  add(c){this.children.push(c);c.parent=this;}remove(c){this.children=this.children.filter(x=>x!==c);c.parent=null;}
  traverse(fn){fn(this);this.children.forEach(fn);}
 }
 return {BoxGeometry,MeshStandardMaterial,Mesh,Group,DoubleSide:2};
}
function state(){return structuredClone(floor.initialProjectState);}
test('cutout removes exactly the window area without deleting the rest of the wall',()=>{
 const s=state(),w=s.walls.w1;
 const cutInfo=cut.cutWallSegments(w,s.nodes,Object.values(s.openings),vector);
 assert.equal(cutInfo.netAreaMm2,13140000);
 assert.equal(cutInfo.segments.reduce((total,c)=>total+(c.z1-c.z0)*(c.y1-c.y0),0),13140000);
 assert(cutInfo.segments.every(c=>c.z1>c.z0&&c.y1>c.y0));
 assert(cutInfo.segments.every(c=>!((c.z0+c.z1)/2>500&&(c.z0+c.z1)/2<1700&&(c.y0+c.y1)/2>900&&(c.y0+c.y1)/2<1950)));
});
test('door has actual opening from floor and recovers its top lintel',()=>{
 let s=state();s=floor.addOpeningToWall(s,{id:'d1',wallId:'w2',type:'puerta',width:900,height:2100,offsetFromStart:500,sillHeight:0});
 const w=s.walls.w2;
 const a=cut.cutWallSegments(w,s.nodes,[s.openings.d1],vector);
 assert.equal(a.netAreaMm2,4000*2400-900*2100);
 assert(a.segments.some(c=>c.z0===500&&c.z1===1400&&c.y0===2100&&c.y1===2400));
 assert(!a.segments.some(c=>c.z0===500&&c.z1===1400&&c.y0===0));
});
test('two openings on one wall preserve net area and avoid overlap',()=>{
 let s=state();s=floor.addOpeningToWall(s,{id:'w2',wallId:'w1',type:'ventana',width:900,height:900,offsetFromStart:2800,sillHeight:900});
 const a=cut.cutWallSegments(s.walls.w1,s.nodes,Object.values(s.openings),vector);
 assert.equal(a.netAreaMm2,14400000-1260000-810000);
 assert.throws(()=>cut.cutWallSegments(s.walls.w1,s.nodes,[s.openings.op1,{...s.openings.w2,offsetFromStart:700}],vector),/superpuestas/);
});
test('window mesh centers using half width and aligns width along wall local Z',()=>{
 const s=state(),o=s.openings.op1,t=mesh.getOpeningTransform(o,s.walls.w1,s.nodes,vector);
 assert.equal(t.center.x,1.1);assert.equal(t.center.z,0);assert.equal(t.center.y,1.425);
 assert.equal(t.angleY,Math.PI/2);
 const m=mesh.createVectorOpeningMesh(o,s.walls.w1,s.nodes,mockThree(),vector);
 assert.deepEqual(m.geometry.size,[.045,1.05,1.2]);assert.equal(m.userData.openingId,'op1');
});
test('wall recut after changing a shared node disposes the previous mesh',()=>{
 const three=mockThree(),s=state(),w=s.walls.w1;
 const old=cut.createCutWallMesh(w,s.nodes,[s.openings.op1],three,vector);
 const parent=new three.Group();parent.add(old);
 const geometries=old.children.map(m=>m.geometry);
 const moved=floor.moveNode(s,'n2',{x:7000,y:0});
 const next=cut.updateCutWallMesh(old,moved.walls.w1,moved.nodes,[moved.openings.op1],three,vector);
 assert.equal(parent.children.length,1);assert.equal(parent.children[0],next);
 assert(geometries.every(g=>g.disposed));assert.equal(next.userData.netAreaMm2,15540000);
});
test('invalid opening cannot generate cutout or visual mesh',()=>{
 const s=state(),bad={...s.openings.op1,offsetFromStart:5900};
 assert.throws(()=>cut.cutWallSegments(s.walls.w1,s.nodes,[bad],vector),/fuera/);
 assert.throws(()=>mesh.getOpeningTransform(bad,s.walls.w1,s.nodes,vector),/fuera/);
});
