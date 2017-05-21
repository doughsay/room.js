const test = require('tape')
const World = require('../../src/lib/world')
const mockDb = require('../helpers/mock-db')

function loggerFactory () {
  return {
    child () { return this },
    debug () {}
  }
}

function setup () {
  const db = mockDb()
  const world = new World(loggerFactory(), db, new Map())
  return [world.objects, db]
}

test('WorldObjectProxyBuilder: has property `foo`', t => {
  const [{ foo }] = setup()

  t.equal(foo.foo, 'foo')
  t.end()
})

test('WorldObjectProxyBuilder: has own property `foo`', t => {
  const [{ foo }] = setup()

  t.true(foo.hasOwnProperty('foo'))
  t.end()
})

test('WorldObjectProxyBuilder: has property `bar`', t => {
  const [{ foo }] = setup()

  t.equal(foo.bar, 'bar')
  t.end()
})

test('WorldObjectProxyBuilder: does not have own property `bar`', t => {
  const [{ foo }] = setup()

  t.false(foo.hasOwnProperty('bar'))
  t.end()
})

test('WorldObjectProxyBuilder: has property `baz`', t => {
  const [{ foo }] = setup()

  t.equal(foo.baz, 'baz')
  t.end()
})

test('WorldObjectProxyBuilder: does not have own property `baz`', t => {
  const [{ foo }] = setup()

  t.false(foo.hasOwnProperty('bar'))
  t.end()
})

test('WorldObjectProxyBuilder: inherits property `shared` from bar', t => {
  const [{ foo }] = setup()

  t.equal(foo.shared, 'from-bar')
  t.end()
})

test('WorldObjectProxyBuilder: does not have own property `shared`', t => {
  const [{ foo }] = setup()

  t.false(foo.hasOwnProperty('shared'))
  t.end()
})

test('WorldObjectProxyBuilder: has property `base`', t => {
  const [{ foo }] = setup()

  t.equal(foo.base, 'base')
  t.end()
})

test('WorldObjectProxyBuilder: does not have own property `base`', t => {
  const [{ foo }] = setup()

  t.false(foo.hasOwnProperty('base'))
  t.end()
})

test('WorldObjectProxyBuilder: set new property', t => {
  const [{ foo }] = setup()

  foo.prop = 'new prop'
  t.equal(foo.prop, 'new prop')
  t.end()
})

test('WorldObjectProxyBuilder: delete property', t => {
  const [{ foo }] = setup()

  foo.prop = 'new prop'
  delete foo.prop
  t.equal(foo.prop, undefined)
  t.end()
})

test('WorldObjectProxyBuilder: override inherited property', t => {
  const [{ foo }] = setup()

  foo.base = 'overridden'
  t.equal(foo.base, 'overridden')
  t.end()
})

test('WorldObjectProxyBuilder: deserialize values from the properties hash on get', t => {
  const [{ foo }, db] = setup()

  t.deepEqual(db.findById('foo').properties.foo, { value: 'foo' })
  t.equal(foo.foo, 'foo')
  t.end()
})

test('WorldObjectProxyBuilder: serialize values to the properties hash on set', t => {
  const [{ foo }, db] = setup()

  foo.prop = 'new-prop'
  t.deepEqual(db.findById('foo').properties.prop, { value: 'new-prop' })
  t.end()
})

test('WorldObjectProxyBuilder: get id', t => {
  const [{ foo }] = setup()

  t.equal(foo.id, 'foo')
  t.end()
})

test('WorldObjectProxyBuilder: set id', t => {
  const [{ foo }] = setup()

  foo.id = 'nope'
  t.equal(foo.id, 'foo')
  t.end()
})

test('WorldObjectProxyBuilder: get name', t => {
  const [{ foo }] = setup()

  t.equal(foo.name, 'foo')
  t.end()
})

test('WorldObjectProxyBuilder: set name', t => {
  const [{ foo }] = setup()

  foo.name = 'new name'
  t.equal(foo.name, 'new name')
  t.end()
})

test('WorldObjectProxyBuilder: set name coerces to string', t => {
  const [{ foo }] = setup()

  foo.name = /new name/gi
  t.equal(foo.name, '/new name/gi')
  t.end()
})

test('WorldObjectProxyBuilder: get aliases', t => {
  const [{ foo }] = setup()

  t.deepEqual(foo.aliases, [])
  t.end()
})

