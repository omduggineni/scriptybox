# **scriptybox**: the simple client-side javascript sandbox

scriptybox is a simple client-side javascript sandbox. It allows you to run untrusted code in a sandboxed environment as a function with very low (<1ms) overhead.

## Usage

The `runInSandbox` function takes a string of javascript code and a list of arguments. It returns a promise that resolves to a function that can be called with the arguments passed to `runInSandbox`. The argument names show up in the sandboxed code as variables, and the return value of the sandboxed code is the return value of the function.

Any JSON object can be passed to the sandboxed code as an argument. The sandboxed code can return any JSON object as a return value.

Method signature:
- `runInSandbox(code: string, argNames: string[], options: object): Promise<function>`
    - `code`: the javascript code to run in the sandbox
    - `argNames`: the names of the arguments to the sandboxed function
    - `options`: an object with the following optional properties:
        - `time_limit`: the maximum time (in milliseconds) that the sandboxed code is allowed to run for. If the code runs for longer than this, the promise will reject with an error. Defaults to 1000ms.
        - `persistent`: if true, variables stored in the global scope (`this`) will be reused for future calls to `runInSandbox` with the same code. Defaults to false.

```javascript
import { runInSandbox } from './scriptybox.mjs'

const sandboxedFunction = await runInSandbox('return a + b', ['a', 'b'], { time_limit: 1000 })
const result = await sandboxedFunction(1, 2) // result = 3
console.log(result)

const persistentSandboxedFunction = await runInSandbox('this.i = this.i || 0; this.i++; return this.i', [], {  time_limit: 1000, persistent: true })
const result1 = await persistentSandboxedFunction() // result1 = 1
console.log(result1)
const result2 = await persistentSandboxedFunction() // result2 = 2
console.log(result2)

const illegalMethodCall = await runInSandbox(`fetch('https://example.com')`, [], { time_limit: 1000 })
const resulti = await illegalMethodCall() // Uncaught TypeError: fetch is not a function
console.log(resulti)
```