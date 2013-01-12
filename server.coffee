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
contextBuilder = require './lib/context'
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
  socket.emit 'output', {msg: "Welcome to #{c 'jsmoo', 'blue bold'}!"}
  socket.emit 'output', {msg: "Type #{c 'help', 'magenta bold'} for a list of available commands."}

  socket.on 'disconnect', ->
    # TODO (when a socket disconnects, put the player in limbo)
    connections.remove socket

  socket.on 'input', (data) ->
    str = data.msg
    player = connections.playerFor socket
    if player?

      command = parse str

      if command.verb == 'eval' and player.programmer
        context = contextBuilder.buildBaseContext()
        context.db = db
        context.$ = (id) -> db.findById(id)
        try
          code = coffee.compile command.argstr, bare: true
          output = vm.runInNewContext code, context
          player.send mooUtil.print output
        catch error
          player.send c error.toString(), 'inverse bold red'
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
          player.send c "No such object or verb.", 'red'
      else
        [verb, context] = db.buildContextForCommand player, command
        baseContext = contextBuilder.buildBaseContext()
        context = _(baseContext).extend context
        if verb?
          try
            code = coffee.compile verb.code, bare: true
            vm.runInNewContext code, context
          catch error
            player.send c error.toString(), 'inverse bold red'
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
          socket.emit 'output', {msg: msg}
        when "login"
          socket.emit 'request_form_input', formDescriptors.login()
        when "create"
          socket.emit 'request_form_input', formDescriptors.createAccount()
        else
          socket.emit 'output', {msg: "\nUnrecognized command. Type #{c 'help', 'magenta bold'} for a list of available commands."}

  socket.on 'form_input_login', (data, fn) ->
    formData = data.formData

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

  # TODO (better) validation and sanitization
  socket.on 'form_input_create', (data, fn) ->
    formData = data.formData
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

    if db.usernameTaken formData.username
      valid = false
      formDescriptor.inputs[1].error = "Already taken"

    if formData.password.length < 8
      valid = false
      formDescriptor.inputs[2].error = "Not long enough"

    if formData.password != formData.password2
      valid = false
      formDescriptor.inputs[3].error = "Doesn't match"

    if not valid
      fn formDescriptor
    else
      db.createNewPlayer formData.name, formData.username, phash formData.password
      socket.emit 'output', {msg: "\n#{c 'Account created!', 'bold green'}  You may now #{c 'login', 'bold magenta'}."}
      fn null

  socket.on 'save_verb', (verb) ->
    player = connections.playerFor socket
    if player?
      if player.programmer
        id = verb.oid
        object = db.findById(id) # TODO could be null
        object.saveVerb verb # TODO could fail?
        player.send c "Verb saved!", 'green'
      else
        player.send c "You are not allowed to do that.", 'red'

process.on 'SIGINT', ->
  util.puts ""
  db.saveSync('db.json')
  process.exit()