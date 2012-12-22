##############
# Web server #
##############

express = require 'express'
http = require 'http'
io = require 'socket.io'
less = require 'less-middleware'
coffeescript = require 'coffee-script'
coffeescript_middleware = require 'connect-coffee-script'
require './color'

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

ws_server = io.listen(http_server)

ws_server.sockets.on 'connection', (socket) ->
  socket.emit 'output', {msg: "Welcome to #{"jsmoo".blue.bold}!"}
  socket.emit 'output', {msg: "Type 'help' for a list of available commands."}

  socket.on 'disconnect', ->
    # TODO (or not?  we don't care if an anonymous socket leaves...)

  socket.on 'input', (data) ->
    str = data.msg
    console.log "received: #{str}"
    switch str
      when "help"
        socket.emit 'output', {msg: "Available commands:"}
        socket.emit 'output', {msg: "* login  - login to an existing account"}
        socket.emit 'output', {msg: "* create - create a new account"}
        socket.emit 'output', {msg: "* delete - delete an existing account"}
        socket.emit 'output', {msg: "* help   - show this message"}
      when "login"
        socket.emit 'output', {msg: "not yet implemented"}
      when "create"
        socket.emit 'output', {msg: "not yet implemented"}
      when "delete"
        socket.emit 'output', {msg: "not yet implemented"}
      else
        socket.emit 'output', {msg: "unknown command"}
