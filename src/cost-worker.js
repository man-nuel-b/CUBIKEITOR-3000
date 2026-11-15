importScripts('./core.js');
self.onmessage=function(event){const {state,prices}=event.data;try{self.postMessage({revision:state.revision,quote:self.CubikeitorCore.computeQuote(state,prices)});}catch(error){self.postMessage({revision:state?.revision,error:error.message});}};
