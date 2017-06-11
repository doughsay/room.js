const test = require('tape')
const C3 = require('../../src/lib/c3')

test('C3: simple case', t => {
  const c = new C3('a')
  c.add('a', 'b')
  c.add('b', 'c')

  t.deepEqual(c.run(), ['a', 'b', 'c'])
  t.ok(c.has('a'))
  t.ok(c.has('b'))
  t.ok(c.has('c'))
  t.ok(!c.has('d'))
  t.end()
})

test('C3: complex case', t => {
  const c = new C3('Z')
  c.add('Z', 'K1')
  c.add('Z', 'K2')
  c.add('Z', 'K3')
  c.add('K3', 'D')
  c.add('K3', 'A')
  c.add('K2', 'D')
  c.add('K2', 'B')
  c.add('K2', 'E')
  c.add('K1', 'A')
  c.add('K1', 'B')
  c.add('K1', 'C')
  c.add('E', 'O')
  c.add('D', 'O')
  c.add('C', 'O')
  c.add('B', 'O')
  c.add('A', 'O')

  t.deepEqual(c.run(), ['Z', 'K1', 'K2', 'K3', 'D', 'A', 'B', 'C', 'E', 'O'])
  t.end()
})

test('C3: circular dependencies', t => {
  const c = new C3('a')
  c.add('a', 'b')
  c.add('b', 'a')

  t.throws(() => { c.run() }, /Maximum call stack size exceeded/)
  t.end()
})

test('C3: duplicate dependencies', t => {
  const c = new C3('a')
  c.add('a', 'b')

  t.throws(() => { c.add('a', 'b') }, /Duplicate parent/)
  t.end()
})

// for the following two examples:
// a
// |\
// | c
// |/
// b

test('C3: inconsistent hierarchy', t => {
  const c = new C3('b')
  c.add('b', 'a')
  c.add('b', 'c') // the order in which you add parents matters...
  c.add('c', 'a')

  t.throws(() => { c.run() }, /Inconsistent hierarchy/)
  t.end()
})

test('C3: inconsistent hierarchy without error', t => {
  const c = new C3('b')
  c.add('b', 'c')
  c.add('b', 'a') // TODO: figure out why this works and the other one doesn't
  c.add('c', 'a')

  t.deepEqual(c.run(), ['b', 'c', 'a'])
  t.end()
})

test('C3: add in backwards order', t => {
  const c = new C3('a')
  c.add('b', 'c')
  c.add('a', 'b')

  t.deepEqual(c.run(), ['a', 'b', 'c'])
  t.end()
})

test('C3: disconnected hierarchy', t => {
  const c = new C3('a')
  c.add('b', 'c')

  t.deepEqual(c.run(), ['a'])
  t.end()
})
