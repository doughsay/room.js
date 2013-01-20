vm = require 'vm'
coffee = require 'coffee-script'
_ = require 'underscore'

color = require('./color').color
db = require('./moo').db
connections = require './connection_manager'
mooUtil = require './util'

# memoize all the context objects
memo = {}

# return a context object for the given object and context
contextify = (obj, context) ->
  if obj? and obj.id?
    if not memo[obj.id]?
      memo[obj.id] = new ContextMooObject(obj, context)
    memo[obj.id]
  else
    null

# A ContextMooObject is what's exposed in the verb and eval contexts
ContextMooObject = (object, context) ->

  Object.defineProperties(@, {
    id:
      enumerable: true
      get: -> object.id
      set: -> throw new Error "No setter for 'id'"
    var:
      enumerable: true
      get: -> object.var
      set: (newvar) -> object.setVar newvar
    parent_id:
      enumerable: true
      get: -> object.parent_id
      set: (id) -> object.chparent id
    name:
      enumerable: true
      get: -> object.name
      set: (name) -> object.rename name
    aliases:
      enumerable: true
      get: -> (alias for alias in object.aliases)
      set: (aliases) -> object.updateAliases aliases
    location_id:
      enumerable: true
      get: -> object.location_id
      set: -> throw new Error "No setter for 'location_id'"
    contents_ids:
      enumerable: true
      get: -> object.contents_ids
      set: -> throw new Error "No setter for 'contents_ids'"
    mooObject:
      enumerable: true
      get: -> true
      set: -> throw new Error "No setter for 'mooObject'"
    player:
      enumerable: true
      get: -> object.player
      set: -> throw new Error "No setter for 'player'"
    programmer:
      enumerable: true
      get: -> object.programmer
      set: -> throw new Error "No setter for 'programmer'"
    properties:
      enumerable: true
      get: -> mooUtil.hmap object.getAllProperties(), (x) ->
        [value, mooObject] = x
        if mooObject
          contextify db.findById(value), context
        else
          value
      set: -> throw new Error "No setter for 'properties'"
    verbs:
      enumerable: true
      get: ->
        verbs = {}
        for verbName, verb of object.getAllVerbs()
          do (verb) =>
            fn = =>
              try
                verbContext = contextFor('verb', context)
                verbContext.$this = contextify object
                verbContext.$verb = verb.name
                verbContext.$args = arguments
                verbContext.$argstr = Array.prototype.slice.call(arguments).join ' '
                code = coffee.compile verb.code, bare: true
                vm.runInNewContext code, verbContext
              catch error
                player.send color error.toString(), 'inverse bold red'
                #player.send error.stack.split('\n').map((line) -> color line, 'inverse bold red').join('\n')
            fn.verb = true
            verbs[verb.name] = fn
        verbs
      set: -> throw new Error "No setter for 'verbs'"
  })

  @parent = ->
    contextify object.parent(), context

  @location = ->
    contextify object.location(), context

  # safely move this object to another object or limbo (null)
  @moveTo = (contextTarget) ->
    if contextTarget is null
      target = null
    else if contextTarget? and contextTarget.id?
      target = db.findById contextTarget.id
    else
      throw new Error "Invalid target"

    object.moveTo target

  @contents = ->
    object.contents().map (o) -> contextify o, context

  @addProp = (key, value) ->
    if value.mooObject
      object.addProp key, value.id, true
    else
      object.addProp key, value, false

  @rmProp = (key) ->
    object.rmProp key

  @getProp = (key) ->
    [value, mooObject] = object.getProp key
    if mooObject
      contextify db.findById(value), context
    else
      value

  @setProp = (key, value) ->
    if value.mooObject
      object.setProp key, value.id, true
    else
      object.setProp key, value, false

  @chparent = (id) ->
    object.chparent id

  @rename = (name) ->
    object.rename name

  @setVar = (newvar) ->
    object.setVar newvar

  @updateAliases = (aliases) ->
    object.updateAliases aliases

  @editVerb = (verbName) ->
    object.editVerb connections.socketFor(context.$player), verbName

  @addVerb = (verbName, dobjarg = 'none', preparg = 'none', iobjarg = 'none') ->
    object.addVerbPublic connections.socketFor(context.$player), verbName, dobjarg, preparg, iobjarg

  @rmVerb = (verbName) ->
    object.rmVerb verbName

  @clone = (newName, newAliases = []) ->
    db.clone(object, newName, newAliases)

  @createChild = (newName, newAliases = []) ->
    db.createChild(object, newName, newAliases)

  # player specific methods
  if object.player
    @send = (msg) ->
      object.send msg

    @broadcast = (msg) ->
      object.broadcast msg

    @input = (msg, fn) ->
      object.input msg, fn

    @setProgrammer = (programmer) ->
      object.setProgrammer programmer

  @toString = ->
    if object.player
      "[MooPlayer #{object.name}]"
    else
      "[MooObject #{object.name}]"

  # return so coffeescript doesn't screw up the object creation
  return

verbContext = (context) ->
  vars = db.objectsWithVar().reduce ((map, object) ->
    map["$#{object.var}"] = contextify object, context
    map
  ), {}

  base =
    eval:      undefined
    c:         color
    $:         (id) -> contextify db.findById(id), context
    $this:     contextify context.$this, context
    $player:   contextify context.$player, context
    $here:     contextify context.$here, context
    $dobj:     contextify context.$dobj, context
    $iobj:     contextify context.$iobj, context
    $verb:     context.$verb
    $argstr:   context.$argstr
    $dobjstr:  context.$dobjstr
    $prepstr:  context.$prepstr
    $iobjstr:  context.$iobjstr

  _.extend vars, base


evalContext = (context) ->
  vars = db.objectsWithVar().reduce ((map, object) ->
    map["$#{object.var}"] = contextify object, context
    map
  ), {}

  base =
    eval:      undefined
    ls:        (x, depth = 2) ->
                  context.$player.send(mooUtil.print x, depth)
                  true
    c:         color
    $:         (id) -> contextify db.findById(id), context
    $player:   contextify context.$player, context
    $here:     contextify context.$here, context
    list:      -> db.list()
    tree:      (root_id) -> db.inheritance_tree(root_id)
    locations: (root_id) -> db.location_tree(root_id)

  _.extend vars, base

exports.verb = verbContext
exports.eval = evalContext