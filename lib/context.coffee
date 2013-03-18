vm = require 'vm'
coffee = require 'coffee-script'
_ = require 'underscore'
util = require 'util'

connections = require './connection_manager'
mooUtil = require './util'
mooBrowser = require './moo_browser'
parse = require('./parser').parse

contextProxyFor = require './context_proxy'
proxies = require './helper_proxies'

class Context

  constructor: (@db, @player, @memo = {}) ->
    base =
      eval:       undefined
      $:          (id) => @contextify @db.findById(id)
      player:     if @player? then @contextify @player else @contextify @db.nothing
      players:    => @db.players.map (player) => @contextify player
      browser:    mooBrowser
      parse:      parse
      match:      (search = '') => (@db.mooMatch search, @player).map (o) => @contextify o
      do_verb:    (object, verb, time, args = []) => @do_verb object, verb, time, args
      idle:       (player) => connections.idleTimeFor player
      rm:         (idOrObject) =>
                    if idOrObject?.proxy?
                      @db.rm idOrObject.id
                    else
                      @db.rm idOrObject

    @context = _.extend @globals(), base

  deserialize: (x, cb = (->), top = true) =>
    switch typeof x
      when 'object'
        if x == null
          null
        else if x._mooObject?
          @contextify @db.findById x._mooObject
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

  run: (verb, extraArgs, sendOutput = false, stack = false) ->
    try
      code = coffee.compile verb.code, bare: true
      ctext = _.clone @context
      if extraArgs?
        ctext.args = extraArgs
      output = vm.runInNewContext code, ctext
      if sendOutput and @player isnt @db.nothing
        @player.send mooUtil.print output
      output
    catch error
      source = if @self? and @self isnt @db.nothing then [@self.toString()] else []
      source.push verb.name
      source = source.join '.'

      runner = 'server'

      errorStr = error.toString()

      if @player? and @player isnt @db.nothing
        runner = @player.toString()
        if stack
          @player.send error.stack.split('\n').map((line) -> "{inverse bold red|#{line}}").join('\n')
        else
          @player.send "{inverse bold red|#{errorStr} in '#{source}'}"

      util.log "#{runner} caused exception: #{errorStr} in '#{source}'"

  do_verb: (mooObject, verbName, time, args) ->
    object = @decontextify mooObject
    verb = object.findVerbByName verbName

    setTimeout((=>
      newContext = new VerbContext(
        @db, null, object, null, null,
        verbName, undefined, undefined, undefined, undefined, @memo)
      newContext.run verb, args
    ), time)

    true

class EvalContext extends Context

  constructor: (@db, player) ->
    super @db, player

    @context.list       = => @db.list().map (o) => @contextify o
    @context.search     = (search) => @db.search(search).map (o) => @contextify o
    @context.ls         = (x, depth = 2) ->
                            player.send(mooUtil.print x, depth)
                            true

  run: (coffeeCode, extraArgs) ->
    verbSpec =
      code: coffeeCode
      name: 'eval'
    super verbSpec, extraArgs, true

class VerbContext extends Context

  constructor: (@db, player, self, dobj, iobj, verb, argstr, dobjstr, prepstr, iobjstr, memo = {}) ->
    super @db, player, memo

    @self = if self? then self else @db.nothing

    @context.dobj    = if dobj? then @contextify dobj else @contextify @db.nothing
    @context.iobj    = if iobj? then @contextify iobj else @contextify @db.nothing
    @context.verb    = verb
    @context.argstr  = argstr
    @context.args    = if argstr? then argstr.split ' ' else ''
    @context.dobjstr = dobjstr
    @context.prepstr = prepstr
    @context.iobjstr = iobjstr

    if self?
      @context.pass  = =>
        thisVerb = self.findVerbByName verb
        thisObject = thisVerb.object
        superObject = thisObject.parent()
        superVerb = superObject?.findVerbByName verb
        if superVerb?
          runVerb @db,
            @player,
            superVerb, self,
            @context.dobj,
            @context.iobj,
            superVerb.propName(), @context.argstr,
            @context.dobjstr,
            @context.prepstr,
            @context.iobjstr,
            Array.prototype.slice.call(arguments),
            @memo
        else
          throw new Error 'verb has no \'super\''

  run: (verb, extraArgs) ->

    verbSpec =
      code: """
            (->
            #{verb.code.split('\n').map((line) -> '  ' + line).join('\n')}
            ).call($(#{@self.id}))
            """
      name: verb.name
    super verbSpec, extraArgs


runEval = (db, player, code) ->
  (new EvalContext db, player).run code

runVerb = (db, player, verb, self, dobj = db.nothing, iobj = db.nothing, verbstr, argstr, dobjstr, prepstr, iobjstr, extraArgs, memo = {}) ->
  context = new VerbContext(
    db, player, self, dobj, iobj, verbstr, argstr, dobjstr, prepstr, iobjstr, memo)
  context.run verb, extraArgs

exports.runVerb = runVerb
exports.runEval = runEval
exports.VerbContext = VerbContext