##############
# Web server #
##############

vm = require 'vm'
express = require 'express'
http = require 'http'
io = require 'socket.io'
less = require 'less-middleware'
coffeescript = require 'coffee-script'
coffeescript_middleware = require 'connect-coffee-script'
c = require('./lib/color').color
parse = require('./lib/parser').parse
db = require('./lib/moo').db
util = require './lib/util'

xp = express()

xp.configure ->
  xp.set 'port', 8888
  xp.set 'views', __dirname + '/views'
  xp.set 'view engine', 'jade'
  xp.use express.favicon()
  xp.use less
    src: __dirname + '/public_src'
    dest: __dirname + '/public'
  xp.use coffeescript_middleware
    src: __dirname + '/public_src'
    dest: __dirname + '/public'
    bare: true
  xp.use express.static __dirname + '/public'

xp.get '/', (req, res) ->
  res.render 'index'

xp.get '/colors', (req, res) ->
  res.render 'color_test'

http_server = http.createServer(xp).listen xp.get('port'), ->
  console.log "jsmoo http server listening on port " + xp.get 'port'

ws_server = io.listen(http_server, {log: false})

ws_server.sockets.on 'connection', (socket) ->
  socket.emit 'output', {msg: "Welcome to #{c 'jsmoo', 'blue bold'}!"}
  socket.emit 'output', {msg: "Type #{c 'help', 'magenta bold'} for a list of available commands."}

  socket.on 'disconnect', ->
    # TODO (or not?  we don't care if an anonymous socket leaves...)

  socket.on 'input', (data) ->
    str = data.msg
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
        socket.emit 'requestFormInput', [
          {type: 'string', name: 'username', label: 'Username'},
          {type: 'password', name: 'password', label: 'Password'},
          {type: 'button', label: 'Login'}
        ]
      when "create"
        socket.emit 'requestFormInput', [
          {type: 'string', name: 'username', label: 'Username'},
          {type: 'password', name: 'password', label: 'Password'},
          {type: 'password', name: 'password2', label: 'Confirm Password'},
          {type: 'button', label: 'Create'}
        ]
      when "root"
        rootUser = db.findById(2)

        if rootUser.socket
          rootUser.send c "\nDisconnected by another login.", 'red bold'
          rootUser.disconnect()

        socket.player = rootUser
        rootUser.socket = socket

        rootUser.send c "\nConnected as ROOT.", 'red bold'
      else
        if socket.player?
          player = socket.player
          command = parse str
          matches = db.findCommandObjects player, command
          socket.emit 'output', {msg: c("\nmatched objects:", 'green') + util.print matches}
          verb = db.findVerb command, matches
          if verb?
            vm.runInNewContext verb.code, {player: player}
          else
            msg = c("\nunknown command:", 'grey') + util.print command
            socket.emit 'output', {msg: msg}
        else
          socket.emit 'output', {msg: "\nUnrecognized command. Type #{c 'help', 'magenta bold'} for a list of available commands."}