color = require('./color').color
db = require('./moo').db

$ = (id) -> db.findById id

exports.for = (type, context) ->

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
      @id = object.id
      @parent_id = object.parent_id
      @name = object.name
      @aliases = object.aliases
      @location_id = object.location_id
      @contents_ids = object.contents_ids
      @player = !!object.player
      @programmer = !!object.programmer

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

    prop: (key, newValue = undefined) ->
      $(@id).prop key, newValue

    # TODO call: (verb, args...) ->

    # TODO rename: (newName) ->

    # TODO chparent: (newParentId) ->

    # TODO (maybe)
    # add each verb as a callable function here
    # add each property as a getter and setter here

    toString: ->
      "[ContextMooObject #{@name}]"

  class ContextMooPlayer extends ContextMooObject

    constructor: (object) ->
      super object

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
      $me:       contextify context.$me
      $here:     contextify context.$here