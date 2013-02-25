class TreeNode

  constructor: (o) ->
    @id = ko.observable o.id
    @name = ko.observable o.name
    @player = ko.observable o.player
    @alias = ko.observable o.alias
    @children = ko.observableArray o.children.map (p) -> new TreeNode p

    # presenters
    @idPresenter = ko.computed => "\##{@id()}"

    # state
    @active = ko.observable false
    @expanded = ko.observable false
    @iconClass = ko.computed =>
      if @children().length > 0
        if @expanded() then 'icon-caret-down' else 'icon-caret-right'
      else
        if @player() then 'icon-user' else 'icon-file'

  toggle: ->
    @expanded !@expanded()

  select: ->
    console.log 'TODO'

# Knockout.js view model for the room.js editor
class EditorView

  socket: null

  # construct the view model
  constructor: (@body) ->
    @socket = io.connect(window.location.href)
    @objects = ko.observableArray []
    @filter = ko.observable ''

    @filteredObjects = ko.computed =>
      filter = @filter()
      objects = @objects()
      # TODO
      # return nested array of objects who's name or alias or id match the filter
      # parents of objects who match must be shown obviously
      # highlighting the matched text would be nice too

    @attachListeners()

  # on keyup in the search field this fires so the viewmodel updates immediately
  updateFilter: (e) =>
    $('.search input').trigger 'change'
    true

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
        size: '20%'
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
    @socket.emit 'get_tree', null, (tree) =>
      @objects tree.map (o) -> new TreeNode o

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