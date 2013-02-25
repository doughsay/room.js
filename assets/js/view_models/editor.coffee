class TreeNode

  constructor: (o, @view, @level = 1) ->
    @id = ko.observable o.id
    @name = ko.observable o.name
    @player = ko.observable o.player
    @alias = ko.observable o.alias
    @children = ko.observableArray o.children.map (p) => new TreeNode p, @view, @level+1

    # presenters
    @idPresenter = ko.computed =>
      id = "\##{@id()}"
      filter = @view.filter()

      return id if filter == ''

      if id.toLowerCase().indexOf(filter.toLowerCase()) != -1
        id.replace new RegExp("(#{filter})", 'ig'), '<span class="highlight">$1</span>'
      else
        id

    @namePresenter = ko.computed =>
      name = @name()
      filter = @view.filter()

      return name if filter == ''

      if name.toLowerCase().indexOf(filter.toLowerCase()) != -1
        name.replace new RegExp("(#{filter})", 'ig'), '<span class="highlight">$1</span>'
      else
        name

    @aliasPresenter = ko.computed =>
      return '' if not @alias()?
      alias = "#{@alias()}"
      filter = @view.filter()

      return alias if filter == ''

      if alias.toLowerCase().indexOf(filter.toLowerCase()) != -1
        alias.replace new RegExp("(#{filter})", 'ig'), '<span class="highlight">$1</span>'
      else
        alias

    # state
    @expanded = ko.observable false
    @iconClass = ko.computed =>
      if @children().length > 0
        if @expanded() then 'icon-caret-down' else 'icon-caret-right'
      else
        if @player() then 'icon-user' else 'icon-file'
    @levelClass = ko.computed => "level#{@level}"
    @visible = ko.computed =>
      return true if @view.filter() == ''

      true in (o.visible() for o in @children()) or @matchesFilter()

    @active = ko.computed (x) =>
      selected = @view.selectedObject()
      if not selected?
        false
      else
        selected.id() == @id()

    @view.filter.subscribe (filter) =>
      if filter isnt '' and @visible()
        @expanded true

  toggle: ->
    @expanded !@expanded()

  matchesFilter: ->
    filter = @view.filter()

    matches = (str) =>
      str.toLowerCase().indexOf(filter.toLowerCase()) != -1

    matches(@name()) or matches("#{@alias()}") or matches("\##{@id()}")

class ActiveObject

  constructor: (object) ->
    @id = ko.observable object.id
    @properties = ko.observableArray object.properties.map (p) ->
      key: ko.observable p.key
      value: ko.observable p.value
    @verbs = ko.observableArray object.verbs.map (v) ->
      name: ko.observable v.name
      dobjarg: ko.observable v.dobjarg
      preparg: ko.observable v.preparg
      iobjarg: ko.observable v.iobjarg
      code: ko.observable v.code

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

    @selectedObject = ko.observable null

    @attachListeners()

  # on keyup in the search field this fires so the viewmodel updates immediately
  updateFilter: ->
    $('.search input').trigger 'change'
    true

  select: (idAccessor) ->
    id = idAccessor()
    =>
      @socket.emit 'get_object', id, (object) =>
        @selectedObject new ActiveObject object

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
      @objects tree.map (o) => new TreeNode o, @

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