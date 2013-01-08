util = require 'util'
vm = require 'vm'
express = require 'express'
http = require 'http'
io = require 'socket.io'
Mincer  = require 'mincer'
_ = require 'underscore'
repl = require 'repl'

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
# repl.start().context.db = db

ws_server.sockets.on 'connection', (socket) ->
  socket.emit 'output', {msg: "Welcome to #{c 'jsmoo', 'blue bold'}!"}
  socket.emit 'output', {msg: "Type #{c 'help', 'magenta bold'} for a list of available commands."}

  socket.on 'disconnect', ->
    # TODO (when a socket disconnects, put the player in limbo)

  socket.on 'input', (data) ->
    str = data.msg
    if socket.player?
      player = socket.player

      command = parse str
      switch command.verb
        when 'eval'
          context = contextBuilder.buildBaseContext()
          context.db = db
          context.$ = (id) -> db.findById(id)
          player.send vm.runInNewContext command.argstr, context
        else
          [verb, context] = db.buildContextForCommand player, command
          baseContext = contextBuilder.buildBaseContext()
          context = _(baseContext).extend context
          if verb?
            vm.runInNewContext verb.code, context
          else
            player.send c("\nI didn't understand that.", 'grey')# + mooUtil.print command
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
          socket.emit 'requestFormInput', formDescriptors.login()
        when "create"
          socket.emit 'requestFormInput', formDescriptors.createAccount()
        else
          socket.emit 'output', {msg: "\nUnrecognized command. Type #{c 'help', 'magenta bold'} for a list of available commands."}

  socket.on 'form_input_login', (data) ->
    formData = data.formData
    if formData.username == 'root' and formData.password == 'p@ssw0rd'
      rootUser = db.findById(2)

      if rootUser.socket
        rootUser.socket.emit 'deactivate_editor'
        rootUser.send c "\nDisconnected by another login.", 'red bold'
        rootUser.disconnect()

      socket.player = rootUser
      rootUser.socket = socket

      rootUser.send c "\nConnected as ROOT.", 'red bold'
      socket.emit 'activate_editor'
    else
      formDescriptor = formDescriptors.login()
      formDescriptor.inputs[0].value = formData.username
      formDescriptor.error = 'Invalid username or password.'
      socket.emit 'requestFormInput', formDescriptor

  socket.on 'form_input_create', (data) ->
    formData = data.formData
    formDescriptor = formDescriptors.createAccount()
    formDescriptor.error = 'Not yet implemented.'
    socket.emit 'requestFormInput', formDescriptor

  socket.on 'list_objects', (opts = {}, fn) ->
    if not opts.format?
      opts.format = 'list'
    switch opts.format
      when 'list'
        fn db.list()
      when 'tree'
        fn db.tree()

  socket.on 'object_details', (id, fn) ->
    fn db.details(id)

process.on 'SIGINT', ->
  util.puts ""
  db.saveSync('db.json')
  process.exit()