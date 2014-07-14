'use strict';
var schema = require('js-schema')
  , World = require('./world')
  , objectArgs =  [ 'none'
                  , 'any'
                  , 'this'
                  ]
  , prepArgs =    [ 'none'
                  , 'any'
                  , 'with/using'
                  , 'at/to'
                  , 'in front of'
                  , 'in/inside/into'
                  , 'on top of/on/onto/upon'
                  , 'out of/from inside/from'
                  , 'over'
                  , 'through'
                  , 'under/underneath/beneath'
                  , 'behind'
                  , 'beside'
                  , 'for/about'
                  , 'is'
                  , 'as'
                  , 'off/off of'
                  ]
  , jsVariableRegex = /^[$A-Z_][0-9A-Z_$]*$/i
  , validateObject = schema({ id: jsVariableRegex
                            , parentId: [null, jsVariableRegex]
                            , locationId: [null, jsVariableRegex]
                            , name: String
                            , type: 'WorldObject'
                            , aliases: Array.of(String)
                            , properties:  Array.of({ key: String
                                                    , value: undefined
                                                    })
                            , verbs:       Array.of({ name: String
                                                    , dobjarg: objectArgs
                                                    , preparg: prepArgs
                                                    , iobjarg: objectArgs
                                                    , code: String
                                                    })
                            , createdAt: Date
                            })

function makeObject(object) {
  var defaults =  { id: void 0
                  , parentId: void 0
                  , locationId: void 0
                  , name: void 0
                  , type: 'WorldObject'
                  , aliases: []
                  , properties: []
                  , verbs: []
                  , createdAt: new Date()
                  }
    , newObject = {}


  // whitelist properties and fill in defaults
  for (let key in defaults) {
    newObject[key] = object[key] || defaults[key]
  }

  // always set type and createdAt to default
  newObject.type = defaults.type
  newObject.createdAt = defaults.createdAt

  if (!validateObject(newObject)) {
    throw new Error('Invalid object.')
  }
  if (newObject.id in World) {
    throw new Error([ 'Object with ID `'
                    , newObject.id
                    , '` already exists.'
                    ].join(''))
  }
  if (newObject.parentId && !(newObject.parentId in World)) {
    throw new Error([ 'Object with ID `'
                    , newObject.parentId
                    , '` does not exist.'
                    ].join(''))
  }
  if (newObject.locationId && !(newObject.locationId in World)) {
    throw new Error([ 'Object with ID `'
                    , newObject.locationId
                    , '` does not exist.'
                    ].join(''))
  }

  return newObject
}

module.exports = makeObject
