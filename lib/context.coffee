color = require('./color').color
db = require('./moo').db
coffee = require 'coffee-script'
vm = require 'vm'

$ = (id) -> db.findById id

defineProperties = (object, opts) =>
  for property, accessors of opts
    do (property, accessors) ->
      Object.defineProperty object, property, {
        enumerable: true
        get: accessors.get or -> throw new Error "No getter for #{property}"
        set: accessors.set or -> throw new Error "No setter for #{property}"
      }

contextFor = (type, context) ->

  # wrap real objects in context wrappers and memoize
  contextify = (o) ->
    if o? and o.id?
      if context["$#{o.id}"]?
        context["$#{o.id}"]
      else if o.player
        context["$#{o.id}"] = new ContextMooPlayer o
      else
        context["$#{o.id}"] = new ContextMooObject o
    else
      null

  # a wrapper class for MooObject
  # this exposes only safe moo-usable methods and properties.
  # it also prevents randomly deleting or assigning any properties of the innner
  # MooObject
  class ContextMooObject

    constructor: (object) ->

      defineProperties @,
        id:
          get: -> object.id
        parent_id:
          get: -> object.parent_id
          set: (id) -> object.chparent id
        name:
          get: -> object.name
          set: (name) -> object.rename name
        aliases:
          get: -> object.aliases
          set: (aliases) -> object.updateAliases aliases
        location_id:
          get: -> object.location_id
        contents_ids:
          get: -> object.contents_ids
        player:
          get: -> !!object.player
        programmer:
          get: -> !!object.programmer

      for key, value of object.getAllProperties()
        do (key, value) =>
          params = {}
          params["#{key}"] =
            get: -> object.prop key
            set: (newValue) -> object.prop key, newValue
          defineProperties @, params

      for verb in object.getAllVerbsArray()
        do (verb) =>
          f = =>
            try
              verbContext = contextFor('verb', context)
              verbContext.$this = @
              verbContext.$verb = verb.name
              verbContext.$args = arguments
              verbContext.$argstr = Array.prototype.slice.call(arguments).join ' '
              code = coffee.compile verb.code, bare: true
              vm.runInNewContext code, verbContext
            catch error
              context.$player.send color error.toString(), 'inverse bold red'
          f.verb = true
          @[verb.name] = f

    parent: -> contextify $ @parent_id

    location: -> contextify $ @location_id

    contents: ->
      $(@id).contents().map (o) ->
        contextify o

    # safely move this object to another object or limbo (null)
    moveTo: (wrappedTarget) ->
      if wrappedTarget is null
        target = null
      else if wrappedTarget? and wrappedTarget.id?
        target = $ wrappedTarget.id
      else
        throw new Error "Invalid target"

      self = $ @id
      self.moveTo target

    prop: (key, value) ->
      $(@id).prop key, value

      # if a new property was added, add the getter and setter for it
      if not @[key]?
        params = {}
        object = $(@id)
        params["#{key}"] =
          get: -> object.prop key
          set: (newValue) -> object.prop key, newValue
        defineProperties @, params

    chparent: (id) ->
      throw new Error 'TODO'

    rename: (name) ->
      throw new Error 'TODO'

    updateAliases: (aliases) ->
      throw new Error 'TODO'

    addAlias: (alias) ->
      throw new Error 'TODO'

    rmAlias: (alias) ->
      throw new Error 'TODO'

    clone: (name, aliases = []) ->
      contextify db.clone $(@id), name, aliases
      true

    createChild: (name, aliases = []) ->
      contextify db.createChild $(@id), name, aliases
      true

    toString: ->
      "[ContextMooObject #{@name}]"

  class ContextMooPlayer extends ContextMooObject

    constructor: (object) ->
      super object
      # hack to hide 'constructor' in object printout for players
      delete @__proto__.constructor

    send: (msg) ->
      $(@id).send msg

    broadcast: (msg) ->
      $(@id).broadcast msg

    toString: ->
      "[ContextMooPlayer #{@name}]"

  switch type
    when 'verb'
      c:         color
      $: (id) -> contextify $ id
      $this:     contextify context.$this
      $player:   contextify context.$player
      $here:     contextify context.$here
      $dobj:     contextify context.$dobj
      $iobj:     contextify context.$iobj
      $verb:     context.$verb
      $argstr:   context.$argstr
      $dobjstr:  context.$dobjstr
      $prepstr:  context.$prepstr
      $iobjstr:  context.$iobjstr
    when 'eval'
      c:         color
      $: (id) -> contextify $ id
      $player:   contextify context.$player
      $here:     contextify context.$here

exports.for = contextFor