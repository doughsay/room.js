# View model for object browser tree node
class TreeNode

  constructor: (o, @view, @level = 1) ->

    # attributes
    @id = o.id
    @name = ko.observable o.name
    @player = ko.observable o.player
    @alias = ko.observable o.alias
    @children = ko.observableArray o.children.map (p) => new TreeNode p, @view, @level+1

    # presenters
    @idPresenter = ko.computed =>
      id = "\##{@id}"
      filter = @view.filter()
      @highlight id, filter

    @namePresenter = ko.computed =>
      name = @name()
      filter = @view.filter()
      @highlight name, filter

    @aliasPresenter = ko.computed =>
      return '' if not @alias()?
      alias = "#{@alias()}"
      filter = @view.filter()
      @highlight alias, filter

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
        selected.id == @id

    # classes
    @iconClass = ko.computed =>
      if @children().length > 0
        if @expanded() then 'icon-caret-down' else 'icon-caret-right'
      else
        if @player() then 'icon-user' else 'icon-file'

    @levelClass = ko.computed => "level#{@level}"

    # subscriptions
    @view.filter.subscribe (filter) =>
      if filter isnt '' and @visible()
        @expanded true

    # context menu
    @menu = ko.computed =>
      [
        {
          text: "New Child of '#{@name()}'",
          action: => console.log 'TODO: new child object of', @name()
        },
        {
          text: "Rename '#{@name()}'",
          action: => console.log 'TODO: rename object', @name()
        },
        {
          text: "Delete '#{@name()}'",
          action: => console.log 'TODO: delete object', @name()
        }
      ]

  toggle: ->
    @expanded !@expanded()

  matchesFilter: ->
    filter = @view.filter()

    matches = (str) =>
      str.toLowerCase().indexOf(filter.toLowerCase()) != -1

    matches(@name()) or matches("#{@alias()}") or matches("\##{@id}")

  highlight: (str, needle) ->
    if needle is ''
      str
    else if str.toLowerCase().indexOf(needle.toLowerCase()) != -1
      str.replace new RegExp("(#{needle})", 'ig'), '<span class="highlight">$1</span>'
    else
      str