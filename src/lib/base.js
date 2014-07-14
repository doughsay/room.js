'use strict';
var SocketMap = require('./socket-map')
  , World = require('./world')
  , db = require('./db')
  , util = require('./util')
  , makeObject = require('./make-object')
  , makeVerb = require('./make-verb')
  , deserializeReferences = require('./util').deserializeReferences
  , base = {}
  , reservedGlobals = require('./reserved').globals

const NO_MATCH = 0
    , EXACT_MATCH = 1
    , PARTIAL_MATCH = 2

// base object functions

function toString() {
  return '[object ' + this.id + ' (' + this.name + ')]'
}

function isA(obj) {
  var x = this
  while (x) {
    x = x.parent
    if (x === obj) {
      return true
    }
  }
  return false
}

function send(msg) {
  var socket = SocketMap[this.id]
  if (socket) {
    socket.emit('output', msg)
    return true
  }
  else {
    return false
  }
}

function ask(params, callback) {
  var socket = SocketMap[this.id]
    , player = this
    , data

  if (typeof params === 'string') {
    data = params
  }
  else if (params) {
    data = {}
    if (params.message && typeof params.message === 'string') {
      data.message = params.message
    }
    if (params.prompt && typeof params.prompt === 'string') {
      data.prompt = params.prompt
    }
    if (params.password && typeof params.password === 'boolean') {
      data.password = params.password
    }
  }
  else {
    throw new Error('You must provide a valid message. Usage: player.ask("Hello?", function(response) { ... })')
  }

  if (typeof callback !== 'function') {
    throw new Error('You must provide a callback function. Usage: player.ask("Hello?", function(response) { ... })')
  }

  if (socket) {
    socket.emit('request-input', data, function(response) {
      try {
        callback(response)
      }
      catch (err) {
        util.sendError(player, err)
      }
      socket.emit('done')
    })
    return true
  }
  else {
    return false
  }
}

function prompt(str) {
  var socket = SocketMap[this.id]
  if (socket) {
    socket.emit('output', {prompt: str})
    return true
  }
  else {
    return false
  }
}

function match(x, y) {
  x = x.toLowerCase()
  y = y.toLowerCase()
  if (x === y) {
    return EXACT_MATCH
  }
  if (x.indexOf(y) === 0) {
    return PARTIAL_MATCH
  }
  return NO_MATCH
}

function matches(search) {
  var _matches = this.aliases.concat([this.name]).map(function(name) {
    return match(name, search)
  })

  if (_matches.indexOf(EXACT_MATCH) >= 0) {
    return EXACT_MATCH
  }
  if (_matches.indexOf(PARTIAL_MATCH) >= 0) {
    return PARTIAL_MATCH
  }
  return NO_MATCH
}

function findVerb(command, objects, self) {
  if (!self) {
    self = this
  }

  for (let key in this) {
    let prop = this[key]
    if (prop && prop.__verb__ && prop.matchesCommand(command, objects, self)) {
      return key
    }
  }
}

function destroy() {
  var children = this.children

  if (this.isPlayer && this.isOnline) {
    throw new Error(this.id + ' is a player and is online, therefore cannot be destroyed.')
  }

  if (children.length > 0) {
    let grandParent = this.parent

    this.children.forEach(function(child) {
      child.parent = grandParent
    })
  }

  db.removeById(this.id)
  delete World[this.id]
  return true
}

function getContents() {
  return db.findBy('locationId', this.id).map(function(object) {
    return World[object.id]
  })
}

function getChildren() {
  return db.findBy('parentId', this.id).map(function(object) {
    return World[object.id]
  })
}

function getParent() {
  return World[db.findById(this.id).parentId]
}

function setParent(newParent) {
  var newParentId
    , oldParentId = this.parent ? this.parent.id : void 0
    , dbObject = db.findById(this.id)

  newParent = deserializeReferences(newParent)
  newParentId = newParent ? newParent.id : void 0

  if (!newParent || !(newParentId in World)) {
    throw new Error('Parent must be a valid world object.')
  }

  if (dbObject.parentId !== newParentId) {
    dbObject.parentId = newParentId
    this.reload()
  }
}

function reload() {
  // TODO this is a circular dependency, fix this
  var worldObjectProxy = require('./world-object-proxy')
  World[this.id] = worldObjectProxy(db.findById(this.id))
  World[this.id].children.forEach(function(child) {
    child.reload()
  })
  return true
}

function getLocation() {
  return World[db.findById(this.id).locationId]
}

function setLocation(newLocation) {
  var newLocationId
    , oldLocationId = this.location ? this.location.id : void 0

  newLocation = deserializeReferences(newLocation)
  newLocationId = newLocation ? newLocation.id : void 0

  if (newLocationId && !(newLocationId in World)) {
    throw new Error('Location must be null, undefined, or a valid world object.')
  }

  db.findById(this.id).locationId = newLocationId
}

function getName() {
  return db.findById(this.id).name
}

function nameTaken(player, name) {
  for (let id in World) {
    let object = World[id]

    if(object !== player && object.name === name) {
      return true
    }
  }
  return false
}

function setName(newName) {
  var dbObject = db.findById(this.id)

  if (!(newName && newName.constructor.name === 'String')) {
    throw new Error('Name must be a non-empty string.')
  }
  if (this.isPlayer && nameTaken(this, newName)) {
    throw new Error('Sorry, that name belongs to another player.')
  }
  if (dbObject.name !== newName) {
    if (this.isPlayer) { this.prompt(newName) }
    dbObject.name = newName
  }
}

function getAliases() {
  return db.findById(this.id).aliases
}

