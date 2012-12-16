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

http_server = http.createServer(xp).listen xp.get('port'), ->
  console.log "jsmoo http server listening on port " + xp.get 'port'

ws_server = io.listen(http_server)

ws_server.sockets.on 'connection', (socket) ->
  connections.add_web socket

  socket.on 'disconnect', ->
    connections.remove_web socket

  socket.on 'chat', (data) ->
    connections.broadcast_web socket, data


#################
# Telnet server #
#################

telnet = require 'telnet'
ts = telnet.createServer (socket) ->
  connections.add_telnet socket

  socket.do.transmit_binary()
  socket.do.window_size()

  socket.on 'close', ->
    connections.remove_telnet socket

  socket.on 'window size', (e) ->
    if e.command == 'sb'
      console.log "telnet window resized to #{e.width} x #{e.height}"

  socket.on 'data', (b) ->
    connections.broadcast_telnet socket, b.toString()

  socket.write '\nConnected to Telnet server!\n'

ts.listen 9999
console.log "jsmoo telnet server listening on port 9999"
