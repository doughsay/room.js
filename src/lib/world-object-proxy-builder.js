const C3 = require('./c3')
const serialize = require('./serialize')

function linearize (target, db, linearization = new C3(target)) {
  target.traitIds.forEach((traitId, index) => {
    const trait = db.findById(traitId)
    if (trait !== undefined) {
      linearization.add(target, trait)
      linearize(trait, db, linearization)
    } else {
      // Attempt at gracefully handle a broken trait chain
      // e.g. the parent object was destroyed
      target.traitIds.splice(index, 1)
    }
  })
  return linearization.run()
}

const builtInProperties = ['id', 'name', 'aliases', 'userId']
function builtInProperty (property) {
  return builtInProperties.indexOf(property) !== -1
}

const virtualProperties = ['traits', 'location', 'contents', 'player']
function virtualProperty (property) {
  return virtualProperties.indexOf(property) !== -1
}

function toString (value) {
  return `${value}`
}

class Handler {
  constructor (db, world, WorldObject) {
    this.db = db
    this.world = world
    this.deserializer = world.deserializer
    this.worldObject = new WorldObject()
  }

  worldObjectProperty (property) {
    return property in this.worldObject
  }

  static _getBuiltInProperty (target, property) {
    if (property === 'aliases') {
      return target[property].slice()
    }
    return target[property]
  }

  _getVirtualProperty (target, property) {
    if (property === 'traits') {
      return target.traitIds.map(traitId => this.world.get(traitId))
    } else if (property === 'location') {
      return this.world.get(target.locationId) || null
    } else if (property === 'contents') {
      return this.db.findBy('locationId', target.id).map(o => this.world.get(o.id))
    } else if (property === 'player') {
      return !!target.userId
    }
    throw new Error(`Called _getVirtualProperty for non-virtual property '${property}'.`)
  }

  get (target, property) {
    if (property === '__proxy__') { return true }
    if (builtInProperty(property)) { return Handler._getBuiltInProperty(target, property) }
    if (virtualProperty(property)) { return this._getVirtualProperty(target, property) }
    if (this.worldObjectProperty(property)) { return target[property] }

    const targets = linearize(target, this.db)
    for (let i = 0; i < targets.length; i += 1) {
      const tgt = targets[i]
      if (property in tgt.properties) {
        return this.deserializer.deserialize(tgt.properties[property])
      }
    }
    return undefined
  }

  has (target, property) {
    if (builtInProperty(property)) { return true }
    if (virtualProperty(property)) { return true }
    if (this.worldObjectProperty(property)) { return true }

    const targets = linearize(target, this.db)
    for (let i = 0; i < targets.length; i += 1) {
      const tgt = targets[i]
      if (property in tgt.properties) { return true }
    }
    return false
  }

  enumerate (target) {
    const targets = linearize(target, this.db)
    const propertySet = new Set(builtInProperties.concat(virtualProperties))
    targets.forEach(tgt => {
      for (const property in tgt.properties) { // eslint-disable-line guard-for-in
        propertySet.add(property)
      }
    })
    return propertySet.values()
  }

  static _setBuiltInProperty (property, target, value) {
    if (['id', 'userId'].indexOf(property) !== -1) {
      return true
    } else if (property === 'name') {
      return Reflect.set(target, property, toString(value))
    } else if (property === 'aliases') {
      const values = Array.isArray(value) ? value : [value]
      return Reflect.set(target, property, values.map(toString))
    }
    throw new Error(`Called _setBuiltInProperty for non-built in property '${property}'.`)
  }

  _setLocation (target, value) {
    if (value == null) { // eslint-disable-line eqeqeq
      return Reflect.set(target, 'locationId', null)
    } else if (value.id && this.world.get(toString(value.id))) {
      return Reflect.set(target, 'locationId', toString(value.id))
    }
    throw new Error('Invalid location object')
  }

  _setTraits (target, newTraits) {
    const newTraitIds = []
    if (!Array.isArray(newTraits)) { throw new Error('Traits must be an array of objects') }
    newTraits.forEach(newTrait => {
      if (newTrait && newTrait.id && this.world.get(toString(newTrait.id))) {
        newTraitIds.push(newTrait.id)
      } else {
        throw new Error('Invalid trait object')
      }
    })
    return Reflect.set(target, 'traitIds', newTraitIds)
  }

  _setVirtualProperty (property, target, value) {
    if (property === 'location') {
      return this._setLocation(target, value)
    } else if (property === 'traits') {
      return this._setTraits(target, value)
    } else if (property === 'contents' || property === 'player') {
      return true
    }
    throw new Error(`Called _setVirtualProperty for non-virtual property '${property}'.`)
  }

  set (target, property, value) {
    const _s = fn => {
      const retVal = fn()
      this.db.markObjectDirty(target.id)
      return retVal
    }
    if (builtInProperty(property)) {
      return _s(() => Handler._setBuiltInProperty(property, target, value))
    }
    if (virtualProperty(property)) {
      return _s(() => this._setVirtualProperty(property, target, value))
    }
    if (this.worldObjectProperty(property)) { return true }
    return _s(() => Reflect.set(target.properties, property, serialize(value)))
  }

  deleteProperty (target, property) {
    const originalValue = target.properties[property]
    const retVal = Reflect.deleteProperty(target.properties, property)
    this.db.removeProperty(target.id, property, originalValue)
    return retVal
  }

  ownKeys (target) { // eslint-disable-line class-methods-use-this
    return builtInProperties.concat(virtualProperties).concat(Reflect.ownKeys(target.properties))
  }

  _virtualPropertyDescriptor (target, property) {
    return {
      value: this._getVirtualProperty(target, property),
      writable: true,
      enumerable: property !== 'player',
      configurable: true
    }
  }

  getOwnPropertyDescriptor (target, property) {
    if (builtInProperty(property)) { return Reflect.getOwnPropertyDescriptor(target, property) }
    if (virtualProperty(property)) { return this._virtualPropertyDescriptor(target, property) }
    const output = Reflect.getOwnPropertyDescriptor(target.properties, property)
    if (output && output.value) {
      output.value = this.deserializer.deserialize(output.value)
    }
    return output
  }
}

class WorldObjectProxyBuilder {
  constructor (db, world, WorldObject) {
    this.WorldObject = WorldObject
    this.handler = new Handler(db, world, WorldObject)
  }

  build (target) {
    Object.setPrototypeOf(target, this.WorldObject.prototype)
    return new Proxy(target, this.handler)
  }
}

module.exports = WorldObjectProxyBuilder
