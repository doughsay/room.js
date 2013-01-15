color = require('./color').color
db = require('./moo').db

$ = (id) -> db.findById id

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

  parent: ->
    if @parent_id isnt null
      new ContextMooObject $ @parent_id
    else
      null

  location: ->
    if @location_id isnt null
      new ContextMooObject $ @location_id
    else
      null

  contents: ->
    $(@id).contents().map (o) ->
      new ContextMooObject o

  # safely move this object to another object or limbo
  moveTo: (wrappedTarget) ->
    if wrappedTarget is null
      target = null
    else if wrappedTarget? and wrappedTarget.id?
      target = $ wrappedTarget.id
    else
      throw new Error "Invalid target"

    self = $ @id
    self.moveTo target

  toString: ->
    "[ContextMooObject #{@name}]"

class ContextMooPlayer extends ContextMooObject

  send: (msg) ->
    $(@id).send msg

  broadcast: (msg) ->
    $(@id).broadcast msg

  toString: ->
    "[ContextMooPlayer #{@name}]"

  # TODO verbs and properties
  # allow object.verb() and object.property (maybe using getters and setters?)

exports.base = ->
  c: color
  $: (id) ->
    o = $ id
    if o.player
      new ContextMooPlayer o
    else
      new ContextMooObject o

exports.eval = ->
  c: color
  $: (id) ->
    o = $ id
    if o.player
      new ContextMooPlayer o
    else
      new ContextMooObject o