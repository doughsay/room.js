class Property

  constructor: (object, key, value) ->
    @object = object

    @key = ko.observable key
    @value = ko.observable value
    
    @active = ko.observable false

    @menu = ko.computed =>
      [
        {
          text: "Delete Property '#{@key()}'",
          action: => console.log 'TODO: delete property', @key()
        }
      ]

class Verb

  constructor: (object, name, verb) ->
    @object = object

    @name = ko.observable name
    @dobjarg = ko.observable verb.dobjarg
    @preparg = ko.observable verb.preparg
    @iobjarg = ko.observable verb.iobjarg
    @code = ko.observable verb.code
    @hidden = ko.observable verb.hidden

    @active = ko.observable false
    
    @iconClass = ko.computed =>
      if @hidden() then 'icon-eye-close' else 'icon-cog'
  
    @menu = ko.computed =>
      [
        {
          text: "Delete Verb '#{@name()}'",
          action: => console.log 'TODO: delete verb', @name()
        }
      ]

# view model for an object in the editor
class MiniObject

  constructor: (object) ->
    @id = object.id
    @name = ko.observable object.name
    @alias = ko.observable object.alias

    @properties = ko.observableArray (new Property @, key, value for key, value of object.properties)
    @verbs = ko.observableArray (new Verb @, name, verb for name, verb of object.verbs)

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
    console.log 'TODO: create new property', name

  newVerb: ->
    console.log 'TODO: create new verb'