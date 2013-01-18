vm = require 'vm'
coffee = require 'coffee-script'

color = require('./color').color
db = require('./moo').db

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
      get: -> object.getAllProperties()
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
                #context.$player.send c error.toString(), 'inverse bold red'
                player.send error.stack.split('\n').map((line) -> color line, 'inverse bold red').join('\n')
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
    object.addProp key, value

  @rmProp = (key) ->
    object.rmProp key

  @getProp = (key) ->
    object.getProp key

  @setProp = (key, value) ->
    object.setProp key, value

  # player specific methods
  if object.player
    @send = (msg) ->
      object.send msg

    @broadcast = (msg) ->
      object.broadcast msg

  @toString = ->
    if object.player
      "[ContextMooPlayer #{object.name}]"
    else
      "[ContextMooObject #{object.name}]"

  # return so coffeescript doesn't screw up the object creation
  return

contextFor = (type, context) ->

  switch type
    when 'verb'
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
    when 'eval'
      c:         color
      $:         (id) -> contextify db.findById(id), context
      $player:   contextify context.$player, context
      $here:     contextify context.$here, context

exports.for = contextFor