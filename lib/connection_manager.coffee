sockets = {}
players = {}

add = (player, socket) ->
  throw new Error 'invalid player added to connection manager' if not player? or not player.id?
  throw new Error 'invalid socket added to connection manager' if not socket? or not socket.id?
  sockets[player.id] = socket
  players[socket.id] = player
  console.log "#{player.username} connected" if process.env.NODE_ENV != 'test'

remove = (socket) ->
  throw new Error 'invalid socket removed from connection manager' if not socket? or not socket.id?
  player = playerFor socket
  delete sockets[player.id] if player?
  delete players[socket.id] if socket?
  console.log "#{player.username} disconnected" if process.env.NODE_ENV != 'test'

socketFor = (player) ->
  throw new Error 'invalid player passed to socketFor' if not player? or not player.id?
  sockets[player.id] || null

playerFor = (socket) ->
  throw new Error 'invalid socket passed to playerFor' if not socket? or not socket.id?
  players[socket.id] || null

exports.add = add
exports.remove = remove
exports.socketFor = socketFor
exports.playerFor = playerFor