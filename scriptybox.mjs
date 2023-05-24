const get_worker = async (worker) => {
    return await new Promise((resolve, reject) => {
        let worker = new Worker(new URL("./javascript-sandbox-worker.js", import.meta.url));
        worker.addEventListener("message", (event) => {
            if (event.data === "ready") {
                resolve(worker);
            } else {
                reject("expected ready message, got " + JSON.stringify(event.data));
            }
        }, { once: true });
    });
};

function runInSandboxTemp(code_string, argument_names, time_limit) {
    return async (...args) => {

        let worker = await get_worker();
        return new Promise((resolve, reject) => {
            worker.addEventListener("message", (event) => {
                if (event.data.error) {
                    reject(event.data.error);
                    return;
                }
                worker.terminate();
                resolve(event.data.result);
            });
            worker.addEventListener("error", (event) => {
                worker.terminate();
                reject(event);
            });
            worker.postMessage({
                code: code_string,
                time_limit: time_limit,
                args: args,
                argNames: argument_names
            });
            setTimeout(() => {
                reject("Time limit exceeded");
                worker.terminate();
            }, time_limit);
        });
    }
}

async function persistentRunInSandbox(code_string, argument_names, time_limit_per_invocation) {
    // let object_url = URL.createObjectURL(sandbox_script_blob);
    // let worker = new Worker(object_url);
    // //because this worker is on an object URL,
    // //it won't be able to send network requests to the server
    // // even if the code in the sandbox manage to get access
    // // to the blocked APIs necessary to do so because of CORS
    // URL.revokeObjectURL(object_url);
    let worker = await get_worker();
    let previous_invocation = Promise.resolve();
    return previous_invocation = previous_invocation.then(() => {
        return new Promise((resolve, reject) => {
            worker.addEventListener("message", (event) => {
                if (event.data.error) {
                    reject(event.data.error);
                    return;
                }
                resolve(event.data.result);
            });
            worker.addEventListener("error", (event) => {
                reject(event);
            });
            worker.postMessage({
                code: code_string,
                time_limit: time_limit_per_invocation,
                args: args,
                argNames: argument_names
            });
            setTimeout(() => {
                reject("Time limit exceeded");
            }, time_limit_per_invocation);
        });
    });
}

const runInSandbox = async (code_string, argument_names, options) => {
    if (options.persistent) {
        return await persistentRunInSandbox(code_string, argument_names, options.time_limit);
    } else {
        return await runInSandboxTemp(code_string, argument_names, options.time_limit);
    }
}

export { runInSandbox };