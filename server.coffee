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
require './color'
parse = require('./parser').parse
db = require('./moo').db

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
  socket.emit 'output', {msg: "Welcome to #{"jsmoo".blue.bold}!"}
  socket.emit 'output', {msg: "Type #{"help".magenta.bold} for a list of available commands."}

  socket.on 'disconnect', ->
    # TODO (or not?  we don't care if an anonymous socket leaves...)

  socket.on 'input', (data) ->
    str = data.msg
    switch str
      when "help"
        msg = """
        \nAvailable commands:
        * #{"login".magenta.bold}  - login to an existing account
        * #{"create".magenta.bold} - create a new account
        * #{"help".magenta.bold}   - show this message
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
        rootUser = db.getById(2)

        if rootUser.socket
          rootUser.send "\nDisconnected by another login.".red.bold.toString()
          rootUser.disconnect()

        socket.player = rootUser
        rootUser.socket = socket

        rootUser.send "\nConnected as ROOT.".red.bold.toString()
      else
        if socket.player?
          player = socket.player
          command = parse str
          matches = db.findMatchedObjects player, command
          verb = db.findVerb command, matches
          if verb?
            vm.runInNewContext verb.code, {player: player}
          else
            msg = "\n"+"unknown command: ".grey
            msg += "{".bold.white
            msg += "verb: ".yellow
            msg += command.verb.blue.bold
            msg += ", ".bold.white
            msg += "directObject: ".yellow
            if command.do != undefined
              msg += command.do.blue.bold
            else
              msg += "undefined".grey
            msg += ", ".bold.white
            msg += "preposition: ".yellow
            if command.prep != undefined
              msg += command.prep.blue.bold
            else
              msg += "undefined".grey
            msg += ", ".bold.white
            msg += "indirectObject: ".yellow
            if command.io != undefined
              msg += command.io.blue.bold
            else
              msg += "undefined".grey
            msg += "}".bold.white
            socket.emit 'output', {msg: msg}
        else
          socket.emit 'output', {msg: "\nUnrecognized command. Type #{"help".magenta.bold} for a list of available commands."}