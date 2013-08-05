start = new Date

fs = require 'fs'
require './lib/process'
require './lib/pid'
config = require './config/app'
if config.socket? then require './lib/socket'

log4js = require './lib/logger'
serverLogger = log4js.getLogger 'server'
socketLogger = log4js.getLogger 'socket'

express = require 'express'

# create and configure the express app
module.exports = app = express()
require('./config/express')(app)
env = app.settings.env

# create the http and socket.io server
server = require('http').createServer app
io = require('socket.io').listen server, logger: socketLogger, 'log level': log4js.levels[config.logLevel.socket]

# set up web controller
require('./controllers/index')(app)

# db needs a reference to context, but context needs db to initialize
context = null
getContext = -> context

# load the room.js database
Db = require './lib/db'
db = new Db config.dbFile, getContext

# create the context to run eval code and verbs in
Context = require './lib/context'
context = new Context db

# set up socket controllers
Client = require './controllers/client'
io.of('/client').on 'connection', (socket) ->
  new Client db, context, socket

Editor = require './controllers/editor'
io.of('/editor').on 'connection', (socket) ->
  new Editor db, socket

# delete the socket file if it exists (from a previous crash)
if config.socket? and fs.existsSync config.socket
  fs.unlinkSync config.socket

# start listening
server.listen app.settings.port, ->
  if config.socket? and fs.existsSync config.socket
    fs.chmodSync config.socket, '777'

  verb = db.sys.findVerbByName 'server_started'
  if verb?
    context.runVerb null, verb, db.sys

  port = if config.socket? then 'socket' else 'port'
  time = new Date - start
  serverLogger.info "#{config.appName} started on #{port} #{app.settings.port} (#{env} mode) in #{time}ms running on node.js #{process.versions.node}"
