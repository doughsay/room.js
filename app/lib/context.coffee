vm = require 'vm'
_ = require 'underscore'
coffee = require 'coffee-script'

log4js = require './logger'
logger = log4js.getLogger 'context'

config = require '../config/app'
mooUtil = require './util'
mooBrowser = require './moo_browser'
parse = require('./parser').parse

contextProxyFor = require './context_proxy'
proxies = require './helper_proxies'

module.exports = class Context

  constructor: (@db) ->

    @memo = {}

    base =
      eval:       undefined
      Proxy:      undefined
      stack:      []
      $:          (id) => @contextify @db.findById(id)
      players:    => @db.players.map (player) => @contextify player
      browser:    mooBrowser
      parse:      parse
      match:      (search = '') => (@db.mooMatch search, @player).map (o) => @contextify o
      schedule:   (object, verb, seconds, args = []) => @schedule object, verb, seconds, args
      cancel:     (id) => @cancel id
      list:       => @db.list().map (o) => @contextify o
      search:     (search) => @db.search(search).map (o) => @contextify o
      rm:         (idOrObject) =>
                    if idOrObject?.proxy?
                      @db.rm idOrObject.id
                    else
                      @db.rm idOrObject

    @vmContext = vm.createContext _.extend @globals(), base

  deserialize: (x, cb = (->), top = true) =>
    switch typeof x
      when 'object'
        if x == null
          null
        else if x._mooObject?
          @contextify @db.findById x._mooObject
        else if x._date?
          new Date x._date
        else if x._regexp?
          new RegExp x._regexp.pattern, x._regexp.flags
        else if Array.isArray x
          savecb = if top then => cb @serialize a else cb
          a = x.map (y) => @deserialize y, savecb, false
          Proxy.create proxies.objectProxyFor a, savecb
        else
          savecb = if top then => cb @serialize o else cb
          o = mooUtil.hmap x, (y) => @deserialize y, savecb, false
          Proxy.create proxies.objectProxyFor o, savecb
      else
        x

  serialize: (x) =>
    switch typeof x
      when 'object'
        if x == null
          null
        else if x.proxy
          {_mooObject: x.id}
        else if Object.prototype.toString.call(x) is '[object Date]'
          {_date: x.toString()}
        else if Object.prototype.toString.call(x) is '[object RegExp]'
          match = x.toString().match /^\/(.*)\/(.*)/
          [regexp, pattern, flags] = match
          {_regexp: {pattern: pattern, flags: flags}}
        else if Array.isArray x
          if x.helper_proxy
            x = x.unProxy()
          x.map @serialize
        else
          if x.helper_proxy
            x = x.unProxy()
          mooUtil.hmap x, @serialize
      else
        x

  globals: ->
    mooUtil.hkmap @db.sys.getAllProperties(), (key, value) =>
      ["$#{key}", @deserialize value]

  # return a context object for the given object
  # also, memoize all the context objects within this context
  contextify: (obj) ->
    if obj? and obj.id?
      if not @memo[obj.id]?
        @memo[obj.id] = Proxy.create contextProxyFor obj, @ #new ContextRoomJsObject(obj, @)
      @memo[obj.id]
    else
      null

  decontextify: (contextObj) ->
    @db.findById contextObj?.id

  popStack: -> @vmContext.stack.shift()

  pushEvalStackVars: (player) ->
    newStack =
      player : if player? then @contextify player else @contextify @db.nothing
      ls     : (x, depth = 2) -> player.send(mooUtil.print x, depth); return true

    @vmContext.stack.unshift newStack

  runEval: (player, coffeeCode, stack = false) ->

    start = new Date()
    wrappedCode = """
    ((player, ls) ->
      #{coffeeCode}
    ).call(stack[0].player, stack[0].player, stack[0].ls)
    """

    @pushEvalStackVars player

    @memo.level = 0 if not @memo.level?
    @memo.level += 1

    output = undefined
    source = '[eval]'
    runner = '[server]'
    if player? and player isnt @db.nothing
      runner = player.toString()

    try
      code = coffee.compile wrappedCode, bare: true
      output = vm.runInContext code, @vmContext, 'eval.vm', config.verbTimeout
      player.send mooUtil.print output
    catch error
      errorStr = error.toString()

      if player? and player isnt @db.nothing
        if stack and error.stack?
          player.send error.stack.split('\n').map((line) -> "{inverse bold red|#{line}}").join('\n')
        else
          player.send "{inverse bold red|#{errorStr} in #{source}}"

      logger.warn "#{runner} caused exception: #{errorStr} in #{source}"

    @memo.level -= 1
    if @memo.level is 0
      delete @memo.level

    @popStack()

    logger.debug "#{runner} ran #{source} in #{new Date() - start}ms"
    return output

  pushVerbStackVars: (player, self, dobj, iobj, verbstr, argstr, dobjstr, prepstr, iobjstr) ->

    newStack =
      player  : if player? then @contextify player else @contextify @db.nothing
      self    : if self? then @contextify self else @contextify @db.nothing
      dobj    : if dobj? then @contextify dobj else @contextify @db.nothing
      iobj    : if iobj? then @contextify iobj else @contextify @db.nothing
      verb    : verbstr
      argstr  : argstr
      args    : if argstr? then argstr.split ' ' else []
      dobjstr : dobjstr
      prepstr : prepstr
      iobjstr : iobjstr
      pass    : =>
        thisVerb = self.findVerbByName verbstr
        thisObject = thisVerb.object
        superObject = thisObject.parent()
        superVerb = superObject?.findVerbByName verbstr
        if superVerb?
          @runVerb player, superVerb, self, dobj, iobj, superVerb.propName(), argstr, dobjstr, prepstr, iobjstr, Array.prototype.slice.call(arguments)
        else
          throw new Error 'verb has no \'super\''

    @vmContext.stack.unshift newStack

  runVerb: (player, verb, self, dobj, iobj, verbstr, argstr = '', dobjstr, prepstr, iobjstr, extraArgs, stack = false) ->

    start = new Date()
    @pushVerbStackVars player, self, dobj, iobj, verbstr, argstr, dobjstr, prepstr, iobjstr

    @memo.level = 0 if not @memo.level?
    @memo.level += 1

    output = undefined
    source = if self? and self isnt @db.nothing then [self.toString()] else []
      source.push verb.name
      source = source.join '.'
    runner = '[server]'
    if player? and player isnt @db.nothing
      runner = player.toString()

    try
      if @memo.level > config.maxStack
        throw 'maximum stack depth reached'

      if extraArgs?
        @vmContext.stack[0].args = extraArgs

      output = if @memo.level is 1
        verb.script.runInContext @vmContext, verb.name+'.vm', config.verbTimeout
      else
        verb.script.runInContext @vmContext, verb.name+'.vm'

    catch error
      errorStr = error.toString()

      if player? and player isnt @db.nothing
        if stack and error.stack?
          player.send error.stack.split('\n').map((line) -> "{inverse bold red|#{line}}").join('\n')
        else
          player.send "{inverse bold red|#{errorStr} in '#{source}'}"

      logger.warn "#{runner} caused exception: #{errorStr} in '#{source}'"

    @memo.level -= 1
    if @memo.level is 0
      delete @memo.level

    @popStack()

    logger.debug "#{runner} ran #{source} in #{new Date() - start}ms"
    return output

  schedule: (mooObject, verbName, seconds, args) ->
    object = @decontextify mooObject
    verb = object.findVerbByName verbName

    setTimeout((=>
      @runVerb null, verb, object, undefined, undefined, verbName, undefined, undefined, undefined, undefined, args
    ), seconds*1000)

  cancel: (id) ->
    clearTimeout id