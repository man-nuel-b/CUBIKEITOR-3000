/* Revision-safe, debounced cost engine bridge. Browser and test friendly. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.CubikeitorWorkerController=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function createController({worker,computeSync,onQuote,onError,delayMs=75,setTimer=setTimeout,clearTimer=clearTimeout}){
 if(typeof computeSync!=='function'||typeof onQuote!=='function')throw Error('Se requieren cálculo y actualización');
 let pending=null,latest=-1,prices=null,closed=false;
 if(worker){worker.onmessage=event=>{const m=event.data||{};if(closed||m.revision!==latest)return;if(m.error){onError?.(m.error,m.revision);return;}onQuote(m.quote,m.revision);};worker.onerror=()=>{if(!closed)onError?.('Fallo del Web Worker: se habilita respaldo local',latest);worker=null;};}
 function flush(){pending=null;if(!prices)return;const {state,priceBook}=prices;if(worker){try{worker.postMessage({state,prices:priceBook});return;}catch(e){onError?.('Worker inaccesible, usando cálculo local',state.revision);worker=null;}}
 try{const quote=computeSync(state,priceBook);if(!closed&&state.revision===latest)onQuote(quote,latest);}catch(e){onError?.(String(e.message||e),latest);}}
 return {request(state,priceBook){if(closed)throw Error('Controlador cerrado');if(!Number.isSafeInteger(state?.revision))throw Error('Revisión inválida');latest=state.revision;prices={state:JSON.parse(JSON.stringify(state)),priceBook:JSON.parse(JSON.stringify(priceBook))};if(pending!==null)clearTimer(pending);pending=setTimer(flush,delayMs);},flush,latestRevision:()=>latest,close(){closed=true;if(pending!==null)clearTimer(pending);worker?.terminate?.();}};
}
return {createController};
});
