const test = require('tape')
const print = require('../../src/lib/print')

// From 'chalk':
// use bright blue on Windows as the normal blue color is illegible
// i.e. escape 94m instead of 34m.
var isSimpleWindowsTerm = process.platform === 'win32' && !/^xterm/i.test(process.env.TERM)

test('print: prints numbers in yellow', t => {
  const value = 2
  const expected = '\x1b[0m\x1b[33m2\x1b[39m\x1b[0m'
  const actual = print(value)

  t.equal(actual, expected)
  t.end()
})

test('print: prints strings in green', t => {
  const value = 'hello'
  const expected = '\'\x1b[0m\x1b[32mhello\x1b[39m\x1b[0m\''
  const actual = print(value)

  t.equal(actual, expected)
  t.end()
})

test('print: truncates long strings when in object', t => {
  const value = { x: 'this is a long-ish string that will be truncated' }
  const expected = isSimpleWindowsTerm
    ? '{ \x1b[0m\x1b[94mx\x1b[39m\x1b[0m: \'\x1b[0m\x1b[32mthis is a long-ish string ...\x1b[39m\x1b[0m\' }'
    : '{ \x1b[0m\x1b[34mx\x1b[39m\x1b[0m: \'\x1b[0m\x1b[32mthis is a long-ish string ...\x1b[39m\x1b[0m\' }'
  const actual = print(value)

  t.equal(actual, expected)
  t.end()
})

test('print: does not truncate short strings when in object', t => {
  const value = { x: 'foo' }
  const expected = isSimpleWindowsTerm
    ? '{ \x1b[0m\x1b[94mx\x1b[39m\x1b[0m: \'\x1b[0m\x1b[32mfoo\x1b[39m\x1b[0m\' }'
    : '{ \x1b[0m\x1b[34mx\x1b[39m\x1b[0m: \'\x1b[0m\x1b[32mfoo\x1b[39m\x1b[0m\' }'
  const actual = print(value)

  t.equal(actual, expected)
  t.end()
})

test('print: prints booleans in magenta', t => {
  const value = true
  const expected = '\x1b[0m\x1b[35mtrue\x1b[39m\x1b[0m'
  const actual = print(value)

  t.equal(actual, expected)
  t.end()
})

test('print: prints undefined in gray', t => {
  const value = undefined
  const expected = '\x1b[0m\x1b[90mundefined\x1b[39m\x1b[0m'
  const actual = print(value)

  t.equal(actual, expected)
  t.end()
})

test('print: prints functions in cyan', t => {
  const value = function foo () {}
  const expected = '\x1b[0m\x1b[36m[Function]\x1b[39m\x1b[0m'
  const actual = print(value)

  t.equal(actual, expected)
  t.end()
})

test('print: prints verbs in cyan', t => {
  const value = function foo () {}

  value.verb = true
  value.pattern = 'foo'
  value.iobjarg = 'this'
  value.preparg = 'none'
  value.dobjarg = 'none'

  const expected = '\x1b[0m\x1b[1m\x1b[36m[Verb foo(none, none, this)]\x1b[39m\x1b[22m\x1b[0m'
  const actual = print(value)

  t.equal(actual, expected)
  t.end()
})

test('print: prints texts in cyan', t => {
  const value = function foo () {}

  value.text = true

  const expected = '\x1b[0m\x1b[1m\x1b[36m[Text]\x1b[39m\x1b[22m\x1b[0m'
  const actual = print(value)

  t.equal(actual, expected)
  t.end()
})
test('print: prints null in gray', t => {
  const value = null
  const expected = '\x1b[0m\x1b[90mnull\x1b[39m\x1b[0m'
  const actual = print(value)

  t.equal(actual, expected)
  t.end()
})

test('print: prints dates in yellow', t => {
  const value = new Date()
  const expected = `\x1b[0m\x1b[33m${value.toString()}\x1b[39m\x1b[0m`
  const actual = print(value)

  t.equal(actual, expected)
  t.end()
})

test('print: prints regular expressions in red', t => {
  const value = /foo/i
  const expected = '\x1b[0m\x1b[31m/foo/i\x1b[39m\x1b[0m'
  const actual = print(value)

  t.equal(actual, expected)
  t.end()
})

