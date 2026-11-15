(async function(){'use strict';const $=id=>document.getElementById(id),core=window.CubikeitorCore,storageKey='cubikeitor-reactivo-demo-v1';const prices=await fetch('src/prices-demo.json').then(r=>r.json());const store=core.createStore();const money=n=>n===null?'No validado':new Intl.NumberFormat('es-CL',{style:'currency',currency:'CLP',maximumFractionDigits:0}).format(n);const msg=(text,error=false)=>{$('status').textContent=text;$('status').className='status'+(error?' error':'')};let worker=null;try{worker=new Worker('src/cost-worker.js')}catch(e){msg('Worker no disponible: se usará respaldo local.',true)}
const costController=window.CubikeitorWorkerController.createController({worker,computeSync:core.computeQuote,onQuote:q=>{if(q.revision===store.getState().revision)renderQuote(q)},onError:error=>{$('warning').textContent=error;msg(error,true)},delayMs:75});
function renderQuote(q){$('quote-version').textContent=`Revisión ${q.revision} · lista ${q.priceListVersion}`;$('wall-area').textContent=q.netAreaM2.toFixed(2)+' m²';$('floor-area').textContent=q.floorAreaM2.toFixed(2)+' m²';$('lines').replaceChildren();q.lines.forEach(l=>{const row=document.createElement('div');row.className='row';const label=document.createElement('span');label.textContent=`${l.label} (${l.quantity} ${l.unit})`;const amt=document.createElement('strong');amt.textContent=money(l.totalCLP);row.append(label,amt);$('lines').append(row)});$('total').textContent=q.complete?money(q.totalCLP):'Cotización bloqueada';$('subtotal').textContent=money(q.subtotalCLP);$('tax').textContent=money(q.taxCLP);$('warning').textContent=q.complete?'IMPORTANTE: importes simulados, no validados para venta.':q.warnings.join(' ')}
function compute(s){$('version').textContent='rev. '+s.revision;$('quote-version').textContent=`Calculando revisión ${s.revision}`;costController.request(s,prices)}
function renderObjects(s){$('objects').replaceChildren();if(!s.openings.length){$('objects').textContent='Sin aberturas';return}for(const o of s.openings){const row=document.createElement('div');row.className='row';const label=document.createElement('span');label.textContent=`${o.type==='window'?'Ventana':'Puerta'} · cara ${o.face} · ${o.widthMm}×${o.heightMm} mm`;const btn=document.createElement('button');btn.className='danger';btn.textContent='Quitar';btn.addEventListener('click',()=>dispatch({type:'REMOVE_OPENING',id:o.id}));row.append(label,btn);$('objects').append(row)}}
let scene,camera,renderer,controls,model,matWalls,matFloor,matRim,matFrame,matGlass,previousSceneState=null;const faceModels=new Map();let pickMode=false;function setup3D(){if(!window.THREE){$('canvas').textContent='No se pudo cargar Three.js. Verifica conexión a internet.';return}const el=$('canvas');scene=new THREE.Scene();scene.background=new THREE.Color('#19283e');camera=new THREE.PerspectiveCamera(50,1,.1,100);camera.position.set(8,5,9);renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));el.appendChild(renderer.domElement);controls=new THREE.OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.target.set(0,1.2,0);scene.add(new THREE.AmbientLight(0xffffff,.75));const sun=new THREE.DirectionalLight(0xffffff,.95);sun.position.set(5,9,8);scene.add(sun);matWalls=new THREE.MeshStandardMaterial({color:0xb6c4d5,roughness:.8,side:THREE.DoubleSide});matFloor=new THREE.MeshStandardMaterial({color:0x75624f});matRim=new THREE.MeshStandardMaterial({color:0x2b4e6a,metalness:.4,roughness:.45});matFrame=new THREE.MeshStandardMaterial({color:0x3b4656});matGlass=new THREE.MeshStandardMaterial({color:0x90c7dc,transparent:true,opacity:.5,side:THREE.DoubleSide});const grid=new THREE.GridHelper(20,20,0x536983,0x304058);scene.add(grid);model=new THREE.Group();scene.add(model);const resize=()=>{const w=el.clientWidth,h=Math.max(350,el.clientHeight);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()};new ResizeObserver(resize).observe(el);resize();(function frame(){requestAnimationFrame(frame);controls.update();renderer.render(scene,camera)})()}
function addBox(parent,w,h,d,x,y,z,mat){if(w<=.001||h<=.001||d<=.001)return;const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);mesh.position.set(x,y,z);parent.add(mesh)}
function drawWall(face,s,parent){const c=s.container,L=c.lengthMm/1000,W=c.widthMm/1000,H=c.heightMm/1000,wallLength=(face==='A'||face==='B')?L:W;const holes=s.openings.filter(o=>o.face===face).map(o=>({x1:o.offsetMm/1000-wallLength/2,x2:(o.offsetMm+o.widthMm)/1000-wallLength/2,y1:o.bottomMm/1000,y2:(o.bottomMm+o.heightMm)/1000}));const xs=[-wallLength/2,wallLength/2,...holes.flatMap(o=>[o.x1,o.x2])].sort((a,b)=>a-b);for(let i=0;i<xs.length-1;i++){const a=xs[i],b=xs[i+1];if(b-a<.001)continue;const mid=(a+b)/2;const bounds=[0,H,...holes.filter(o=>mid>o.x1&&mid<o.x2).flatMap(o=>[o.y1,o.y2])].sort((a,b)=>a-b);for(let j=0;j<bounds.length-1;j++){const y1=bounds[j],y2=bounds[j+1],ym=(y1+y2)/2;if(holes.some(o=>mid>o.x1&&mid<o.x2&&ym>o.y1&&ym<o.y2))continue;const x=(a+b)/2,th=.08;if(face==='A')addBox(parent,b-a,y2-y1,th,x,ym,W/2,matWalls);else if(face==='B')addBox(parent,b-a,y2-y1,th,x,ym,-W/2,matWalls);else if(face==='C')addBox(parent,th,y2-y1,b-a,L/2,ym,x,matWalls);else addBox(parent,th,y2-y1,b-a,-L/2,ym,x,matWalls)}}}
function discardGeometry(group){group.traverse(obj=>{if(obj.isMesh)obj.geometry?.dispose?.()})}
function faceSignature(s,face){return JSON.stringify([s.container,s.openings.filter(o=>o.face===face),s.finish]);}
function render3D(s){
 if(!scene)return;
 if(!previousSceneState||JSON.stringify(previousSceneState.container)!==JSON.stringify(s.container)){
   for(const old of [...faceModels.values()]){model.remove(old);discardGeometry(old)}faceModels.clear();
   for(const child of [...model.children]){model.remove(child);discardGeometry(child)}
   const c=s.container,L=c.lengthMm/1000,W=c.widthMm/1000,H=c.heightMm/1000;
   addBox(model,L,.12,W,0,-.06,0,matFloor);
   for(const x of [-L/2,L/2])for(const z of [-W/2,W/2])addBox(model,.12,H,.12,x,H/2,z,matRim);
 }
 for(const face of ['A','B','C','D']){
  const signature=faceSignature(s,face);
  if(previousSceneState&&faceSignature(previousSceneState,face)===signature)continue;
  const previous=faceModels.get(face);
  if(previous){model.remove(previous);discardGeometry(previous)}
  const wallGroup=new THREE.Group();drawWall(face,s,wallGroup);
  const {lengthMm,widthMm}=s.container,L=lengthMm/1000,W=widthMm/1000;
  for(const o of s.openings.filter(o=>o.face===face)){
   const long=face==='A'||face==='B',width=o.widthMm/1000,height=o.heightMm/1000;
   const axis=o.offsetMm/1000-(long?L:W)/2+width/2,y=o.bottomMm/1000+height/2;
   const frame=new THREE.Group(),d=.14,t=.055;
   addBox(frame,width,t,d,0,height/2,0,matFrame);addBox(frame,width,t,d,0,-height/2,0,matFrame);
   addBox(frame,t,height,d,-width/2,0,0,matFrame);addBox(frame,t,height,d,width/2,0,0,matFrame);
   if(o.type==='window')addBox(frame,width-.12,height-.12,.015,0,0,0,matGlass);
   if(face==='A')frame.position.set(axis,y,W/2);
   if(face==='B')frame.position.set(axis,y,-W/2);
   if(face==='C'){frame.position.set(L/2,y,axis);frame.rotation.y=Math.PI/2}
   if(face==='D'){frame.position.set(-L/2,y,axis);frame.rotation.y=Math.PI/2}
   wallGroup.add(frame);
  }
  wallGroup.userData.face=face;faceModels.set(face,wallGroup);model.add(wallGroup);
 }
 previousSceneState=JSON.parse(JSON.stringify(s));
}
function update(s){renderObjects(s);render3D(s);compute(s);$('undo').disabled=!store.canUndo();$('redo').disabled=!store.canRedo();$('finish').value=s.finish;}
function dispatch(cmd){try{const s=store.dispatch(cmd);msg('Cambio aplicado y validado.');return s}catch(e){msg('No se aplicó el cambio: '+e.message,true);return null}}
function attachWallPlacement(){
 if(!renderer||!scene)return;
 const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
 let down=null;
 renderer.domElement.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY}});
 renderer.domElement.addEventListener('pointerup',e=>{
  if(!pickMode||!down||Math.hypot(e.clientX-down.x,e.clientY-down.y)>6)return;
  const rect=renderer.domElement.getBoundingClientRect();
  pointer.x=(e.clientX-rect.left)/rect.width*2-1;pointer.y=-(e.clientY-rect.top)/rect.height*2+1;
  raycaster.setFromCamera(pointer,camera);
  const hits=raycaster.intersectObjects([...faceModels.values()],true);
  const first=hits.find(hit=>{let obj=hit.object;while(obj&&!obj.userData.face)obj=obj.parent;return obj&&obj.userData.face;});
  if(!first){msg('Selecciona un muro visible para colocar la abertura.',true);return;}
  let group=first.object;while(group&&!group.userData.face)group=group.parent;
  try{
   const state=store.getState(),o=core.openingFromWallPoint(state,{face:group.userData.face,x:first.point.x,y:first.point.y,z:first.point.z,type:$('type').value,id:'obj_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,7),widthMm:Number($('width').value),heightMm:Number($('height').value)});
   if(dispatch({type:'ADD_OPENING',opening:o})){$('face').value=o.face;$('offset').value=o.offsetMm;$('bottom').value=o.bottomMm;pickMode=false;$('pick-wall').textContent='Seleccionar muro en 3D';renderer.domElement.style.cursor='grab';}
  }catch(error){msg('No se pudo colocar en ese punto: '+error.message,true)}
 });
}
store.subscribe(update);$('pick-wall').onclick=()=>{pickMode=!pickMode;$('pick-wall').textContent=pickMode?'Haz clic en un muro (Cancelar)':'Seleccionar muro en 3D';if(renderer)renderer.domElement.style.cursor=pickMode?'crosshair':'grab';msg(pickMode?'Haz clic sobre el muro donde quieres colocar la abertura.':'Selección de muro cancelada.');};$('add').onclick=()=>{const n=id=>Number($(id).value),o={id:'obj_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,7),type:$('type').value,face:$('face').value,widthMm:n('width'),heightMm:n('height'),offsetMm:n('offset'),bottomMm:n('bottom')};dispatch({type:'ADD_OPENING',opening:o})};$('type').onchange=()=>{if($('type').value==='door'){$('height').value=2100;$('bottom').value=0;$('width').value=900}else{$('height').value=1050;$('bottom').value=900;$('width').value=1200}};$('finish').onchange=()=>dispatch({type:'SET_FINISH',finish:$('finish').value});$('undo').onclick=()=>store.undo();$('redo').onclick=()=>store.redo();$('save').onclick=()=>{try{localStorage.setItem(storageKey,JSON.stringify(store.getState()));msg('Proyecto guardado localmente.')}catch(e){msg('No se pudo guardar: '+e.message,true)}};$('restore').onclick=()=>{try{const raw=localStorage.getItem(storageKey);if(!raw)throw new Error('No existe guardado');store.replace(JSON.parse(raw));msg('Proyecto restaurado.')}catch(e){msg('No se pudo recuperar: '+e.message,true)}};window.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&!['INPUT','TEXTAREA'].includes(document.activeElement.tagName)){if(e.key.toLowerCase()==='z'){e.preventDefault();store.undo()}if(e.key.toLowerCase()==='y'){e.preventDefault();store.redo()}}});$('import-legacy').onclick=()=>$('legacy-file').click();$('legacy-file').addEventListener('change',async e=>{try{
 const file=e.target.files?.[0];if(!file)return;const raw=JSON.parse(await file.text());
 if(raw.format==='cubikeitor-project')throw Error('El archivo v4 protegido requiere verificar primero su integridad con project-persistence-core.js. No se importó.');
 const data={containers:{'20hc':{length:6.06,width:2.44,height:2.89}}};
 const projected=window.CubikeitorLegacyAdapter.checkCompatibility(raw,data,null,core);
 if(!projected.compatible)throw Error(projected.warnings.join(' | '));
 store.replace(projected.model);msg('Proyección del proyecto original importada solo para visualización. '+projected.warnings.join(' | '));
 }catch(error){msg('Importación cancelada: '+error.message,true)}finally{e.target.value=''}});
setup3D();attachWallPlacement();update(store.getState());})();
