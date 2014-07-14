'use strict';
var World = require('./world')
  , SocketMap = require('./socket-map')
  , targets = {}
  , base = require('./base')
  , util = require('./util')

function create(dbObject) {
  var parentTarget = dbObject.parentId ? targets[dbObject.parentId] : base
    , target = Object.create(parentTarget)
    , reservedNames = require('./reserved').base

  targets[dbObject.id] = target

  Object.defineProperty ( target, 'id',
                        { writable: false
                        , configurable: false
                        , enumerable: true
                        , value: dbObject.id
                        })

  dbObject.properties.forEach(function(property) {
    target[property.key] = util.deserialize ( property.value
                                            , target.id
                                            , property.key
                                            )
  })

  dbObject.verbs.forEach(function(verb) {
    target[verb.name] = util.buildVerb(verb)
  })

  function get(target, name, receiver) {
    return util.deserializeReferences(Reflect.get(target, name, receiver))
  }

  // helpers for set

  function updateDbObjectVerb(name, valueToStore) {
    var verb      = dbObject.verbs.filter(function(v) {
                      return v.name === name
                    })[0]
      , property  = dbObject.properties.filter(function(prop) {
                      return prop.key === name
                    })[0]

    if (!verb) {
      dbObject.verbs.push(valueToStore)
    }
    else {
      let index = dbObject.verbs.indexOf(verb)
      dbObject.verbs[index] = valueToStore
    }

    // remove property with same name if it exists
    if (property) {
      dbObject.properties = dbObject.properties.filter(function(prop) {
        return prop.key !== property.key
      })
    }
  }

  function updateDbObjectProperty(name, valueToStore) {
    var verb      = dbObject.verbs.filter(function(v) {
                      return v.name === name
                    })[0]
      , property  = dbObject.properties.filter(function(prop) {
                      return prop.key === name
                    })[0]

    if (!property) {
      dbObject.properties.push({key: name, value: valueToStore})
    }
    else {
      property.value = valueToStore
    }

    // remove verb with same name if it exists
    if (verb) {
      dbObject.verbs = dbObject.verbs.filter(function(v) {
        return v.name !== verb.name
      })
    }
  }

  function set(target, name, value, receiver) {
    var isVerb         = (value && value.__verb__)
      , valueToStore   = isVerb ? util.serializeVerb(name, value)
                                : util.serialize(value)
      , valueToSet     = isVerb ? util.buildVerb(util.serializeVerb(name, value))
                                : util.deserialize(util.serialize(value), target.id, name)
      , updateDbObject = isVerb ? updateDbObjectVerb
                                : updateDbObjectProperty

    if (reservedNames.indexOf(name) === -1) {
      updateDbObject(name, valueToStore)
    }
    return Reflect.set(target, name, valueToSet, receiver)
  }

  function deleteProperty(target, name) {
    if (reservedNames.indexOf(name) === -1) {
      if (target[name] && target[name].__verb__) {
        dbObject.verbs = dbObject.verbs.filter(function(v) {
          return v.name !== name
        })
      }
      else {
        dbObject.properties = dbObject.properties.filter(function(prop) {
          return prop.key !== name
        })
      }
    }
    return Reflect.deleteProperty(target, name)
  }

  return new Proxy( target, { get: get
                            , set: set
                            , deleteProperty: deleteProperty
                            }
                  )
}

module.exports = create