test('print: prints objects with circular references in black with yellow background', t => {
  const value = {}
  value.x = value
  const expected = isSimpleWindowsTerm
    ? '{ \x1b[0m\x1b[94mx\x1b[39m\x1b[0m: \x1b[0m\x1b[30m\x1b[43m[CircularReference]\x1b[49m\x1b[39m\x1b[0m }'
    : '{ \x1b[0m\x1b[34mx\x1b[39m\x1b[0m: \x1b[0m\x1b[30m\x1b[43m[CircularReference]\x1b[49m\x1b[39m\x1b[0m }'
  const actual = print(value)

  t.equal(actual, expected)
  t.end()
})

test('print: prints empty objects', t => {
  const value = {}
  const expected = '{}'
  const actual = print(value)

  t.equal(actual, expected)
  t.end()
})

test('print: prints empty arrays', t => {
  const value = []
  const expected = '[]'
  const actual = print(value)

  t.equal(actual, expected)
  t.end()
})

test('print: prints objects as strings when max depth is reached', t => {
  const value = { x: {} }
  const expected = isSimpleWindowsTerm
    ? '\x1b[0m\x1b[94m[object Object]\x1b[39m\x1b[0m'
    : '\x1b[0m\x1b[34m[object Object]\x1b[39m\x1b[0m'
  const actual = print(value, 0)

  t.equal(actual, expected)
  t.end()
})

test('print: throws when given an unsupported object', t => {
  const value = Symbol('foo')
  t.throws(() => { print(value) }, /print error: unsupported object/)
  t.end()
})

test('print: indents nested objects', t => {
  const value = { x: { y: 'foo' } }
  const expected = isSimpleWindowsTerm
    ? '{ \x1b[0m\x1b[94mx\x1b[39m\x1b[0m: \n  { \x1b[0m\x1b[94my\x1b[39m\x1b[0m: \'\x1b[0m\x1b[32mfoo\x1b[39m\x1b[0m\' } }'
    : '{ \x1b[0m\x1b[34mx\x1b[39m\x1b[0m: \n  { \x1b[0m\x1b[34my\x1b[39m\x1b[0m: \'\x1b[0m\x1b[32mfoo\x1b[39m\x1b[0m\' } }'
  const actual = print(value, 2)

  t.equal(actual, expected)
  t.end()
})

test('print: prints array values in their respective colors', t => {
  const value = [1, 'two', /three/]
  const expected = '[ \x1b[0m\x1b[33m1\x1b[39m\x1b[0m,\n  \'\x1b[0m\x1b[32mtwo\x1b[39m\x1b[0m\',\n  \x1b[0m\x1b[31m/three/\x1b[39m\x1b[0m ]'
  const actual = print(value)

  t.equal(actual, expected)
  t.end()
})

test('print: handles proper indentation with nested objects and arrays', t => {
  const value = { a: [{ b: [] }] }
  const expected = isSimpleWindowsTerm
    ? '{ \x1b[0m\x1b[94ma\x1b[39m\x1b[0m: \n  [ { \x1b[0m\x1b[94mb\x1b[39m\x1b[0m: [] } ] }'
    : '{ \x1b[0m\x1b[34ma\x1b[39m\x1b[0m: \n  [ { \x1b[0m\x1b[34mb\x1b[39m\x1b[0m: [] } ] }'
  const actual = print(value, 3)

  t.equal(actual, expected)
  t.end()
})

test('print: prints arrays as strings when max depth is reached', t => {
  const value = { x: [1, 2, 3] }
  const expected = isSimpleWindowsTerm
    ? '{ \x1b[0m\x1b[94mx\x1b[39m\x1b[0m: \x1b[0m\x1b[94m[Array(3)]\x1b[39m\x1b[0m }'
    : '{ \x1b[0m\x1b[34mx\x1b[39m\x1b[0m: \x1b[0m\x1b[34m[Array(3)]\x1b[39m\x1b[0m }'
  const actual = print(value)

  t.equal(actual, expected)
  t.end()
})
