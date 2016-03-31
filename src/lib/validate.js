const validateConfig = ({ defs, listenEvents }) => {
  assert.ok(defs, 'defs must exist')
  assert(Array.isArray(defs), 'defs must be an array')
  assert(defs.every(x => Array.isArray(x)), 'defs must be an array of an array')
  assert(defs.every(x => x.length === 2), 'every def must have length 2')
  assert(defs.every(x => typeof x[0] === 'string'), 'every def must have first ordinal type string event name')
  assert(defs.every(x => typeof x[1] === 'object'), 'every def must have second ordinal type object')
  assert(defs.every(x => typeof x[1].action !== 'undefined'), 'every def must have second ordinal action function defined')
  assert(defs.every(x => typeof x[1].timeoutMS === 'number'), 'every def must have second ordinal timeoutMS number defined')
  assert.ok(listenEvents, 'listen events must exist')
}
