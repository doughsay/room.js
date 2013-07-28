class @Property

  constructor: (@object, key, value) ->
    @key = ko.observable key
    @value = ko.observable value

    @active = ko.observable false

  menu: =>
    @object.selectProperty @
    [
      {
        text: "Delete property '#{@key()}'",
        action: =>
          bootbox.confirm "Are you sure you want to permanently delete property '#{@key()}' of '#{@object.name()}'?", (confirmed) =>
            @delete() if confirmed
      }
    ]

  delete: ->
    @object.view.socket.emit 'delete_property', {id: @object.id(), key: @key()}

class @Verb

  constructor: (@object, name, verb) ->
    @name = ko.observable name
    @dobjarg = ko.observable verb.dobjarg
    @preparg = ko.observable verb.preparg
    @iobjarg = ko.observable verb.iobjarg
    @code = ko.observable verb.code
    @hidden = ko.observable verb.hidden
    @lang = ko.observable verb.lang

    @active = ko.observable false

    @iconClass = ko.computed =>
      if @hidden() then 'icon-eye-close' else 'icon-cog'

  menu: =>
    @object.selectVerb @
    [
      {
        text: "Delete verb '#{@name()}'",
        action: =>
          bootbox.confirm "Are you sure you want to permanently delete verb '#{@name()}' of '#{@object.name()}'?", (confirmed) =>
            @delete() if confirmed
      }
    ]

  delete: ->
    @object.view.socket.emit 'delete_verb', {id: @object.id(), name: @name()} # TODO this will fail when someone has edited the name but not saved yet

  update: (verb) ->
    @name verb.name
    @dobjarg verb.dobjarg
    @preparg verb.preparg
    @iobjarg verb.iobjarg
    @code verb.code
    @hidden verb.hidden
    @lang verb.lang

# view model for an object in the editor
class @MiniObject

  constructor: (object, @view) ->
    @id = ko.observable object.id
    @name = ko.observable object.name
    @alias = ko.observable object.alias

    @properties = ko.observableArray (new Property @, key, value for key, value of object.properties)
    @verbs = ko.observableArray (new Verb @, name, verb for name, verb of object.verbs)

    @sort()

  menu: =>
    [
      {
        text: 'New property',
        action: =>
          bootbox.prompt "Name of new property for '#{@name()}':", (name) =>
            if name?
              @newProperty name
      },
      {
        text: 'New verb',
        action: =>
          bootbox.prompt "Name of new verb for '#{@name()}':", (name) =>
            if name?
              @newVerb name
      }
    ]

  addProperty: (key, value) ->
    @properties.push new Property @, key, value
    @sort()

  rmProperty: (key) ->
    [match] = @properties().filter (p) -> p.key() is key
    if match?
      @properties.remove match
      true
    else
      false

  updateProperty: (key, value) ->
    for property in @properties()
      if property.key() is key
        property.value value

  addVerb: (verb) ->
    @verbs.push new Verb @, verb.name, verb
    @sort()

  rmVerb: (verbName) ->
    [match] = @verbs().filter (v) -> v.name() is verbName
    if match?
      @verbs.remove match
      true
    else
      false

  updateVerb: (verb) ->
    for v in @verbs()
      if v.name() is verb.original_name
        v.update verb

  sort: ->
    @properties.sort (l, r) -> if l.key() is r.key() then 0 else (if l.key() < r.key() then -1 else 1)
    @verbs.sort (l, r) -> if l.name() is r.name() then 0 else (if l.name() < r.name() then -1 else 1)

  unselectAll: ->
    p.active false for p in @properties()
    v.active false for v in @verbs()

  selectProperty: (property) =>
    @unselectAll()
    property.active true

  selectVerb: (verb) =>
    @unselectAll()
    verb.active true

  newProperty: (name) ->
    @view.socket.emit 'create_property', {id: @id(), key: name, value: ''}, =>
      prop = @properties().filter((prop) -> prop.key() is name)[0]
      @selectProperty prop
      @view.openProperty prop

  newVerb: (name) ->
    @view.socket.emit 'create_verb', {id: @id(), name: name}, =>
      verb = @verbs().filter((verb) -> verb.name() is name)[0]
      @selectVerb verb
      @view.openVerb verb