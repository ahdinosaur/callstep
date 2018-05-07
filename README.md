# callstep 🚶

Promise-like async control flow library using plain functions

```shell
npm install --save callstep
```

## table of contents

- [concepts](#concepts)
  - [Callback](#callback)
  - [Continuable](#continuable)
  - [Callstep](#callstep)
- [api](#api)
  - [of](#stepofvalue--continuable)
  - [from](#steperrorerr--continuable)
  - [to](#steptoasyncfn--values--continuable)
  - [noop](#stepnoop--continuable)
  - [sync](#stepsyncsyncfn--continuable)
  - [series](#stepseriescontinuables--continuable)
  - [parallel](#stepparallelcontinuables--continuable)
  - [waterfall](#stepwaterfallcontinuable-callsteps--continuable)
  - [iff](#stepiffpredicate-iftrue-iffalse--callstep)
  - [map](#stepmapsource-lambda--continuable)
  - [mapAsync](#stepmapasyncsource-callstep--continuable)
  - [swallowError](#stepswallowerrorcontinuable--continuable)
  - [tap](#steptapfn--callstep)
- [thanks](#thanks)
- [license](#license)

## concepts

### `Callback`

```
Callback<Error, Value>(err : Error, value : Value) => void
```

a callback is a function that is called (usually asynchronously) with an error as the first and a value as the second argument.

this was the most common asynchronous pattern in Node.js code, until Promises.

guess who's back meow, callbacks! 🐈

```js
function callback (err, value) {}
```

### `Continuable`

```
Continuable<Error, Value>(callback : Callback<Error, Value>) => void
```

a continuable is a function with one argument: a callback.

a continuable is a future value that can be asynchronously resolved later, like a Promise!


```js
function continuable (callback) {
  // do something, then call...
  callback(err, value)
}
```

for example:

```js
function readConfig (callback) {
  fs.readFile('./config.json', callback)
}
```

### `Callstep`

```
Callstep<Error, Input, Output>(value : Input) => Continuable<Error, Output>
```

a callstep is a function that receives an input value and returns a continuable for an output value.

```js
function callstep (input) {
  function continuable (callback) {
    callback(err, output)
  }
}
```

for example:

```js
const readConfig = readFile('./config.json')

function readFile (path) {
  return function continuable (callback) {
    fs.readFile('./config.json', callback)
  }
}
```

## api

### `step = require('callstep')`

### `step.of(value) => continuable`

```
step.of(value : Value) => Continuable<null, Value>`
```

given a value, returns a continuable for the value.

source:

```js
function of (value) {
  return callback => callback(null, value)
}
```

### `step.error(err) => continuable`

```
step.error(err : Error) => Continuable<Error, null>`
```

given an error, returns a continuable for the error.

source:

```js
function error (err) {
  return callback => callback(err)
}
```

### `step.to(asyncFn) => (...values) => continuable`

convert an async function (for example `fs.readFile`) to a function that returns a continuable

for example:

```js
var readFile = step.to(fs.readFile)

var readConfig = readFile('./config.json', 'utf8')

readConfig((err, text) => {
  console.log(text)
})
```

source:

```js
function to (asyncFn) {
  return function (...args) {
    return function continuable (callback) {
      return asyncFn(...args, callback)
    }
  }
}
```

### `step.noop() => continuable`

```
step.noop() => Continuable<null, null>
```

returns a continuable for nothing.

source:

```js
function noop () {
  return callback => callback(null, null)
}
```

### `step.sync(syncFn) => continuable`

```
step.sync(syncFn : () => { return value : Value | throw err : Error }) => Continuable<Error, Value>
```

given a synchronous function that returns a value or throws an error,

returns a continuable for the value or any caught error.

for example:

```js
const parseJson = json => step.sync(() => JSON.parse(json))
```

source:

```js
function sync (fn) {
  return callback => {
    try {
      var result = fn()
    } catch (err) {
      return callback(err)
    }
    callback(null, result)
  }
}
```

### `step.series([...continuables]) => continuable`

```
step.series(continuables : [Continuable]) => Continuable<Error, [Result]>
```


given an array of continuables, returns a continuable to invoke them in order.

the callback will receive an error if one errors, or an array of results if all succeed.

uses [`run-series`](https://github.com/feross/run-series)

for example:

```js
const runSteps = step.series([stepOne, stepTwo])
```

### `step.parallel([...continuables]) => continuable`

```
step.parallel(continuables : [Continuable]) => Continuable<Error, [Result]>
```

given an array of continuables, returns a continuable to invoke them in parallel.

the callback will receive an error if any error, or an array of results if all succeed.

uses [`run-parallel`](https://github.com/feross/run-parallel)

for example:

```js
const fetchAnimals = step.parallel([fetchCats, fetchDogs, fetchBirds])
```

### `step.waterfall([continuable, ...callsteps]) => continuable`

```
step.waterfall([continuable, ...callsteps]) => Continuable<Error, FinalResult>
```

given an array of continuables return a continuable that invokes them in order, or until one errors.

uses [`run-waterfall`](https://github.com/feross/run-waterfall)

for example:

```js
const readFile = step.to(fs.readFile)
const parseJson = json => step.sync(() => JSON.parse(json))

const readConfig = step.waterfall([
  readFile('./config.json'),
  parseJson
])
```

### `step.iff(predicate, ifTrue, ifFalse?) => callstep`

```
step.iff(predicate : (value : Value) => Boolean, ifTrue : Callstep<Error, Value>, ifFalse : CallStep<Error, Value>) => CallStep<Error, Value>
```

given a `predicate` function that returns true or false, a `ifTrue` callstep if predicate is true, and an optional `ifFalse` callstep if predicate is false (otherwise defaults to `step.of`).

returns a callstep that will conditionally delegate to either `ifTrue` or `ifFalse` depending on the result of `predicate`.

```js
const isString = value => typeof(value) === 'string'
const parseJson = json => step.sync(() => JSON.parse(json))

const toJson = step.iff(isString, parseJson)
```

### `step.map(source, lambda) => continuable`

given a `source` continuable and a `lambda` synchronous transformation function, returns a new continuable.

the new continuable is the result of the first continuable transformed by your synchronous mapping function.

```
step.map<Error, Input, Output>(source : Continuable<Error, Input>, lambda : (input : Input) => { return output : Output | throw err : Error }) => Continuable<Error, Output>
```

for example:

```js
const readConfig = map(
  readFile('./config.json', 'utf8'),
  JSON.parse
)

readConfig((err, config) => {
  console.log(config)
})
```

### `step.mapAsync(source, callstep) => continuable`


given a `source` continuable and a `callstep` asynchronous transformation function, returns a new continuable.

the new continuable is the result of the first continuable transformed by your asynchronous mapping function.

```
step.map<Error, Input, Output>(source : Continuable<Error, Input>, callstep : Callstep<Error, Input, Output>) => Continuable<Error, Output>
```

for example:

```js
const writeConfig = mapAsync(
  readFile('./config.json', 'utf8'),
  JSON.parse
)

readConfig((err, config) => {
  console.log(config)
})
```

### `step.swallowError(continuable) => continuable`

```
step.swallowError(continuable : Continuable<Error, Value>) => Continuable<null, Value>
```

given a continuable, returns a new continuable that ignores any errors passed to the callback.

```js
const parseJson = json => step.sync(() => JSON.parse(json))

const tryParseJson = value => step.swallowError(parseJson(value))
```

### `step.tap(fn) => callstep`

```
step.tap(fn : (value : Value) => void) => CallStep<Error, Value>
```

given a tap function that receives a value, returns a callstep which runs the tap function before returning a continuable for the value.

helpful for debugging callsteps.

for example:

```js
const readFile = step.to(fs.readFile)
const parseJson = json => step.sync(() => JSON.parse(json))

const readConfig = step.waterfall([
  readFile('./config.json'),
  step.tap(value => console.log('value', value)),
  parseJson
])
```

## thanks

- [`Raynos/continuable`](https://github.com/Raynos/continuable)
- [`dominictarr/cont`](https://github.com/dominictarr/cont)

## license

The Apache License

Copyright &copy; 2018 Michael Williams

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
