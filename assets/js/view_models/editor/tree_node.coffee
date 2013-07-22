isIntString = (x) -> "#{parseInt(x)}" is x

coersiveIDSort = ({id: aIDAccessor}, {id: bIDAccessor}) ->
  a = aIDAccessor()
  b = bIDAccessor()
  if isIntString(a) and isIntString(b)
    a = parseInt a
    b = parseInt b
  if a < b then -1 else if a > b then 1 else 0

# View model for object browser tree node
class @TreeNode

  constructor: (o, @view, @parent) ->

    # attributes
    @id = ko.observable o.id
    @name = ko.observable o.name
    @player = ko.observable o.player
    @children = ko.observableArray o.children.map (p) => new TreeNode p, @view, @

    # presenters
    @idPresenter = ko.computed =>
      id = "\##{@id()}"
      filter = @view.filter()
      @highlight id, filter

    @namePresenter = ko.computed =>
      name = @name()
      filter = @view.filter()
      @highlight name, filter

    # state
    @expanded = ko.observable false

    @visible = ko.computed =>
      return true if @view.filter() == ''

      true in (o.visible() for o in @children()) or @matchesFilter()

    @active = ko.computed =>
      selected = @view.selectedObject()
      if not selected?
        false
      else
        selected.id() == @id()

    # classes
    @iconClass = ko.computed =>
      if @children().length > 0
        if @expanded() then 'icon-caret-down' else 'icon-caret-right'
      else
        if @player() then 'icon-user' else 'icon-file'

    # subscriptions
    @view.filter.subscribe (filter) =>
      if filter isnt '' and @visible()
        @expanded true

  sortChildren: ->
    @children.sort coersiveIDSort

  newChild: (name) ->
    @view.socket.emit 'create_child', {id: @id(), name: name}

  rename: (name) ->
    @view.socket.emit 'rename_object', {id: @id(), name: name}

  delete: ->
    @view.socket.emit 'delete_object', {id: @id()}

  menu: =>
    @view.selectObject @
    [
      {
        text: "New child of '#{@name()}'",
        action: =>
          bootbox.prompt "Name for new child of '#{@name()}':", (name) =>
            if name?
              @newChild name
      },
      {
        text: "Rename '#{@name()}'",
        action: =>
          bootbox.prompt "New name for '#{@name()}':", 'Cancel', 'OK', ((name) =>
            if name?
              @rename name
          ), @name()
      },
      {
        text: "Delete '#{@name()}'",
        action: =>
          if @children().length > 0
            toastr.error "You cannot delete this object because it has children. Delete it's children first."
          else
            bootbox.confirm "Are you sure you want to permanently delete '#{@name()}'?", (confirmed) =>
              @delete() if confirmed
      }
    ]

  toggle: ->
    @expanded !@expanded()

  matchesFilter: ->
    filter = @view.filter()

    matches = (str) =>
      str.toLowerCase().indexOf(filter.toLowerCase()) != -1

    matches(@name()) or matches("\##{@id()}")

  highlight: (str, needle) ->
    if needle is ''
      str
    else if str.toLowerCase().indexOf(needle.toLowerCase()) != -1
      str.replace new RegExp("(#{needle})", 'ig'), '<span class="highlight">$1</span>'
    else
      str