socket = io.connect 'http://localhost'
# socket.on 'news', (data) ->
#   console.log data
#   socket.emit 'my other event', { my: 'data' }
socket.on 'chat', (data) ->
	console.log "got chat!", data