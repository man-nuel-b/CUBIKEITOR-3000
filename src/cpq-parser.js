/**
 * CPQ Exprés: parser determinista acotado para solicitudes en español.
 * No es una IA generativa ni entiende lenguaje natural ilimitado.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.CubikeitorCPQ=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const amounts={un:1,uno:1,una:1,dos:2,tres:3,cuatro:4,cinco:5,seis:6,siete:7,ocho:8,nueve:9,diez:10,once:11,doce:12,trece:13,catorce:14,quince:15,dieciseis:16,diecisiete:17,dieciocho:18,diecinueve:19,veinte:20};
const names={ventana:'ventana',ventanas:'ventana',puerta:'puerta',puertas:'puerta',vano:'vano',vanos:'vano'};
const dimensions={ventana:{width:1200,height:1050,sillHeight:900},puerta:{width:900,height:2100,sillHeight:0},vano:{width:1000,height:2000,sillHeight:0}};
function parseOrder(text){
 if(typeof text!=='string'||text.length>2000)throw Error('Pedido demasiado largo o inválido');
 const value=text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
 const regex=/\b(ventanas?|puertas?|vanos?)\b/g;
 let match,prior=0,items=[],summary={ventana:0,puerta:0,vano:0};
 while((match=regex.exec(value))){
  const type=names[match[1]],before=value.slice(prior,match.index);
  const countMatch=before.match(/(?:^|[^a-z0-9])(\d{1,3}|un|uno|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|trece|catorce|quince|dieciseis|diecisiete|dieciocho|diecinueve|veinte)\s*$/);
  const quantity=countMatch?(amounts[countMatch[1]]??Number(countMatch[1])):1;
  if(!Number.isSafeInteger(quantity)||quantity<1||quantity>24)throw Error('Cantidad inválida o superior a 24 por elemento');
  if(items.length+quantity>24)throw Error('Máximo de 24 aberturas por pedido');
  for(let i=0;i<quantity;i++)items.push({type,...dimensions[type]});
  summary[type]+=quantity;prior=regex.lastIndex;
 }
 if(items.length===0)throw Error('No se reconocieron ventanas, puertas ni vanos. Usa cantidades y nombres explícitos.');
 return {items,summary,recognizedCount:items.length};
}
function distributeOnWalls(state,items,{margin=100,spacing=120}={}){
 if(!state?.walls||!state.nodes||!Array.isArray(items))throw Error('Planta o pedido inválido');
 const walls=Object.values(state.walls),used=new Map(walls.map(w=>[w.id,margin])),openings={};
 for(let i=0;i<items.length;i++){
  const o=items[i];let fit=null;
  // First-fit: distribución determinista entre muros, sin solapes horizontales.
  for(const wall of walls){
   const a=state.nodes[wall.startNodeId],b=state.nodes[wall.endNodeId];
   if(!a||!b)continue;
   const length=Math.hypot(b.x-a.x,b.y-a.y),start=used.get(wall.id);
   if(o.sillHeight+o.height>wall.height-100)continue;
   if(start+o.width+margin<=length){fit={wall,start};break;}
  }
  if(!fit)throw Error('Las aberturas solicitadas no caben en los muros. Reduce cantidades o aumenta dimensiones.');
  const id='op'+(i+1);
  openings[id]={id,wallId:fit.wall.id,type:o.type,width:o.width,height:o.height,offsetFromStart:fit.start,sillHeight:o.sillHeight};
  used.set(fit.wall.id,fit.start+o.width+spacing);
 }
 return openings;
}
return {parseOrder,distributeOnWalls,dimensions};
});
