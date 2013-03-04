# an open tab in the editor
class Tab

  constructor: ->
    @session.setUseSoftTabs true
    @session.setTabSize 2
    @session.setUseWrapMode true

    @closeSymbol = ko.computed =>
      if @dirty() then '•' else '×'

    @active = ko.computed =>
      @ == @view.selectedTab()

  save: -> bootbox.alert "TODO"

class PropertyTab extends Tab

  type: 'property'
  iconClass: 'icon-file-alt'

  constructor: (@property, @view) ->

    @displayName = ko.computed =>
      object = @property.object
      objName = if object.alias()? then object.alias() else "[##{object.id} #{object.name()}]"
      "#{objName}.#{@property.key()}"

    value = @property.value()
    value ?= null
    @session = new ace.EditSession JSON.stringify(value, null, '  '), 'ace/mode/json'
    @error = ko.observable false
    @session.on 'change', (e) =>
      try
        @property.value JSON.parse @session.getValue()
        @error false
      catch e
        @error true

    @_value = ko.observable JSON.stringify value

    @dirty = ko.computed =>
      value = JSON.stringify @property.value()
      value isnt @_value()

    super()

  save: =>
    @view.socket.emit 'save_property', @serialize(), (error) =>
      if error?
        bootbox.alert "There was an error saving: #{error}"
      else
        @_value JSON.stringify @property.value()

  serialize: ->
    {
      object_id: @property.object.id
      key: @property.key()
      value: @property.value()
    }

  restore: ->
    @property.value JSON.parse @_value()

class VerbTab extends Tab

  type: 'verb'
  iconClass: 'icon-cog'

  constructor: (@verb, @view) ->

    @displayName = ko.computed =>
      object = @verb.object
      objName = if object.alias()? then object.alias() else "[##{object.id} #{object.name()}]"
      "#{objName}.#{@verb.name()}"

    @session = new ace.EditSession @verb.code(), 'ace/mode/coffee'
    @session.on 'change', (e) => @verb.code @session.getValue()

    @_code = ko.observable @verb.code()
    @_dobjarg = ko.observable @verb.dobjarg()
    @_preparg = ko.observable @verb.preparg()
    @_iobjarg = ko.observable @verb.iobjarg()
    @_hidden = ko.observable @verb.hidden()
    @_name = ko.observable @verb.name()

    @dirty = ko.computed =>
      not (
        @verb.code() is @_code() and
        @verb.dobjarg() is @_dobjarg() and
        @verb.preparg() is @_preparg() and
        @verb.iobjarg() is @_iobjarg() and
        @verb.hidden() is @_hidden() and
        @verb.name() is @_name()
      )

    super()

  save: =>
    @view.socket.emit 'save_verb', @serialize(), (error) =>
      if error?
        bootbox.alert "There was an error saving: #{error}"
      else
        @_code @verb.code()
        @_dobjarg @verb.dobjarg()
        @_preparg @verb.preparg()
        @_iobjarg @verb.iobjarg()
        @_hidden @verb.hidden()
        @_name @verb.name()

  serialize: ->
    {
      object_id: @verb.object.id
      code: @verb.code()
      dobjarg: @verb.dobjarg()
      preparg: @verb.preparg()
      iobjarg: @verb.iobjarg()
      hidden: @verb.hidden()
      name: @verb.name()
      original_name: @_name()
    }

  restore: ->
    @verb.code @_code()
    @verb.dobjarg @_dobjarg()
    @verb.preparg @_preparg()
    @verb.iobjarg @_iobjarg()
    @verb.hidden @_hidden()
    @verb.name @_name()