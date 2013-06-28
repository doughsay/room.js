util = require 'util'
fs = require 'fs'

require './app/lib/process'
require './app/lib/pid'
config = require './app/config/app'

if config.socket? then require './app/lib/socket'

start = new Date

express = require 'express'

# create and configure the express app
module.exports = app = express()
require('./app/config/express')(app)
env = app.settings.env

# create the http and socket.io server
server = require('http').createServer app
io = require('socket.io').listen server, {'log level': 2}

# set up web controller
require('./app/controllers/index')(app)

# load the room.js database
Db = require './app/lib/db'
db = new Db config.dbFile

# set up socket controllers
Client = require './app/controllers/client'
io.of('/client').on 'connection', (socket) ->
  util.log "new client connection"
  new Client db, socket

Editor = require './app/controllers/editor'
io.of('/editor').on 'connection', (socket) ->
  util.log "new editor connection"
  new Editor db, socket

# delete the socket file if it exists (from a previous crash)
if config.socket? and fs.existsSync config.socket
  fs.unlinkSync config.socket

# start listening
server.listen app.settings.port, ->
  if config.socket? and fs.existsSync config.socket
    fs.chmodSync config.socket, '777'
  time = new Date - start
  util.log "Room.js server started on port/socket #{app.settings.port} (#{env} mode) in #{time}ms running on Node.js #{process.versions.node}"