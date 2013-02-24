# Harmony proxy for RoomJsObject within a verb or eval context

contextModule = require('./context')

module.exports = (obj, context) ->

  keys = (own = false) ->
    ks = ['id', 'parent', 'name', 'aliases', 'location', 'contents', 'children', 'isPlayer', 'crontab']
    if obj.player
      ks.push 'username', 'isProgrammer', 'isOnline'
    props = if own then obj.getOwnProperties() else obj.getAllProperties()
    for prop of props
      ks.push prop
    verbs = if own then obj.getOwnVerbs() else obj.getAllVerbs()
    for verbName, verb of verbs
      ks.push verb.propName() unless verb.propName() in ks
    ks.push 'inheritsFrom', 'create', 'editVerb', 'addVerb', 'addJob', 'rmJob', 'startJob', 'stopJob'
    if obj.player
      ks.push 'send', 'input'
    ks

  ownKeys = ->
    keys true

  reservedKeys = ->
    ks = ['id', 'parent', 'name', 'aliases', 'location', 'contents', 'children', 'isPlayer', 'crontab']
    if obj.player
      ks.push 'username', 'isProgrammer', 'isOnline'
    ks.push 'inheritsFrom', 'create', 'editVerb', 'addVerb', 'addJob', 'rmJob', 'startJob', 'stopJob'
    if obj.player
      ks.push 'send', 'input'
    ks

  getOwnPropertyDescriptor: (name) ->
    if name in ownKeys()
      value: obj[name]
      writable: true
      enumerable: true
      configurable: true
    else
      undefined

  getPropertyDescriptor: (name) ->
    if name in keys()
      value: obj[name]
      writable: true
      enumerable: true
      configurable: true
    else
      undefined

  getOwnPropertyNames: ->
    ownKeys()

  getPropertyNames: ->
    keys()

  defineProperty: (name, desc) ->
    throw new Error 'defineProperty not permitted on '+obj.toString()

  delete: (name) ->
    if obj.hasOwnProp name
      obj.rmProp name
    else if obj.hasOwnVerb name
      obj.rmVerb name
    else
      false

  fix: ->
    throw new Error 'fix not permitted on '+obj.toString()

  has: (name) ->
    name in keys()

  hasOwn: (name) ->
    name in ownKeys()

  get: (receiver, name) ->
    passthrough = ['id', 'name', 'aliases', 'username', 'toString']

    if name in passthrough
      obj[name]
    else
      switch name
        when 'proxy'
          true

        when 'parent'
          context.contextify obj.parent()

        when 'location'
          context.contextify obj.location()

        when 'contents'
          obj.contents().map (o) -> context.contextify o

        when 'inheritsFrom'
          (o) -> obj.inheritsFrom o?.id

        when 'isPlayer'
          obj.player

        when 'isProgrammer'
          obj.programmer

        when 'isOnline'
          obj.online?()

        when 'children'
          obj.children().map (o) -> context.contextify o

        when 'crontab'
          obj.crontab.map (job) ->
            spec: job.spec
            verb: job.verb
            enabled: job.enabled

        when 'editVerb'
          (verbName) -> obj.editVerb context.player, verbName

        when 'addVerb'
          (verbName, hidden = false, dobjarg = 'none', preparg = 'none', iobjarg = 'none') ->
            obj.addVerbPublic context.player, verbName, hidden, dobjarg, preparg, iobjarg

        when 'create'
          (newName, newAliases = []) ->
            context.contextify context.db.createChild(obj, newName, newAliases)

        when 'addJob'
          (spec, verbName, start = false) -> obj.addJob spec, verbName, start

        when 'rmJob'
          (i) -> obj.rmJob i

        when 'startJob'
          (i) -> obj.startJob i

        when 'stopJob'
          (i) -> obj.stopJob i

        when 'send'
          (msg) -> obj.send msg

        when 'input'
          (msg, fn) -> obj.input msg, fn

        else
          if obj.hasProp name
            context.deserialize obj.getProp(name), (o) ->
              obj.setProp name, o
          else if (verb = obj.findVerbByName name)
            fn = ->
              contextModule.runVerb context.db,
                context.player,
                verb, obj,
                context.context.dobj,
                context.context.iobj,
                verb.propName(), context.context.argstr,
                context.context.dobjstr,
                context.context.prepstr,
                context.context.iobjstr,
                Array.prototype.slice.call(arguments),
                context.memo
            fn.verb = true
            fn.hidden = verb.hidden
            fn
          else
            undefined

  set: (receiver, name, val) ->
    switch name
      when 'parent'
        contextParent = val
        if contextParent is null
          parent_id = null
        else if contextParent? and contextParent.id? and context.decontextify(contextParent)?
          parent_id = contextParent.id
        else
          throw new Error "Invalid parent"
        obj.chparent parent_id

      when 'name'
        name = val
        obj.rename name

      when 'aliases'
        aliases = val
        obj.updateAliases aliases

      when 'location'
        contextTarget = val
        if contextTarget is null
          target = null
        else if contextTarget? and contextTarget.id? and context.decontextify(contextTarget)?
          target = context.decontextify contextTarget
        else
          throw new Error "Invalid target"
        obj.moveTo target

      when 'isProgrammer'
        if obj.player
          programmer = !!val
          obj.setProgrammer programmer
        else
          throw new Error "no setter for '#{name}'"

      else
        if name in reservedKeys()
          throw new Error "cannot set reserved key #{name}"
        v = obj.findVerbByName name
        if v?
          throw new Error "cannot overwrite verb '#{v.name}'"
        else if obj.hasProp name
          obj.setProp name, context.serialize val
        else
          console.log 'adding prop'
          obj.addProp name, context.serialize val

  enumerate: ->
    keys()

  keys: ->
    keys()