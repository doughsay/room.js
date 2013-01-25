vm = require 'vm'
coffee = require 'coffee-script'
_ = require 'underscore'

color = require('./color').color
db = require('./moo').db
connections = require './connection_manager'
mooUtil = require './util'

class Context

  constructor: (@player, @memo = {}) ->
    base =
      eval:       undefined
      c:          color
      $:          (id) => @contextify db.findById(id)
      $player:    if @player? then @contextify @player else @contextify db.nothing
      $here:      if @player.location()? then @contextify @player.location() else @contextify db.nothing

    @context = _.extend @globals(), base

  deserialize: (x) =>
    switch typeof x
      when 'object'
        if x == null
          null
        else if Array.isArray x
          x.map @deserialize
        else if x._mooObject?
          @contextify db.findById x._mooObject
        else
          mooUtil.hmap x, @deserialize
      else
        x

  serialize: (x) =>
    switch typeof x
      when 'object'
        if x == null
          null
        else if Array.isArray x
          x.map @serialize
        else if x instanceof ContextMooObject
          {_mooObject: x.id}
        else
          mooUtil.hmap x, @serialize
      else
        x

  globals: ->
    mooUtil.hkmap db.sys.getAllProperties(), (key, value) =>
      ["$#{key}", @deserialize value]

  # return a context object for the given object
  # also, memoize all the context objects within this context
  contextify: (obj) ->
    if obj? and obj.id?
      if not @memo[obj.id]?
        @memo[obj.id] = new ContextMooObject(obj, @)
      @memo[obj.id]
    else
      null

  decontextify: (contextObj) ->
    db.findById contextObj?.id

  run: (coffeeCode, extraArgs = [], sendOutput = false, stack = true) ->
    try
      code = coffee.compile coffeeCode, bare: true
      ctext = _.clone @context
      ctext.$args = extraArgs
      output = vm.runInNewContext code, ctext
      if sendOutput
        @player.send mooUtil.print output
      output
    catch error
      if stack
        @player.send error.stack.split('\n').map((line) -> color line, 'inverse bold red').join('\n')
      else
        @player.send color error.toString(), 'inverse bold red'

class EvalContext extends Context

  constructor: (player) ->
    super player

    @context.list       = -> db.list()
    @context.search     = (search) -> db.search(search)
    @context.tree       = (root_id) -> db.inheritance_tree(root_id)
    @context.locations  = (root_id) -> db.location_tree(root_id)
    @context.ls         = (x, depth = 2) ->
                            player.send(mooUtil.print x, depth)
                            true

  run: (coffeeCode, extraArgs = []) ->
    super coffeeCode, extraArgs, true

class VerbContext extends Context

  constructor: (player, self, dobj, iobj, verb, argstr, dobjstr, prepstr, iobjstr, memo = {}) ->
    super player, memo

    @context.$this    = if self? then @contextify self else @contextify db.nothing
    @context.$dobj    = if dobj? then @contextify dobj else @contextify db.nothing
    @context.$iobj    = if iobj? then @contextify iobj else @contextify db.nothing
    @context.$verb    = verb
    @context.$argstr  = argstr
    @context.$dobjstr = dobjstr
    @context.$prepstr = prepstr
    @context.$iobjstr = iobjstr
    @context.pass     = ->
                          v = self.parent()?.findVerbByName verb
                          if v?
                            newContext = new VerbContext(
                              player, self, dobj, iobj,
                              verb, argstr, dobjstr, prepstr, iobjstr, memo)
                            newContext.run v.code, Array.prototype.slice.call(arguments)
                          else
                            throw new Error "Cannot 'pass()' because '#{verb}' doesn't exists on a parent of #{self.name}."

  run: (coffeeCode, extraArgs = []) ->
    wrappedCoffeeCode = 'do($args) ->\n' +
      coffeeCode.split('\n').map((line) -> '  ' + line).join('\n')
    super wrappedCoffeeCode, extraArgs

# A ContextMooObject is what's exposed in the verb and eval contexts
class ContextMooObject

  constructor: (object, context) ->

    Object.defineProperties(@, {
      id:
        enumerable: true
        get: -> object.id
        set: -> throw new Error "No setter for 'id'"
      parent:
        enumerable: true
        get: -> context.contextify object.parent()
        set: (contextParent) ->
          if contextParent is null
            parent_id = null
          else if contextParent? and contextParent.id? and context.decontextify(contextParent)?
            parent_id = contextParent.id
          else
            throw new Error "Invalid parent"
          object.chparent parent_id
      name:
        enumerable: true
        get: -> object.name
        set: (name) -> object.rename name
      aliases:
        enumerable: true
        get: -> (alias for alias in object.aliases)
        set: (aliases) -> object.updateAliases aliases
      location:
        enumerable: true
        get: -> context.contextify object.location()
        set: (contextTarget) ->
          if contextTarget is null
            target = null
          else if contextTarget? and contextTarget.id? and context.decontextify(contextTarget)?
            target = context.decontextify contextTarget
          else
            throw new Error "Invalid target"
          object.moveTo target
      contents:
        enumerable: true
        get: -> object.contents().map (o) -> context.contextify o
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
        get: -> mooUtil.hmap object.getAllProperties(), context.deserialize
        set: -> throw new Error "No setter for 'properties'"
      verbs:
        enumerable: true
        get: ->
          verbs = {}
          for verbName, verb of object.getAllVerbs()
            do (verb) =>
              fn = =>
                newContext = new VerbContext(
                  context.player, object, context.context.dobj, context.context.iobj,
                  verb.name, context.context.argstr, context.context.dobjstr, context.context.prepstr, context.context.iobjstr, context.memo)
                newContext.run verb.code, Array.prototype.slice.call(arguments)
              fn.verb = true
              verbs[verb.name] = fn
          verbs
        set: -> throw new Error "No setter for 'verbs'"
    })

    @addProp = (key, value) ->
      object.addProp key, context.serialize value

    @rmProp = (key) ->
      object.rmProp key

    @getProp = (key) ->
      context.deserialize object.getProp key

    @setProp = (key, value) ->
      object.setProp key, context.serialize value

    @editVerb = (verb) ->
      object.editVerb context.player, verb

    @addVerb = (verbName, dobjarg = 'none', preparg = 'none', iobjarg = 'none') ->
      object.addVerbPublic context.player, verbName, dobjarg, preparg, iobjarg

    @rmVerb = (verb) ->
      object.rmVerb verb

    @clone = (newName, newAliases = []) ->
      db.clone(object, newName, newAliases)

    @create = (newName, newAliases = []) ->
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

      @clone = -> throw new Error "Can't clone players."
      @create = -> throw new Error "Can't create players."

    @toString = ->
      if object.player
        "[MooPlayer #{object.name}]"
      else
        "[MooObject #{object.name}]"

runEval = (player, code) ->
  (new EvalContext player).run code

runVerb = (player, code, self, dobj = db.nothing, iobj = db.nothing, verbstr, argstr, dobjstr, prepstr, iobjstr) ->
  context = new VerbContext(
    player, self, dobj, iobj, verbstr, argstr, dobjstr, prepstr, iobjstr)
  context.run code

exports.runVerb = runVerb
exports.runEval = runEval