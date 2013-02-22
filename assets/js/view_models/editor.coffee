# Knockout.js view model for the room.js editor
class EditorView

  socket: null

  # construct the view model
  constructor: (@body) ->
    @socket = io.connect(window.location.href)
    @attachListeners()

  # attach the websocket event listeners
  attachListeners: ->
    @socket.on 'connect', @connect
    @socket.on 'connecting', @connecting
    @socket.on 'disconnect', @disconnect
    @socket.on 'connect_failed', @connect_failed
    @socket.on 'error', @error
    @socket.on 'reconnect_failed', @reconnect_failed
    @socket.on 'reconnect', @reconnect
    @socket.on 'reconnecting', @reconnecting

    @setLayout()

  # build the jqeury ui layout
  setLayout: ->
    @layout = @body.layout
      livePaneResizing: true
      west:
        size: '15%'
        slidable: false
        childOptions:
          livePaneResizing: true
          center:
            paneSelector: '.ui-layout-west-center'
          south:
            paneSelector: '.ui-layout-west-south'
            size: '50%'
            slidable: false


  loadSidebar: ->
    @socket.emit 'get_tree', null, (tree) ->
      console.log tree

  #############################
  # websocket event listeners #
  #############################

  connect: =>
    console.log 'Connected!'
    @loadSidebar()

  connecting: =>
    console.log 'Connecting...'

  disconnect: =>
    console.log 'Disconnected from server.'

  connect_failed: =>
    console.log 'Connection to server failed.'

  error: =>
    console.log 'An unknown error occurred.'

  reconnect_failed: =>
    console.log 'Unable to reconnect to server.'

  reconnect: =>
    # console.log 'Reconnected!'

  reconnecting: =>
    console.log 'Attempting to reconnect...'