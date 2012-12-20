##############
# Web server #
##############

express = require 'express'
http = require 'http'
io = require 'socket.io'
less = require 'less-middleware'
coffeescript = require 'coffee-script'
coffeescript_middleware = require 'connect-coffee-script'
connections = require './connection_manager'
name = require './name'
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
  socket.name = name.generate()
  connections.add_web socket

  socket.on 'disconnect', ->
    connections.remove_web socket

  socket.on 'chat', (data) ->
    connections.broadcast_web socket, data

  socket.emit 'chat', {name: 'system'.cyan.toString(), msg: "Welcome to #{"jsmoo".blue.bold}!"}