function setAliases(newAliases) {
  if (newAliases && newAliases.constructor.name === 'Array') {
    newAliases.forEach(function(x) {
      if (!(x && x.constructor.name === 'String')) {
        throw new Error('Aliases must be an array of non-empty strings.')
      }
    })
  }
  else {
    throw new Error('Aliases must be an array of non-empty strings.')
  }

  db.findById(this.id).aliases = newAliases
}

function getIsPlayer() {
  return db.findById(this.id).type === 'Player'
}

function getIsOnline() {
  if (this.isPlayer) {
    return SocketMap[this.id] ? true : false
  }
}

function getIsProgrammer() {
  if (this.isPlayer) {
    return db.findById(this.id).isProgrammer
  }
}

function setIsProgrammer(newBool) {
  if (this.isPlayer) {
    db.findById(this.id).isProgrammer = !!newBool
  }
  else {
    throw new Error(this.is + ' is not a player.')
  }
}

function getLastActivity() {
  if (this.isPlayer) {
    return db.findById(this.id).lastActivity
  }
}

function matchObjects(command) {
  return  { dobj: command.dobjstr ? this.findObject(command.dobjstr) : World.Nothing
          , iobj: command.iobjstr ? this.findObject(command.iobjstr) : World.Nothing
          }
}

function findObject(search) {
  if (search === 'me' || search === 'myself') {
    return this
  }
  else if (search == 'here') {
    return this.location
  }
  else {
    return this.findNearby(search)
  }
}

function findNearby(search) {
  var exactMatches
    , matches
    , partialMatches
    , searchItems

  if (search === '') {
    return World.FailedMatch
  }
  searchItems = this.contents
                    .concat((this.location ? this.location.contents : [])
                    .filter(function(object) {
    return object !== this
  }))
  matches = searchItems.map(function(object) {
    return [object.matches(search), object]
  })
  exactMatches = matches.filter(function(match) {
    return match[0] === EXACT_MATCH
  })
  partialMatches = matches.filter(function(match) {
    return match[0] === PARTIAL_MATCH
  })
  if (exactMatches.length === 1) {
    return exactMatches[0][1]
  }
  else if (exactMatches.length > 1) {
    return World.AmbiguousMatch
  }
  if (partialMatches.length === 1) {
    return partialMatches[0][1]
  }
  else if (partialMatches.length > 1) {
    return World.AmbiguousMatch
  }
  return World.FailedMatch
}

function newObject(object) {
  // TODO this is a circular dependency, fix this
  var worldObjectProxy = require('./world-object-proxy')
    , newObj
    , id = object.id

  if (reservedGlobals.indexOf(id) !== -1) {
    throw new Error(id + ' is a reserved name.')
  }

  object.parentId = this.id
  newObj = makeObject(object)

  db.insert(newObj)
  World[id] = worldObjectProxy(newObj)
  return World[id]
}

function edit(name) {
  var e = function(socket) {
    if (this[name] && this[name].__verb__) {
      socket.emit('edit-verb', {objectId: this.id, verb: util.serializeVerb(name, this[name])})
    }
    else if (this[name] && this[name].__source__) {
      socket.emit('edit-function', {objectId: this.id, src: this[name].__source__, name: name})
    }
    else {
      throw new Error('Invalid edit call. Usage: '+this.id+'.edit(verbOrFunctionName)')
    }
  }.bind(this)

  return {__requires_socket__: e}
}

function addVerb(name, pattern, dobjarg, preparg, iobjarg, code) {
  this[name] = makeVerb(pattern, dobjarg, preparg, iobjarg, code, name)
  return this.edit(name)
}

function addFunction(name) {
  // TODO use vm here instead of eval
  this[name] = eval('(function '+name+'() {\n  \n})')
  return this.edit(name)
}

// override toString on built in functions to hide "native code"
util.overrideToString(toString, 'toString')
util.overrideToString(isA, 'isA')
util.overrideToString(send, 'send')
util.overrideToString(ask, 'ask')
util.overrideToString(prompt, 'prompt')
util.overrideToString(matches, 'matches')
util.overrideToString(findVerb, 'findVerb')
util.overrideToString(destroy, 'destroy')
util.overrideToString(reload, 'reload')
util.overrideToString(matchObjects, 'matchObjects')
util.overrideToString(findObject, 'findObject')
util.overrideToString(findNearby, 'findNearby')
util.overrideToString(newObject, 'newObject')
util.overrideToString(edit, 'edit')
util.overrideToString(addVerb, 'addVerb')
util.overrideToString(addFunction, 'addFunction')

util.modifyObject(base, function(property, accessor) {

  // attach properties

  property('toString', toString)
  property('isA', isA)
  property('send', send)
  property('ask', ask)
  property('prompt', prompt)
  property('matches', matches)
  property('findVerb', findVerb)
  property('destroy', destroy)
  property('reload', reload)
  property('matchObjects', matchObjects)
  property('findObject', findObject)
  property('findNearby', findNearby)
  property('new', newObject)
  property('edit', edit)
  property('addVerb', addVerb)
  property('addFunction', addFunction)
  property('__proxy__', true)

  // attach getters/setters

  accessor('contents', getContents)
  accessor('children', getChildren)
  accessor('parent', getParent, setParent)
  accessor('location', getLocation, setLocation)
  accessor('name', getName, setName)
  accessor('aliases', getAliases, setAliases)
  accessor('isPlayer', getIsPlayer, null, false)
  accessor('isOnline', getIsOnline, null, false)
  accessor('isProgrammer', getIsProgrammer, setIsProgrammer, false)
  accessor('lastActivity', getLastActivity, null, false)

})

module.exports = base
