const test = require('tape')
const { Namespace, namespaceHandler } = require('../../src/lib/namespace')

test('Namespace: can be initialized', t => {
  const namespace = new Namespace()

  t.ok(namespace)

  t.end()
})

test('Namespace: toString()', t => {
  const namespace = new Namespace()

  t.equal(namespace.toString(), '[object Namespace]')

  t.end()
})

test('Namespace: proxy prevents set', t => {
  const namespace = new Namespace()
  const proxy = new Proxy(namespace, namespaceHandler)

  proxy.foo = 'bar'
  t.equal(namespace.foo, undefined)

  t.end()
})

test('Namespace: proxy prevents delete', t => {
  const namespace = new Namespace()
  const proxy = new Proxy(namespace, namespaceHandler)

  namespace.foo = 'bar'
  delete proxy.foo
  t.equal(namespace.foo, 'bar')

  t.end()
})

test('Namespace: proxy prevents preventExtension', t => {
  const namespace = new Namespace()
  const proxy = new Proxy(namespace, namespaceHandler)

  t.throws(() => {
    Object.preventExtensions(proxy)
  })

  t.end()
})

test('Namespace: proxy prevents setPrototypeOf', t => {
  const namespace = new Namespace()
  const proxy = new Proxy(namespace, namespaceHandler)
  const newProto = {}

  t.throws(() => {
    Object.setPrototypeOf(proxy, newProto)
  })

  t.end()
})

test('Namespace: proxy prevents defineProperty', t => {
  const namespace = new Namespace()
  const proxy = new Proxy(namespace, namespaceHandler)
  const desc = { configurable: true, enumerable: true, value: 'bar' }

  t.throws(() => {
    Object.defineProperty(proxy, 'foo', desc)
  })

  t.end()
})
