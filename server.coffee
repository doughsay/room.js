util = require 'util'

Db               = require './lib/db'
WebServer        = require './web_server'
ClientController = require './controllers/client'
EditorController = require './controllers/editor'

# 1.) Load the database
# 2.) Start the web server and socket.io server
# 3.) Create the client and editor controllers
# 4.) Handle process exit events

db               = new Db 'db.json'
webServer        = new WebServer 8888
clientController = new ClientController webServer.io, db
editorController = new EditorController webServer.io, db

process.on 'SIGINT', ->
  util.log 'caught SIGINT'
  process.exit()
process.on 'SIGTERM', ->
  util.log 'caught SIGTERM'
  process.exit()
process.on 'exit', ->
  util.log 'exiting'
  db.exit()