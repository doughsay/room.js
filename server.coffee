util = require 'util'
vm = require 'vm'
express = require 'express'
http = require 'http'
io = require 'socket.io'
Mincer  = require 'mincer'
_ = require 'underscore'

c = require('./lib/color').color
parse = require('./lib/parser').parse
db = require('./lib/moo').db
mooUtil = require './lib/util'
contextBuilder = require './lib/context'

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
          form =
            title: "Login"
            inputs: [
              {type: 'text', name: 'username', label: 'Username'},
              {type: 'password', name: 'password', label: 'Password'}
            ]
            submit: 'Login'
          socket.emit 'requestFormInput', form
        when "create"
          form =
            title: "Create an Account"
            inputs: [
              {type: 'text', name: 'username', label: 'Username'},
              {type: 'password', name: 'password', label: 'Password'},
              {type: 'password', name: 'password2', label: 'Confirm Password'},
            ]
            submit: 'Create'
          socket.emit 'requestFormInput', form
        when "root"
          rootUser = db.findById(2)

          if rootUser.socket
            rootUser.send c "\nDisconnected by another login.", 'red bold'
            rootUser.disconnect()

          socket.player = rootUser
          rootUser.socket = socket

          rootUser.send c "\nConnected as ROOT.", 'red bold'
        else
          socket.emit 'output', {msg: "\nUnrecognized command. Type #{c 'help', 'magenta bold'} for a list of available commands."}

process.on 'SIGINT', ->
  util.puts ""
  db.saveSync('db.json')
  process.exit()