isIntString = (x) -> "#{parseInt(x)}" is x

coersiveIDSort = ({id: a}, {id: b}) ->
  if isIntString(a) and isIntString(b)
    a = parseInt a
    b = parseInt b
  if a < b then -1 else if a > b then 1 else 0

# Knockout.js view model for the room.js editor
class @EditorView

  socket: null

  # construct the view model
  constructor: ->
    @socket = io.connect(window.location.href)
    @username = ko.observable ''
    @password = ko.observable ''
    @error = ko.observable null
    @connected = ko.observable false
    @authenticated = ko.observable false
    @objects = ko.observableArray []
    @filter_text = ko.observable ''

    @filter = ko.computed( =>
      @filter_text()
    ).extend throttle: 500

    @selectedObject = ko.observable null

    @tabs = ko.observableArray []
    @tabs.subscribe =>
      window.setTimeout (=>
        @setSizes()
      ), 1

    @selectedTab = ko.observable null

    element = $('.editor')[0]
    @editor = ace.edit element
    @editor.setTheme 'ace/theme/clouds'
    @editor.setShowPrintMargin false
    $(element).css fontSize: '12pt', fontFamily: '"Source Code Pro", sans-serif'

    @attachListeners()

    @layoutOptions = ko.observable
      livePaneResizing: true
      onresize: =>
        @setSizes()
      west:
        size: '20%'
        slidable: false
        closable: false
        childOptions:
          livePaneResizing: true
          center:
            paneSelector: '.ui-layout-west-center'
          south:
            paneSelector: '.ui-layout-west-south'
            size: '50%'
            slidable: false
            closable: false

    ko.applyBindings @
    $('.cloak').removeClass 'cloak'
    @setSizes()

  # on keyup in the search field this fires so the viewmodel updates immediately
  updateFilter: ->
    $('.search input').trigger 'change'
    true

  ################
  # View Actions #
  ################
  # These methods are triggered from the view, usually through clicks

  login: ->
    @socket.emit 'login', {username: @username(), password: @password()}, (good) =>
      @password ''
      if good
        @authenticated true
        @error null
        @loadBrowser()
        $('.editor-layout').layout().resizeAll()
      else
        @error 'Invalid username or password'

  unsetError: ->
    @error null

  authenticate: ->
    @authenticated true

  # triggered by clicking an object in the object browser
  selectObject: (node) =>
    o = @findInTabs node.id
    if o?
      @selectedObject o
    else
      @socket.emit 'get_object', node.id, (object) =>
        @selectedObject new MiniObject object, @

  # triggered by double-clicking a property in the object attribute list
  openProperty: (property) =>
    tab = @tabs().filter((t) -> t.type is 'property' and t.property.object.id is property.object.id and t.property.key() is property.key())[0]
    if tab?
      @selectTab(tab)
    else
      tab = new PropertyTab property, @
      @tabs.push tab
      @selectTab(tab)

  # triggered by double-clicking a verb in the object attribute list
  openVerb: (verb) =>
    tab = @tabs().filter((t) -> t.type is 'verb' and t.verb.object.id is verb.object.id and t.verb.name() is verb.name())[0]
    if tab?
      @selectTab(tab)
    else
      tab = new VerbTab verb, @
      @tabs.push tab
      @selectTab(tab)

  # triggered by clicking a tab
  selectTab: (tab) =>
    @selectedTab tab
    @editor.setSession tab.session

  # triggered by clicking a tab's close button
  closeTab: (tab, event) =>
    if tab.dirty()
      bootbox.confirm "Are you sure you want to close this #{tab.type}?  Your unsaved changes will be lost.", (close) =>
        @removeTab(tab) if close
    else
      @removeTab tab

    if event?
      event.stopPropagation()

  closeOtherTabs: (thisTab) =>
    for tab in (tab for tab in @tabs())
      @closeTab tab if tab isnt thisTab

  closeAllTabs: =>
    for tab in (tab for tab in @tabs())
      @closeTab tab

  #######################
  # Misc Helper Methods #
  #######################

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

    @socket.on 'object_created', @object_created
    @socket.on 'object_deleted', @object_deleted
    @socket.on 'object_parent_changed', @object_parent_changed
    @socket.on 'object_id_changed', @object_id_changed
    @socket.on 'object_name_changed', @object_name_changed

    @socket.on 'property_added', @property_added
    @socket.on 'property_deleted', @property_deleted
    @socket.on 'property_updated', @property_updated

    @socket.on 'verb_added', @verb_added
    @socket.on 'verb_deleted', @verb_deleted
    @socket.on 'verb_updated', @verb_updated

  # set the size of the ace editor
  setSizes: ->
    editor = $ '.editor'
    frame = editor.parent()
    tabs = $ '.tabs'
    toolbar = $ '.toolbar'
    editor.width frame.innerWidth()
    editor.height frame.innerHeight() - tabs.outerHeight() - toolbar.outerHeight()
    @editor.resize()

  # load all known objects into the object browser
  loadBrowser: ->
    @socket.emit 'get_tree', null, (tree) =>
      @objects tree.map (o) => new TreeNode o, @

  clearEditor: ->
    @objects []
    @tabs []
    @selectedObject null
    @selectedTab null

  findInTree: (id) ->
    find = (id, o) ->
      if o.id == id
        o
      else
        for child in o.children()
          found = find id, child
          return found if found?
        null

    found = null
    for o in @objects()
      found = find id, o
      break if found?

    found

  removeFromTree: (id) ->
    node = @findInTree id
    if not node? then return null
    if node.parent?
      node.parent.children.remove node
      node.parent = null
    else
      @objects.remove node
    node

  insertIntoTree: (node, parent_id) ->
    if parent_id?
      parentNode = @findInTree parent_id
      if not parentNode?
        toastr.error "couldn't find parent node"
        return null
      node.parent = parentNode
      parentNode.children.push node
      parentNode.children.sort coersiveIDSort
    else
      @objects.push node
      @objects.sort coersiveIDSort

  findInTabs: (id) ->
    os = @tabs().map (tab) ->
      switch tab.type
        when 'property'
          tab.property.object
        when 'verb'
          tab.verb.object

    [match] = os.filter (o) -> o.id is id

    match || null

  updatePropertyInTabs: (id, key, value) ->
    for tab in @tabs()
      if tab.type is 'property' and tab.property.key() is key and tab.property.object.id is id
        tab.update value

  removeFromTabs: (id) ->
    tabsToRemove = []
    for tab in @tabs()
      switch tab.type
        when 'property'
          o = tab.property.object
        when 'verb'
          o = tab.verb.object
      if o.id is id
        tabsToRemove.push tab

    @removeTab tab for tab in tabsToRemove

  removePropertyFromTabs: (id, key) ->
    tabsToRemove = []
    for tab in @tabs()
      if tab.type is 'property' and tab.property.key() is key and tab.property.object.id is id
        tabsToRemove.push tab

    @removeTab tab for tab in tabsToRemove

  removeVerbFromTabs: (id, verbName) ->
    tabsToRemove = []
    for tab in @tabs()
      if tab.type is 'verb' and tab.verb.name() is verbName and tab.verb.object.id is id
        tabsToRemove.push tab

    @removeTab tab for tab in tabsToRemove

  removeTab: (tab) ->
    tab.restore()
    tabIndex = @tabs.indexOf(tab)
    selectOther = tab.active()
    @tabs.remove(tab)
    if selectOther
      otherTab = @tabs()[tabIndex]
      if not otherTab? and tabIndex > 0
        otherTab = @tabs()[tabIndex-1]
      @selectTab(otherTab) if otherTab?

    if @tabs().length == 0
      @selectedTab null

  updateVerbInTabs: (id, verb) ->
    for tab in @tabs()
      if tab.type is 'verb' and tab.verb.name() is verb.original_name and tab.verb.object.id is id
        tab.update verb

  newObject: (name) ->
    @socket.emit 'create_object', {name: name}

  #################
  # Context Menus #
  #################
  # these methods return context menu definitions

  # context menu for the object attribute list
  attributeMenu: =>
    if @selectedObject()?
      @selectedObject().menu()

  # context menu for the object browser
  objectMenu: =>
    [
      {
        text: 'New top-level object',
        action: =>
          bootbox.prompt "Name for new object:", (name) =>
            if name?
              @newObject name
      }
    ]

  ########################
  # Sync event listeners #
  ########################

  object_created: (obj) =>
    obj.children = []
    parent_id = obj.parent_id
    delete obj.parent_id
    obj = new TreeNode obj, @
    @insertIntoTree obj, parent_id

  object_deleted: (id) =>
    @removeFromTree id
    @removeFromTabs id
    if @selectedObject()?.id is id
      @selectedObject null

  object_parent_changed: (spec) =>
    o = @removeFromTree spec.id
    @insertIntoTree o, spec.parent_id

  object_id_changed: (oldId, newId) =>
    console.log 'TODO', oldId, newId

  object_name_changed: (spec) =>
    o = @findInTree spec.id
    o.name spec.name if o?

    o = @findInTabs spec.id
    o.name spec.name if o?

  property_added: (spec) =>
    if @selectedObject().id is spec.id
      @selectedObject().addProperty spec.key, spec.value

  property_deleted: (spec) =>
    if @selectedObject().id is spec.id
      @selectedObject().rmProperty spec.key

    @removePropertyFromTabs spec.id, spec.key

  property_updated: (spec) =>
    @updatePropertyInTabs spec.id, spec.key, spec.value

    if @selectedObject().id is spec.id
      @selectedObject().updateProperty spec.key, spec.value

  verb_added: (spec) =>
    if @selectedObject().id is spec.id
      @selectedObject().addVerb spec.verb

  verb_deleted: (spec) =>
    if @selectedObject().id is spec.id
      @selectedObject().rmVerb spec.verbName

    @removeVerbFromTabs spec.id, spec.verbName

  verb_updated: (spec) =>
    @updateVerbInTabs spec.id, spec.verb

    if @selectedObject().id is spec.id
      @selectedObject().updateVerb spec.verb

  # TODO
  # object global alias sync events
  # confirm overwrites of dirty tabs

  #############################
  # websocket event listeners #
  #############################

  connect: =>
    @connected true

  connecting: =>

  disconnect: =>
    toastr.error 'Disconnected from server.'
    @clearEditor()
    @connected false
    @authenticated false

  connect_failed: =>
    # this will never happen, see socket.io pull request: https://github.com/LearnBoost/socket.io-client/pull/516
    toastr.error 'Connection to server failed.'

  error: =>
    toastr.error 'An unknown error occurred.'

  reconnect_failed: =>
    # this will never happen, see socket.io pull request: https://github.com/LearnBoost/socket.io-client/pull/516
    toastr.error 'Unable to reconnect to server.'

  reconnect: =>

  reconnecting: =>