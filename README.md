# callstep

async control flow library using continuables

```shell
npm install --save callstep
```

## background



## api

### `Callback(err, ...values)`

A callback is a function that is called (usually asynchronously) with an error first.

This was the most common asynchronous pattern in Node.js code, until Promises.

```
interface Callback {
  (err : Error, ...values : Array<any>) => void
}
```


### `Continuable(callback)`

A continuable

```ts
interface Continuable {
  (callback : Callback) => void
}
```

### `step = require('callstep')`

### `step.to`
### `step.of`
### `step.error`
### `step.noop`
### `step.sync`

### `step.series`
### `step.waterfall`
### `step.parallel`

### `step.iff`
### `step.map`
### `step.mapAsync`
### `step.swallowError`
### `step.tap`

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
