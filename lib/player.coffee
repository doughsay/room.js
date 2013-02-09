connections = require './connection_manager'

RoomJsObject = require('./object').RoomJsObject

# a RoomJsPlayer is just a slightly more specialized RoomJsObject
exports.RoomJsPlayer = class extends RoomJsObject
  # RoomJsObject fields +
  # @username: String
  # @password: String
  # @player: Boolean
  # @programmer: Boolean

  constructor: (player, db) ->
    super player, db
    @username = player.username
    @password = player.password
    @player = true
    @programmer = player.programmer

  authenticates: (username, passwordHash) ->
    @username == username and @password == passwordHash

  online: ->
    (connections.socketFor @)?

  send: (msg) ->
    socket = connections.socketFor @
    if socket?
      socket.emit 'output', "\n#{msg}"
      true
    else
      false

  broadcast: (msg) ->
    loc = @location()
    if loc?
      for o in loc.contents()
        o.send msg if o.player and o != @
      true
    else
      false

  input: (msg, fn) ->
    socket = connections.socketFor @
    if socket?
      socket.emit 'request_input', "\n#{msg}", (response) ->
        fn(response)
      true
    else
      false

  setProgrammer: (programmer) ->
    @programmer = !!programmer

  toString: ->
    "[RoomJsPlayer #{@name}]"