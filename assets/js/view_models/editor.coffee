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
    @setLayout()
    @setSizes()

    context.init compress: true

    ko.applyBindings @

  # on keyup in the search field this fires so the viewmodel updates immediately
  updateFilter: ->
    $('.search input').trigger 'change'
    true

  ################
  # View Actions #
  ################
  # These methods are triggered from the view, usually through clicks

  # triggered by clicking an object in the object browser
  selectObject: (node) =>
    @socket.emit 'get_object', node.id, (object) =>
      @selectedObject new MiniObject object

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

    event.stopPropagation()

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

    @socket.on 'new_object', @new_object
    @socket.on 'rm_object', @rm_object
    @socket.on 'object_parent_changed', @object_parent_changed
    @socket.on 'object_name_changed', @object_name_changed

    @socket.on 'add_property', @add_property
    @socket.on 'rm_property', @rm_property
    @socket.on 'update_property', @update_property

    @socket.on 'add_verb', @add_verb
    @socket.on 'rm_verb', @rm_verb
    @socket.on 'update_verb', @update_verb

  # build the jqeury ui layout
  setLayout: ->
    @layout = @body.layout
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
    removeChild = (id, p) =>
      [match] = (child for child in p.children() when child.id is id)
      if match?
        p.children.remove match
        match
      else
        removed = null
        for child in p.children()
          removed = removeChild(id, child)
          break if removed?
        removed

    removed = null
    for o in @objects()
      removed = removeChild id, o
      break if removed?

    removed

  insertIntoTree: (obj) ->
    insertChild = (o, p) =>
      if p.id == o.parent_id
        if o instanceof TreeNode
          p.children.push o
        else
          p.children.push new TreeNode o, @, p.level+1
        p.children.sort (l, r) -> l.id - r.id
        true
      else
        added = false
        for child in p.children()
          added = insertChild(o, child)
          break if added
        added

    added = false
    for o in @objects()
      added = insertChild obj, o
      break if added

    added

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
        tab.updateValue value

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

  #################
  # Context Menus #
  #################
  # these methods return context menu definitions

  # context menu for the object attribute list
  attributeMenu: ->
    [
      {
        text: 'New Property',
        action: =>
          bootbox.prompt "Name:", (name) =>
            if name?
              @selectedObject().newProperty name
      },
      {
        text: 'New Verb',
        action: =>
          @selectedObject().newVerb()
      }
    ]

  # context menu for the object browser
  objectMenu: ->
    [
      {
        text: 'New Top-Level Object',
        action: =>
          bootbox.prompt "Name:", (name) =>
            if name?
              @newObject name
      }
    ]

  ########################
  # Sync event listeners #
  ########################

  new_object: (obj) =>
    obj.children = []
    @insertIntoTree obj

  rm_object: (id) =>
    @removeFromTree id
    @removeFromTabs id
    if @selectedObject().id is id
      @selectedObject null

  object_parent_changed: (spec) =>
    o = @removeFromTree spec.id
    o.parent_id = spec.parent_id
    @insertIntoTree o

  object_name_changed: (spec) =>
    o = @findInTree spec.id
    o.name spec.name if o?

    o = @findInTabs spec.id
    o.name spec.name if o?

  add_property: (spec) =>
    if @selectedObject().id is spec.id
      @selectedObject().addProperty spec.key, spec.value

  rm_property: (spec) =>
    if @selectedObject().id is spec.id
      @selectedObject().rmProperty spec.key

    @removePropertyFromTabs spec.id, spec.key

  update_property: (spec) =>
    @updatePropertyInTabs spec.id, spec.key, spec.value

    if @selectedObject().id is spec.id
      @selectedObject().updateProperty spec.key, spec.value

  add_verb: (spec) =>
    if @selectedObject().id is spec.id
      @selectedObject().addVerb spec.verb

  rm_verb: (spec) =>
    if @selectedObject().id is spec.id
      @selectedObject().rmVerb spec.verbName

    @removeVerbFromTabs spec.id, spec.verbName

  update_verb: (spec) =>
    console.log 'TODO update verb', spec
    # @updateVerbInTabs spec.id, spec.verb

    if @selectedObject().id is spec.id
      @selectedObject().updateVerb spec.verb

  # TODO
  # verb sync events
  # object global alias sync events
  # confirm overwrites of dirty tabs

  #############################
  # websocket event listeners #
  #############################

  connect: =>
    # console.log 'Connected!'
    @loadBrowser()

  connecting: =>
    # console.log 'Connecting...'

  disconnect: =>
    # console.log 'Disconnected from server.'
    bootbox.alert 'Disconnected from server.'
    @clearEditor()

  connect_failed: =>
    # console.log 'Connection to server failed.'
    bootbox.alert 'Connection to server failed.'

  error: =>
    # console.log 'An unknown error occurred.'
    bootbox.alert 'An unknown error occurred.'

  reconnect_failed: =>
    # console.log 'Unable to reconnect to server.'
    bootbox.alert 'Unable to reconnect to server.'

  reconnect: =>
    # console.log 'Reconnected!'

  reconnecting: =>
    # console.log 'Attempting to reconnect...'