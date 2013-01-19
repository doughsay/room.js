#!/usr/bin/env coffee
util = require 'util'
vm = require 'vm'
express = require 'express'
http = require 'http'
io = require 'socket.io'
Mincer  = require 'mincer'
_ = require 'underscore'
repl = require 'repl'
coffee = require 'coffee-script'

connections = require './lib/connection_manager'
phash = require('./lib/hash').phash
c = require('./lib/color').color
parse = require('./lib/parser').parse
db = require('./lib/moo').db
mooUtil = require './lib/util'
contextFor = require('./lib/context').for
formDescriptors = require './lib/forms'

environment = new Mincer.Environment()
environment.appendPath 'assets/js'
environment.appendPath 'assets/css'
environment.appendPath 'assets/img'
environment.appendPath 'vendor/assets/js'
environment.appendPath 'vendor/assets/css'
environment.appendPath 'vendor/assets/css/bootstrap'
environment.appendPath 'vendor/assets/img'

xp = express()

xp.configure ->
  xp.set 'port', 8888
  xp.set 'views', __dirname + '/views'
  xp.set 'view engine', 'jade'
  xp.use express.favicon()
  xp.use '/assets', Mincer.createServer environment

xp.get '/', (req, res) ->
  res.render 'index'

http_server = http.createServer(xp).listen xp.get('port'), ->
  console.log "jsmoo http server listening on port " + xp.get 'port'

ws_server = io.listen(http_server, {log: false})

# for debugging.  Note: Ctrl-D first to close the REPL then Ctrl-C to stop the moo.
# repl.start('>').context.db = db

