const serialize = require('../../src/lib/serialize')

function targetFactory (id, traitIds, properties) {
  const serializedProperties = {}
  for (const key in properties) { // eslint-disable-line guard-for-in
    serializedProperties[key] = serialize(properties[key])
  }

  const locationId = id === 'room' ? null : 'room'

  return {
    id,
    name: id,
    aliases: [],
    traitIds,
    locationId,
    userId: null,
    properties: serializedProperties
  }
}

function mockDd () {
  const baseTarget = targetFactory('base', [], { base: 'base' })
  const roomTarget = targetFactory('room', ['base'], {})
  const barTarget = targetFactory('bar', ['base'], { bar: 'bar', shared: 'from-bar' })
  const bazTarget = targetFactory('baz', ['base'], { baz: 'baz', shared: 'from-baz' })
  const fooTarget = targetFactory('foo', ['bar', 'baz'], { foo: 'foo' })

  return {
    findById (id) {
      if (id === 'base') {
        return baseTarget
      } else if (id === 'bar') {
        return barTarget
      } else if (id === 'baz') {
        return bazTarget
      } else if (id === 'foo') {
        return fooTarget
      } else if (id === 'room') {
        return roomTarget
      }
      return undefined
    },

    findBy (field, value) {
      return [baseTarget, roomTarget, barTarget, bazTarget, fooTarget]
        .filter(object => object[field] === value)
    },

    all () {
      return [baseTarget, roomTarget, barTarget, bazTarget, fooTarget]
    },

    ids () {
      return ['base', 'room', 'bar', 'baz', 'foo']
    },

    playerIds () {
      return []
    },

    on () {},
    markObjectDirty () {},
    removeProperty () {}
  }
}

module.exports = mockDd
