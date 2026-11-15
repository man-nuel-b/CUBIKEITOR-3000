'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const core=require('../src/core.js'),adapter=require('../src/legacy-adapter.js');
const {createController}=require('../src/worker-controller.js');
const DATA={containers:{'20hc':{length:6.06,width:2.44,height:2.89}}};
const make=()=>({container:'20hc',finish:'standard',counts:{window:1,door:1,partition:2},layout:{window:[{face:'B',x:-1}],door:[{face:'A',x:1}]},projectMeta:{id:'BK-TEST',revision:7}});
test('legacy project projection is pure and preserves unsupported extras',()=>{
 const legacy=make(),before=JSON.stringify(legacy),v=adapter.checkCompatibility(legacy,DATA,null,core);
 assert.equal(v.compatible,true);assert.equal(v.model.revision,7);assert.equal(v.model.openings.length,2);assert.match(v.warnings.join(' '),/partition: 2/);assert.equal(JSON.stringify(legacy),before);
 assert.equal(v.model.openings[0].offsetMm,1430);assert.equal(v.model.openings[0].face,'B');
});
test('legacy invalid collision is flagged, not silently discarded',()=>{
 const old=make();old.layout.door[0]={face:'B',x:-1};const r=adapter.checkCompatibility(old,DATA,null,core);assert.equal(r.compatible,false);assert.match(r.warnings.join(' '),/Geometría no compatible/);
});
test('controller rejects stale asynchronous cost results',()=>{
 const worker={postMessage:()=>{},terminate:()=>{}};let task,output=[];
 const controller=createController({worker,computeSync:()=>null,onQuote:(q)=>output.push(q),delayMs:75,setTimer:f=>(task=f,1),clearTimer:()=>{}});
 controller.request({revision:1},{currency:'CLP'});task();controller.request({revision:2},{currency:'CLP'});task();
 worker.onmessage({data:{revision:1,quote:{totalCLP:123}}});worker.onmessage({data:{revision:2,quote:{totalCLP:456}}});
 assert.deepEqual(output,[{totalCLP:456}]);controller.close();
});
test('legacy dimensions from dimensionProvider have priority',()=>{
 const r=adapter.projectLegacy(make(),DATA,(type)=>type==='window'?{width:1.5,height:1.1}:null);
 assert.equal(r.model.openings[0].widthMm,1500);
});

test('worker failure computes latest pending quote through synchronous fallback',()=>{
 let task,results=[],errors=[];
 const worker={postMessage:()=>{},terminate:()=>{}};
 const controller=createController({worker,computeSync:s=>({revision:s.revision}),onQuote:(v)=>results.push(v),onError:v=>errors.push(v),setTimer:f=>(task=f,1),clearTimer:()=>{}});
 controller.request({revision:11},{currency:'CLP'});task();
 worker.onerror();
 assert.deepEqual(results,[{revision:11}]);assert.equal(errors.length,1);
 controller.close();
});
test('wall metadata and 3D point placement are derived from authoritative openings',()=>{
 const store=core.createStore(),before=core.wallMetadata(store.getState(),'A');
 assert.equal(before.openings.length,0);
 const opening=core.openingFromWallPoint(store.getState(),{face:'A',x:0,y:1.4,z:1.22,type:'window',id:'direct1',widthMm:1200,heightMm:1050});
 store.dispatch({type:'ADD_OPENING',opening});
 const after=core.wallMetadata(store.getState(),'A');
 assert.equal(after.openings.length,1);
 assert.equal(after.openingAreaMm2,1260000);
 assert.equal(after.revision,store.getState().revision);
 assert.equal(core.wallMetadata(store.getState(),'B').openings.length,0);
 assert.throws(()=>core.openingFromWallPoint(store.getState(),{face:'A',x:0,y:1.4,z:1.22,type:'window',id:'direct2',widthMm:1200,heightMm:1050}),/superpuestos/);
});