ws_server.sockets.on 'connection', (socket) ->
  socket.emit 'output', "Welcome to #{c 'jsmoo', 'blue bold'}!"
  socket.emit 'output', "Type #{c 'help', 'magenta bold'} for a list of available commands."

  socket.on 'disconnect', ->
    # TODO (when a player socket disconnects, put the player in limbo)
    connections.remove socket

  socket.on 'input', (userStr) ->
    str = userStr || ""
    player = connections.playerFor socket
    if player?

      command = parse str

      if command.verb == 'eval' and player.programmer
        context = contextFor('eval', {$player: player, $here: player.location()})
        try
          code = coffee.compile command.argstr, bare: true
          output = vm.runInNewContext code, context
          player.send mooUtil.print output
        catch error
          #player.send c error.toString(), 'inverse bold red'
          player.send error.stack.split('\n').map((line) -> c line, 'inverse bold red').join('\n')
      else if command.verb == 'edit' and player.programmer
        [oNum, verbName] = command.argstr.split('.')
        o = db.findByNum oNum
        if o?
          verb = (o.verbs.filter (v) -> v.name == verbName)[0]
          if verb?
            clonedVerb = _.clone verb
            clonedVerb.oid = o.id
            socket.emit 'edit_verb', clonedVerb
          else
            newVerb = {oid: o.id, name: verbName, dobjarg: 'none', preparg: 'none', iobjarg: 'none', code: ''}
            player.send c "Creating new verb '#{verbName}' on '#{o.name}'.", 'cyan'
            socket.emit 'edit_verb', newVerb
        else
          player.send c "No such object.", 'red'
      else
        [verb, context] = db.buildContextForCommand player, command
        context = contextFor('verb', context)
        if verb?
          try
            code = coffee.compile verb.code, bare: true
            vm.runInNewContext code, context
          catch error
            #player.send c error.toString(), 'inverse bold red'
            player.send error.stack.split('\n').map((line) -> c line, 'inverse bold red').join('\n')
        else
          player.send c("I didn't understand that.", 'gray')# + mooUtil.print command
    else
      switch str
        when "help"
          msg = """
          \nAvailable commands:
          * #{c 'login', 'magenta bold'}  - login to an existing account
          * #{c 'create', 'magenta bold'} - create a new account
          * #{c 'help', 'magenta bold'}   - show this message
          """
          socket.emit 'output', msg
        when "login"
          socket.emit 'request_form_input', formDescriptors.login()
        when "create"
          socket.emit 'request_form_input', formDescriptors.createAccount()
        else
          socket.emit 'output', "\nUnrecognized command. Type #{c 'help', 'magenta bold'} for a list of available commands."

  socket.on 'form_input_login', (userData, fn) ->
    sanitize = (userData) ->
      username: (userData.username || "").trim()
      password: userData.password || ""

    formData = sanitize userData

    matches = db.players.filter (player) ->
      player.authenticates(formData.username, phash formData.password)

    if matches.length == 1
      player = matches[0]

      other_socket = connections.socketFor player
      if other_socket?
        player.send c "Disconnected by another login.", 'red bold'
        other_socket.disconnect()

      connections.add player, socket

      player.send c "Welcome #{player.username}!", 'blue bold'
      fn null
    else
      formDescriptor = formDescriptors.login()
      formDescriptor.inputs[0].value = formData.username
      formDescriptor.error = 'Invalid username or password.'
      fn formDescriptor

  socket.on 'form_input_create', (userData, fn) ->
    sanitize = (userData) ->
      name: (userData.name || "").trim()
      username: (userData.username || "").trim()
      password: userData.password || ""
      password2: userData.password2 || ""

    validate = (formData) ->
      formDescriptor = formDescriptors.createAccount()
      formDescriptor.inputs[0].value = formData.name
      formDescriptor.inputs[1].value = formData.username

      valid = true

      if formData.name.length < 2
        valid = false
        formDescriptor.inputs[0].error = "Not long enough"

      if db.playerNameTaken formData.name
        valid = false
        formDescriptor.inputs[0].error = "Already taken"

      if formData.username.length < 2
        valid = false
        formDescriptor.inputs[1].error = "Not long enough"

      if not formData.username.match /^[_a-zA-Z0-9]+$/
        valid = false
        formDescriptor.inputs[1].error = "Alphanumeric only"

      if db.usernameTaken formData.username
        valid = false
        formDescriptor.inputs[1].error = "Already taken"

      if formData.password.length < 8
        valid = false
        formDescriptor.inputs[2].error = "Not long enough"

      if formData.password != formData.password2
        valid = false
        formDescriptor.inputs[3].error = "Doesn't match"

      [valid, formDescriptor]

    formData = sanitize userData
    [valid, formDescriptor] = validate formData

    if not valid
      fn formDescriptor
    else
      db.createNewPlayer formData.name, formData.username, phash formData.password
      socket.emit 'output', "\n#{c 'Account created!', 'bold green'}  You may now #{c 'login', 'bold magenta'}."
      fn null

  socket.on 'save_verb', (userVerb, fn) ->
    sanitize = (userVerb) ->
      oid: if userVerb.oid? then userVerb.oid else null,
      original_name: userVerb.original_name || ""
      name: (userVerb.name || "").trim().split(' ').filter((s) -> s != '').map((s) -> s.trim().toLowerCase()).join ' '
      dobjarg: userVerb.dobjarg || null
      preparg: userVerb.preparg || null
      iobjarg: userVerb.iobjarg || null
      code: (userVerb.code || "").trim()

    validate = (verb) ->
      errors = []

      if not verb.oid?
        errors.push "missing oid"
      else
        o = db.findById(verb.oid)
        if !o?
          errors.push "the object doesn't exist"

      if verb.original_name == ""
        errors.push "missing original name"

      if verb.name == ""
        errors.push "name can't be empty"
      else
        o = db.findById(verb.oid)
        if verb.name != verb.original_name and verb.name in (o.verbs.map (v) -> v.name)
          errors.push "that verb name already exists on that object"
        else
          verbNames = verb.name.split ' '
          for name in verbNames
            if name == '*' and verbNames.length != 1
              errors.push "* can only be by itself"
            else if name == '*'
              break
            else if name.indexOf('*') == 0 and name.length > 1
              errors.push "* can't appear at the beginning of a verb's name"
            else if not name.match /^[a-z]+\*?[a-z]*$/
              errors.push "verb names can be alphanumeric and contain * only once"

      if not verb.dobjarg?
        errors.push "missing direct object argument specifier"
      else if verb.dobjarg not in ['none', 'this', 'any']
        errors.push 'invalid direct object argument specifier'

      if not verb.preparg?
        errors.push "missing preposition argument specifier"
      else if verb.preparg not in ['none', 'any', 'with/using', 'at/to', 'in front of', 'in/inside/into', 'on top of/on/onto/upon', 'out of/from inside/from', 'over', 'through', 'under/underneath/beneath', 'behind', 'beside', 'for/about', 'is', 'as', 'off/off of']
        errors.push 'invalid preposition argument specifier'

      if not verb.iobjarg?
        errors.push "missing indirect object argument specifier"
      else if verb.iobjarg not in ['none', 'this', 'any']
        errors.push 'invalid indirect object argument specifier'

      if verb.code == ''
        errors.push "missing code"

      errors

    player = connections.playerFor socket
    if player?
      if player.programmer
        verb = sanitize userVerb
        errors = validate verb

        if errors.length > 0
          errors.unshift 'There were errors in your verb code submission:'
          player.send c (errors.join '\n'), 'red'
          fn {error: true, verb: verb}
        else
          id = verb.oid
          object = db.findById(id)
          object.saveVerb verb
          player.send c "Verb saved!", 'green'
          fn {error: false, verb: verb}
      else
        player.send c "You are not allowed to do that.", 'red'
        fn {error: true}
    else
      socket.emit 'output', c "You are not logged in.", 'red'
      fn {error: true}

process.on 'SIGINT', -> process.exit()
process.on 'SIGTERM', -> process.exit()
process.on 'exit', ->
  util.puts ""
  db.saveSync('db.json')