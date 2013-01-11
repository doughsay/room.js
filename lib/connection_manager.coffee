sockets = {}
players = {}

add = (player, socket) ->
  sockets[player.id] = socket
  players[socket.id] = player

remove = (socket) ->
  player = playerFor socket
  delete sockets[player.id] if player?
  delete players[socket.id] if socket?

socketFor = (player) ->
  sockets[player.id] || null

playerFor = (socket) ->
  players[socket.id] || null

exports.add = add
exports.remove = remove
exports.socketFor = socketFor
exports.playerFor = playerFor