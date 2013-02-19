util = require 'util'

RoomJsDb           = require('./lib/db').RoomJsDb
RoomJsWebServer    = require('./web_server').RoomJsWebServer
RoomJsSocketServer = require('./socket_server').RoomJsSocketServer

# 1.) Load the database
# 2.) Start the web server
# 3.) Start the websocket server
# 4.) Handle process exit events

db           = new RoomJsDb 'db.json'
webServer    = new RoomJsWebServer 8888
socketServer = new RoomJsSocketServer webServer.getHttpServer(), db

process.on 'SIGINT', ->
  util.log 'caught SIGINT'
  process.exit()
process.on 'SIGTERM', ->
  util.log 'caught SIGTERM'
  process.exit()
process.on 'exit', ->
  util.log 'exiting'
  db.exit()