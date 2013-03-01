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

    @active = ko.computed =>
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

class SelectedObject

  constructor: (object) ->
    @id = ko.observable object.id
    @properties = ko.observableArray object.properties.map (p) ->
      key: ko.observable p.key
      value: ko.observable p.value
      active: ko.observable false
    @verbs = ko.observableArray object.verbs.map (v) ->
      name: ko.observable v.name
      dobjarg: ko.observable v.dobjarg
      preparg: ko.observable v.preparg
      iobjarg: ko.observable v.iobjarg
      code: ko.observable v.code
      active: ko.observable false

  selectProperty: (keyAccessor) ->
    key = keyAccessor()
    =>
      for p in @properties()
        if p.key() == key
          p.active true
        else
          p.active false

      v.active(false) for v in @verbs()

  selectVerb: (nameAccessor) ->
    name = nameAccessor()
    =>
      for v in @verbs()
        if v.name() == name
          v.active true
        else
          v.active false

      p.active(false) for p in @properties()

class Tab

  constructor: (tab, @view) ->
    @type = tab.type
    @object = ko.observable tab.object
    @name = ko.observable tab.name
    @objectId = tab.objectId
    @dirty = ko.observable false
    console.log @object()

    @displayName = ko.computed =>
      object = @object()
      objName = if object.alias? then object.alias else "[##{object.id} #{object.name}]"
      "#{objName}.#{@name()}"

    @iconClass = ko.computed =>
      switch @type
        when 'verb'
          'icon-cog'
        when 'property'
          'icon-file-alt'

    @closeSymbol = ko.computed =>
      if @dirty() then '•' else '×'

    @active = ko.computed =>
      @ == @view.selectedTab()

# Knockout.js view model for the room.js editor
class EditorView

  socket: null

  # construct the view model
  constructor: (@body) ->
    @socket = io.connect(window.location.href)
    @objects = ko.observableArray []
    @filter_text = ko.observable ''

    @filter = ko.computed( =>
      @filter_text()
    ).extend throttle: 500

    @selectedObject = ko.observable null

    @tabs = ko.observableArray []

    @selectedTab = ko.observable null

    @attachListeners()

    ko.applyBindings @

  # on keyup in the search field this fires so the viewmodel updates immediately
  updateFilter: ->
    $('.search input').trigger 'change'
    true

  select: (idAccessor) ->
    id = idAccessor()
    =>
      @socket.emit 'get_object', id, (object) =>
        @selectedObject new SelectedObject object

  openProperty: (idAccessor, keyAccessor) ->
    id = idAccessor()
    key = keyAccessor()
    =>
      tab = @tabs().filter((t) -> t.type is 'property' and t.objectId is id and t.name() is key)[0]
      if tab?
        @selectTab(tab)()
      else
        @socket.emit 'get_object', id, (object) =>
          tab = new Tab {type: 'property', object: object, name: key}, @
          @tabs.push tab
          @selectTab(tab)()

  openVerb: (idAccessor, nameAccessor) ->
    id = idAccessor()
    name = nameAccessor()
    =>
      tab = @tabs().filter((t) -> t.type is 'verb' and t.objectId is id and t.name() is name)[0]
      if tab?
        @selectTab(tab)()
      else
        @socket.emit 'get_object', id, (object) =>
          tab = new Tab {type: 'verb', object: object, name: name}, @
          @tabs.push tab
          @selectTab(tab)()

  closeTab: (tab, event) =>
    remove = =>
      tabIndex = @tabs.indexOf(tab)
      selectOther = tab.active()
      @tabs.remove(tab)
      if selectOther
        otherTab = @tabs()[tabIndex]
        if not otherTab? and tabIndex > 0
          otherTab = @tabs()[tabIndex-1]
        @selectTab(otherTab)() if otherTab?

      if @tabs().length == 0
        @selectedTab null

    if tab.dirty()
      bootbox.confirm "Are you sure you want to close this #{tab.type}?  Your unsaved changes will be lost.", (close) =>
        remove() if close
    else
      remove()

    event.stopPropagation()

  selectTab: (tab) ->
    =>
      @selectedTab tab

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