//steps:
//1. create back up copies of the APIs that this Web Worker may access
//2. the function that runs the worker code is created in an isolated scope that contains copies of the APIs it needs
//3. ALL APIs are deleted from the global scope
//4. add back the whitelisted APIs
//5. run the worker code in the global scope

//disable APIs

var allowedAPIs = {};

allowedAPIs.Math = Math;
allowedAPIs.Date = Date;

allowedAPIs.console = console;

allowedAPIs.setTimeout = setTimeout;
allowedAPIs.setInterval = setInterval;
allowedAPIs.clearTimeout = clearTimeout;
allowedAPIs.clearInterval = clearInterval;

allowedAPIs.performance = performance;

allowedAPIs.Array = Array;
allowedAPIs.ArrayBuffer = ArrayBuffer;
allowedAPIs.Uint8Array = Uint8Array;
allowedAPIs.Uint16Array = Uint16Array;
allowedAPIs.Uint32Array = Uint32Array;
allowedAPIs.Int8Array = Int8Array;
allowedAPIs.Int16Array = Int16Array;
allowedAPIs.Int32Array = Int32Array;
allowedAPIs.Float32Array = Float32Array;
allowedAPIs.Object = Object;
allowedAPIs.Promise = Promise;
allowedAPIs.console = console;

//this function gets created before the APIs get deleted
queueMicrotask((() => {
    let addEventListener = self.addEventListener;
    let console = self.console;
    let postMessage = self.postMessage;
    let JSON = self.JSON;
    let performance = self.performance;
    let lastCode = null;
    let sandboxedFunc = null;
    return () => {
        addEventListener('message', async (event) => {
            let message = event.data;
            let args = JSON.parse(JSON.stringify(message.args));
            let argNames = message.argNames;
            if (!(argNames instanceof Array)) argNames = [];
            argNames.map(name => name + "");
            let code = message.code;
            let time_limit = message.time_limit;
            let start_time = performance.now();
            self.getTimeRemaining = () => {
                return time_limit - (performance.now() - start_time);
            };

            let result;
            try {
                if (lastCode !== null && lastCode === code) {
                    result = (1, sandboxedFunc)(...args); //reuse function created on last invocation
                } else {
                    sandboxedFunc = new Function(...argNames, code);
                    lastCode = code;
                    result = (1, sandboxedFunc)(...args); //create a new function with the code
                }
            } catch (e) {
                //console.error(e);
                postMessage({
                    error: e + "",
                });
                return;
            }
            if (result instanceof Promise) {
                try {
                    result = await result;
                } catch (e) {
                    //console.error(e);
                    postMessage({
                        error: e + "",
                    });
                    return;
                }
            }
            if (result === undefined) {
                result = null;
            }
            result = JSON.stringify(result);
            if (result === undefined) {
                result = null;
            }
            result = JSON.parse(result); //this is to make sure that the result is a valid JSON object (so you can't send code back from the sandbox to the main thread)
            postMessage({ result });
        });
        postMessage("ready");
    };
})());

//delete all APIs, then put back the whitelisted ones
for (let APIfunction in this) {
    this[APIfunction] = null;
    self[APIfunction] = null;
    globalThis[APIfunction] = null;
}
for (let APIfunction in allowedAPIs) {
    this[APIfunction] = allowedAPIs[APIfunction];
    self[APIfunction] = allowedAPIs[APIfunction];
    globalThis[APIfunction] = allowedAPIs[APIfunction];
}
allowedAPIs = null;
APIfunction = null;