test('WorldObjectProxyBuilder: set aliases', t => {
  const [{ foo }] = setup()

  foo.aliases = ['some', 'thing']
  t.deepEqual(foo.aliases, ['some', 'thing'])
  t.end()
})

test('WorldObjectProxyBuilder: set aliases coerces to array of strings', t => {
  const [{ foo }] = setup()

  foo.aliases = [1, 'two', /three/i, {}]
  t.deepEqual(foo.aliases, ['1', 'two', '/three/i', '[object Object]'])
  t.end()
})

test('WorldObjectProxyBuilder: set aliases coerces single value to array', t => {
  const [{ foo }] = setup()

  foo.aliases = 'alias'
  t.deepEqual(foo.aliases, ['alias'])
  t.end()
})

test('WorldObjectProxyBuilder: get userId', t => {
  const [{ foo }] = setup()

  t.equal(foo.userId, null)
  t.end()
})

test('WorldObjectProxyBuilder: set userId', t => {
  const [{ foo }] = setup()

  foo.userId = 'nope'
  t.equal(foo.userId, null)
  t.end()
})

test('WorldObjectProxyBuilder: get location', t => {
  const [{ foo }] = setup()

  t.equal(foo.location.id, 'room')
  t.end()
})

test('WorldObjectProxyBuilder: set location to null', t => {
  const [{ foo }] = setup()

  foo.location = null
  t.equal(foo.location, null)
  t.end()
})

test('WorldObjectProxyBuilder: set location to undefined', t => {
  const [{ foo }] = setup()

  foo.location = undefined
  t.equal(foo.location, null)
  t.end()
})

test('WorldObjectProxyBuilder: set location to another object', t => {
  const [{ foo, bar }] = setup()

  foo.location = bar
  t.equal(foo.location.id, 'bar')
  t.end()
})

test('WorldObjectProxyBuilder: get traits', t => {
  const [{ foo, bar, baz }] = setup()

  t.deepEqual(foo.traits, [bar, baz])
  t.end()
})

test('WorldObjectProxyBuilder: set traits to empty array', t => {
  const [{ foo }] = setup()

  foo.traits = []
  t.deepEqual(foo.traits, [])
  t.end()
})

test('WorldObjectProxyBuilder: set traits to new array of traits', t => {
  const [{ foo, base }] = setup()

  foo.traits = [base]
  t.deepEqual(foo.traits, [base])
  t.end()
})

test('WorldObjectProxyBuilder: responds to "in" operator for own properties', t => {
  const [{ foo }] = setup()

  t.equal('foo' in foo, true)
  t.end()
})

test('WorldObjectProxyBuilder: responds to "in" operator for inherited properties', t => {
  const [{ foo }] = setup()

  t.equal('bar' in foo, true)
  t.end()
})

test('WorldObjectProxyBuilder: responds to "in" operator for non-existent properties', t => {
  const [{ foo }] = setup()

  t.equal('nope' in foo, false)
  t.end()
})

test('WorldObjectProxyBuilder: responds to "in" operator for built-in properties', t => {
  const [{ foo }] = setup()

  t.equal('id' in foo, true)
  t.end()
})

test('WorldObjectProxyBuilder: responds to "in" operator for virtual properties', t => {
  const [{ foo }] = setup()

  t.equal('contents' in foo, true)
  t.end()
})

test('WorldObjectProxyBuilder: responds to "in" operator for world-object properties', t => {
  const [{ foo }] = setup()

  t.equal('new' in foo, true)
  t.end()
})

test('WorldObjectProxyBuilder: get __proxy__', t => {
  const [{ foo }] = setup()

  t.equal(foo.__proxy__, true)
  t.end()
})

test('WorldObjectProxyBuilder: set world-object property', t => {
  const [{ foo }] = setup()

  foo.new = 'nope'
  t.equal(typeof foo.new, 'function')
  t.end()
})

test('WorldObjectProxyBuilder: get contents', t => {
  const [{ room }] = setup()
  const ids = ['base', 'bar', 'baz', 'foo']

  t.deepEqual(room.contents.map(o => o.id), ids)
  t.end()
})

test('WorldObjectProxyBuilder: get "player"', t => {
  const [{ foo }] = setup()

  t.equal(foo.player, false)
  t.end()
})
