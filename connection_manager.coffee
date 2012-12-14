class ConnectionManager

  web = []
  telnet = []

  @add_telnet: (socket) ->
    console.log "new telnet connection added"
    telnet.push socket

  @remove_telnet: (socket) ->
    telnet = telnet.filter (s) ->
      s != socket
    console.log "telnet connection removed"

  @add_web: (socket) ->
    console.log "new web connection added"
    web.push socket

  @remove_web: (socket) ->
    web = web.filter (s) ->
      s != socket
    console.log "web connection removed"

  @broadcast_web: (socket, data) ->
    socket.broadcast.emit 'chat', data
    for s in telnet
      s.write data.msg+"\n"

  @broadcast_telnet: (socket, msg) ->
    for s in web
      s.emit 'chat', {msg: msg.slice(0,msg.length-1)}
    for s in telnet
      if s != socket
        s.write msg

module.exports = ConnectionManager