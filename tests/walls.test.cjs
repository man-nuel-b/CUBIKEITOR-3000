'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const core=require('../src/core.js');
const prices=require('../src/prices-demo.json');
for(const face of ['A','B','C','D']){
 test(`opening on face ${face} updates only its wall and quote revision`,()=>{
  const store=core.createStore();
  const prior=core.computeQuote(store.getState(),prices);
  const wallBefore=core.wallMetadata(store.getState(),face);
  const input={face,type:'window',id:`w_${face}`,widthMm:800,heightMm:700,x:0,y:1.4,z:0};
  const o=core.openingFromWallPoint(store.getState(),input);
  assert.equal(o.face,face);
  store.dispatch({type:'ADD_OPENING',opening:o});
  const wallAfter=core.wallMetadata(store.getState(),face);
  assert.equal(wallAfter.openingAreaMm2,560000);
  assert.equal(wallAfter.netAreaMm2,wallBefore.netAreaMm2-560000);
  for(const other of ['A','B','C','D'].filter(f=>f!==face))assert.equal(core.wallMetadata(store.getState(),other).openingAreaMm2,0);
  const next=core.computeQuote(store.getState(),prices);
  assert.equal(next.revision,prior.revision+1);
  assert.equal(Math.round((prior.netAreaM2-next.netAreaM2)*1e6),560000);
 });
}
test('door snaps to floor and geometry invalid moves are rejected without state changes',()=>{
 const store=core.createStore();
 const door=core.openingFromWallPoint(store.getState(),{face:'C',x:3.03,y:1.1,z:0,type:'door',id:'door1',widthMm:900,heightMm:2100});
 assert.equal(door.bottomMm,0);
 store.dispatch({type:'ADD_OPENING',opening:door});
 assert.throws(()=>store.dispatch({type:'MOVE_OPENING',id:'door1',offsetMm:2000}),/fuera de los límites/);
 assert.equal(store.getState().revision,1);
});
