# A RoomJsEditorSocket represents a websocket connection from the editor.
# It handles the websocket events.
class RoomJsEditorSocket

  constructor: (@db, @socket) ->

    @socket.on 'disconnect', @onDisconnect
    @socket.on 'get_tree', @onGetTree

  # fires when a websocket disconnects, either by the client closing the connection
  # or calling the `disconnect` method of the socket.
  onDisconnect: =>

  onGetTree: (data, fn) =>
    fn {foo: 'bar'}

# This is the editor websocket server.
# It sets up the websocket listener and handles new socket connections for the editor.
module.exports = class RoomJsEditorServer

  constructor: (httpServer, db) ->
    io = require('socket.io').listen(httpServer, {log: false})
    io.of('/editor').on 'connection', (socket) ->
      new RoomJsEditorSocket db, socket