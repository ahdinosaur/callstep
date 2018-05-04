const test = require('ava')

const callstep = require('../')

test('callstep', function (t) {
  t.truthy(callstep, 'module is require-able')
})
