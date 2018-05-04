const runSeries = require('run-series')
const runWaterfall = require('run-waterfall')
const runParallel = require('run-parallel')

module.exports = {
  error,
  iff,
  map,
  mapAsync,
  noop,
  of,
  parallel,
  series,
  swallowError,
  sync,
  tap,
  to,
  waterfall
}

function error (err) {
  return callback => callback(err)
}

function iff (predicate, ifTrue, ifFalse = noop) {
  return (...args) => {
    if (predicate(...args)) return ifTrue(...args)
    else return ifFalse(...args)
  }
}

// inspired by https://github.com/Raynos/continuable/blob/master/map.js
function map (source, lambda) {
  return function continuable (callback) {
    source(function continuation (err, value) {
      if (err) callback(err)
      else sync(() => lambda(value))(callback)
    })
  }
}

// inspired by https://github.com/Raynos/continuable/blob/master/map-async.js
function mapAsync (source, lambda) {
  return function continuable (callback) {
    source(function continuation (err, value) {
      if (err) callback(err)
      else lambda(value)(callback)
    })
  }
}

function noop () {
  return callback => callback(null, null)
}

function parallel (continuables) {
  return callback => {
    runParallel(continuables, callback)
  }
}

function of (...values) {
  return callback => callback(null, ...values)
}

function series (continuables) {
  return callback => {
    runSeries(continuables, callback)
  }
}

/* eslint-disable handle-callback-err */
function swallowError (continuable) {
  return callback => {
    continuable((err, result) => {
      callback(null, result)
    })
  }
}
/* eslint-enable handle-callback-err */

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

function tap (fn) {
  return (...values) => {
    fn(...values)
    return of(...values)
  }
}

// inspired by https://github.com/Raynos/continuable/blob/master/to.js
function to (asyncFn) {
  return function (...args) {
    const callback = args[args.length - 1]

    if (typeof callback === 'function') {
      return asyncFn.apply(this, args)
    }

    return function continuable (callback) {
      return asyncFn(...args, callback)
    }
  }
}

function waterfall (steps) {
  return topCallback => {
    const callbackers = steps.map((step, index) => {
      return (...args) => {
        const callback = args.pop()
        const continuable = index === 0 ? step : step(...args)
        continuable(callback)
      }
    })
    runWaterfall(callbackers, topCallback)
  }
}
