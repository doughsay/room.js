express = require 'express'
http = require 'http'
Mincer  = require 'mincer'
util = require 'util'

# This is the RoomJs web server.
# It sets up the http server and responds to http requests by sending the client code.
module.exports = class RoomJsWebServer

  constructor: (@port, @quiet = false) ->
    environment = new Mincer.Environment()
    environment.appendPath 'assets/js'
    environment.appendPath 'assets/css'
    environment.appendPath 'assets/img'
    environment.appendPath 'vendor/assets/js'
    environment.appendPath 'vendor/assets/css'
    environment.appendPath 'vendor/assets/css/bootstrap'
    environment.appendPath 'vendor/assets/img'

    xp = express()

    xp.configure =>
      xp.set 'port', @port
      xp.set 'views', __dirname + '/views'
      xp.set 'view engine', 'jade'
      xp.use express.favicon()
      xp.use '/assets', Mincer.createServer environment

    xp.get '/', (req, res) ->
      res.render 'client'

    xp.get '/edit', (req, res) ->
      res.render 'editor'

    @http_server = http.createServer(xp).listen xp.get('port'), =>
      util.log "room.js http server listening on port " + xp.get 'port' if not @quiet

  # return the reference to the http server
  getHttpServer: ->
    @http_server