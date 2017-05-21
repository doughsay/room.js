const test = require('tape')
const Deserializer = require('../../src/lib/deserializer')
const mockedWorld = {
  get (id) { return { id } }
}
const deserializer = new Deserializer(mockedWorld)

test('Deserializer: deserializes a string', t => {
  const value = { value: 'foo' }
  const expected = 'foo'
  const actual = deserializer.deserialize(value)

  t.equal(actual, expected)
  t.end()
})

test('Deserializer: deserializes a number', t => {
  const value = { value: 3.14159 }
  const expected = 3.14159
  const actual = deserializer.deserialize(value)

  t.equal(actual, expected)
  t.end()
})

test('Deserializer: deserializes not a number', t => {
  const value = { NaN: true }
  const actual = deserializer.deserialize(value)

  t.true(isNaN(actual))
  t.end()
})

test('Deserializer: deserializes true', t => {
  const value = { value: true }
  const expected = true
  const actual = deserializer.deserialize(value)

  t.equal(actual, expected)
  t.end()
})

test('Deserializer: deserializes false', t => {
  const value = { value: false }
  const expected = false
  const actual = deserializer.deserialize(value)

  t.equal(actual, expected)
  t.end()
})

test('Deserializer: deserializes a date', t => {
  const value = { date: '2016-01-01T00:00:00.000Z' }
  const expected = new Date(Date.UTC(2016, 0))
  const actual = deserializer.deserialize(value)

  t.equal(actual.getTime(), expected.getTime())
  t.end()
})

test('Deserializer: deserializes a regular expression', t => {
  const value = { regexp: 'foo|bar', flags: 'gi' }
  const expected = /foo|bar/gi
  const actual = deserializer.deserialize(value)

  t.equal(actual.source, expected.source)
  t.equal(actual.flags, expected.flags)
  t.end()
})

test('Deserializer: deserializes undefined', t => {
  const value = { undefined: true }
  const expected = undefined
  const actual = deserializer.deserialize(value)

  t.equal(actual, expected)
  t.end()
})

test('Deserializer: deserializes null', t => {
  const value = { object: null }
  const expected = null
  const actual = deserializer.deserialize(value)

  t.equal(actual, expected)
  t.end()
})

test('Deserializer: deserializes a simple object', t => {
  const value = { object: { foo: { value: 'bar' } } }
  const expected = { foo: 'bar' }
  const actual = deserializer.deserialize(value)

  t.deepEqual(actual, expected)
  t.end()
})

test('Deserializer: deserializes a simple array', t => {
  const value = { array: [{ value: 1 }, { value: 'two' }] }
  const expected = [1, 'two']
  const actual = deserializer.deserialize(value)

  t.deepEqual(actual, expected)
  t.end()
})

test('Deserializer: deserializes a complex object', t => {
  const value = {
    object: {
      s: { value: 's' },
      n: { value: 2 },
      nl: { object: null },
      u: { undefined: true },
      o: {
        object: { x: { value: 'y' }, z: { object: null } }
      },
      a: {
        array: [{ value: 1 }, { value: 't' }]
      }
    }
  }
  const expected = {
    s: 's', n: 2, nl: null, u: undefined, o: { x: 'y', z: null }, a: [1, 't']
  }
  const actual = deserializer.deserialize(value)

  t.deepEqual(actual, expected)
  t.end()
})

test('Deserializer: deserializes a world object reference', t => {
  const value = { ref: 'foo' }
  const expected = { id: 'foo' }
  const actual = deserializer.deserialize(value)

  t.deepEqual(actual, expected)
  t.end()
})

test('Deserializer: deserializes a function', t => {
  const value = { function: true, source: 'function foo() { return "foo"; }' }
  const fn = deserializer.deserialize(value)

  t.equal(typeof fn, 'function')
  t.equal(fn.function, true)
  t.equal(fn.source, 'function foo() { return "foo"; }')
  t.end()
})

test('Deserializer: deserializes a verb', t => {
  const value = {
    verb: true,
    pattern: 'f*oo',
    source: "function foo() { return 'foo'; }",
    dobjarg: 'this',
    preparg: 'none',
    iobjarg: 'none'
  }
  const fn = deserializer.deserialize(value)

  t.equal(typeof fn, 'function')
  t.equal(fn.verb, true)
  t.equal(fn.pattern, value.pattern)
  t.equal(fn.source, value.source)
  t.equal(fn.dobjarg, value.dobjarg)
  t.equal(fn.preparg, value.preparg)
  t.equal(fn.iobjarg, value.iobjarg)
  t.end()
})

test('Deserializer: deserializes invalid object', t => {
  const value = { invalid: true }

  t.throws(() => { deserializer.deserialize(value) }, /Unable to deserialize object/)
  t.end()
})

test('Deserializer: deserializes null', t => {
  const value = null

  t.throws(() => { deserializer.deserialize(value) }, /Unable to deserialize value/)
  t.end()
})

test('Deserializer: deserializes invalid value', t => {
  const value = 'foo'

  t.throws(() => { deserializer.deserialize(value) }, /Unable to deserialize value/)
  t.end()
})
