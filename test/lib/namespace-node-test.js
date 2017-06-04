const test = require('tape')
const NamespaceNode = require('../../src/lib/namespace-node')

test('NamespaceNode: can be initialized', t => {
  const node = new NamespaceNode()

  t.ok(node)

  t.end()
})

test('NamespaceNode: can set values', t => {
  const node = new NamespaceNode()

  NamespaceNode.set(node, ['foo'], 'bar')

  const expected = 'bar'
  const actual = node.target.foo

  t.equal(actual, expected)

  t.end()
})

test('NamespaceNode: can get values', t => {
  const node = new NamespaceNode()

  NamespaceNode.set(node, ['foo'], 'bar')

  const expected = 'bar'
  const actual = NamespaceNode.get(node, ['foo'])

  t.equal(actual, expected)

  t.end()
})

test('NamespaceNode: can delete values', t => {
  const node = new NamespaceNode()

  NamespaceNode.set(node, ['foo'], 'bar')
  t.true(NamespaceNode.delete(node, ['foo']))

  const expected = undefined
  const actual = NamespaceNode.get(node, ['foo'])

  t.equal(actual, expected)

  t.end()
})

test('NamespaceNode: can set nested values', t => {
  const node = new NamespaceNode()

  NamespaceNode.set(node, ['foo', 'bar'], 'baz')

  const expected = 'baz'
  const actual = node.children.foo.target.bar

  t.equal(actual, expected)

  t.end()
})

test('NamespaceNode: can get nested values', t => {
  const node = new NamespaceNode()

  NamespaceNode.set(node, ['foo', 'bar'], 'baz')

  const expected = 'baz'
  const actual = NamespaceNode.get(node, ['foo', 'bar'])

  t.equal(actual, expected)

  t.end()
})

test('NamespaceNode: can delete nested values', t => {
  const node = new NamespaceNode()

  NamespaceNode.set(node, ['foo', 'bar'], 'baz')
  t.true(NamespaceNode.delete(node, ['foo', 'bar']))

  const expected = undefined
  const actual = NamespaceNode.get(node, ['foo', 'bar'])

  t.equal(actual, expected)

  t.end()
})

test('NamespaceNode: ignores delete for non-existen nested keys', t => {
  const node = new NamespaceNode()

  t.true(NamespaceNode.delete(node, ['foo', 'bar']))

  t.end()
})

// TODO: clean up empty child namespaces
// test('NamespaceNode: when deleting nested values, cleans up empty children', t => {
//   const node = new NamespaceNode()

//   NamespaceNode.set(node, ['foo', 'bar'], 'baz')
//   NamespaceNode.delete(node, ['foo', 'bar'])

//   const expected = undefined
//   const actual = node.children.foo

//   t.equal(actual, expected)

//   t.end()
// })

test('NamespaceNode: throws if setting without keys', t => {
  const node = new NamespaceNode()

  t.throws(() => {
    NamespaceNode.set(node, [], 'foo')
  })

  t.end()
})

test('NamespaceNode: throws if getting without keys', t => {
  const node = new NamespaceNode()

  t.throws(() => {
    NamespaceNode.get(node, [], 'foo')
  })

  t.end()
})

test('NamespaceNode: throws if deleting without keys', t => {
  const node = new NamespaceNode()

  t.throws(() => {
    NamespaceNode.delete(node, [], 'foo')
  })

  t.end()
})
