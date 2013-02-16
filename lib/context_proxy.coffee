# Harmony proxy for RoomJsObject within a verb or eval context

contextModule = require('./context')

module.exports = (obj, context) ->

  keys = ->
    ks = ['id', 'parent', 'name', 'aliases', 'location', 'contents', 'player', 'crontab']
    if obj.player
      ks.push 'username', 'programmer', 'online'
    for prop of obj.getAllProperties()
      ks.push prop
    for verbName of obj.getAllVerbs()
      # take the first of potentially multiple space seperated names
      propName = verbName.split(' ')[0]
      # if the name has a * in it, remove it. (unless it's only a *)
      if propName != '*'
        propName = propName.replace '*', ''
      ks.push propName
    ks.push 'create', 'addProp', 'rmProp', 'editVerb', 'addVerb', 'rmVerb', 'addJob', 'rmJob', 'startJob', 'stopJob'
    if obj.player
      ks.push 'send', 'input'
    ks

  # TODO
  getOwnPropertyDescriptor: (name) ->
    desc = Object.getOwnPropertyDescriptor(obj, name)

    # a trapping proxy's properties must always be configurable
    desc?.configurable = true
    desc

  # TODO
  # not in ES5
  getPropertyDescriptor: (name) ->
    desc = Object.getPropertyDescriptor(obj, name)

    # a trapping proxy's properties must always be configurable
    desc?.configurable = true
    desc

  # TODO
  getOwnPropertyNames: ->
    Object.getOwnPropertyNames obj

  #TODO
  # not in ES5
  getPropertyNames: ->
    Object.getPropertyNames obj

  defineProperty: (name, desc) ->
    throw new Error 'not allowed'

  # TODO
  delete: (name) ->
    delete obj[name]

  fix: ->
    throw new Error 'not allowed'

  # TODO
  has: (name) ->
    name of obj

  # TODO
  hasOwn: (name) ->
    ({}).hasOwnProperty.call obj, name

  get: (receiver, name) ->
    passthrough = ['id', 'name', 'aliases', 'player', 'username', 'programmer', 'toString']
    passthroughAsFn = ['online']

    if name in passthrough
      obj[name]
    else if name in passthroughAsFn
      obj[name]?()
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

        when 'crontab'
          obj.crontab.map (job) ->
            spec: job.spec
            verb: job.verb
            enabled: job.enabled

        when 'addProp'
          (key, value) ->
            obj.setProp key, context.serialize value
            value

        when 'rmProp'
          (key) -> obj.rmProp key

        when 'editVerb'
          (verbName) -> obj.editVerb context.player, verbName

        when 'addVerb'
          (verbName, hidden = false, dobjarg = 'none', preparg = 'none', iobjarg = 'none') ->
            obj.addVerbPublic context.player, verbName, hidden, dobjarg, preparg, iobjarg

        when 'rmVerb'
          (verbName) -> obj.rmVerb verbName

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
                context.player, verb, obj,
                context.context.$dobj,
                context.context.$iobj,
                verb.name, context.context.$argstr,
                context.context.$dobjstr,
                context.context.$prepstr,
                context.context.$iobjstr,
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

      when 'programmer'
        if obj.player
          programmer = !!val
          obj.setProgrammer programmer
        else
          throw new Error "no setter for '#{name}'"

      else
        if obj.hasProp name
          obj.setProp name, context.serialize val
        else
          throw new Error "no setter for '#{name}'"

  enumerate: ->
    keys()

  keys: ->
    keys()