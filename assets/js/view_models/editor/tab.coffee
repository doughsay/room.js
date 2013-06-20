# an open tab in the editor
class @Tab

  constructor: ->
    @session.setUseSoftTabs true
    @session.setTabSize 2
    @session.setUseWrapMode true

    @closeIcon = ko.computed =>
      if @dirty() then 'icon-asterisk' else 'icon-remove'

    @active = ko.computed =>
      @ == @view.selectedTab()

  menu: =>
    [
      {
        text: "Close tab",
        action: => @view.closeTab @
      },
      {
        text: "Close other tabs",
        action: => @view.closeOtherTabs @
      },
      {
        text: "Close all tabs",
        action: => @view.closeAllTabs()
      }
    ]

class @PropertyTab extends Tab

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
        toastr.error "There was an error saving: #{error}"
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

  update: (value) ->
    value ?= null
    @property.value value
    @session.setValue JSON.stringify value, null, '  '
    @_value JSON.stringify value

class @VerbTab extends Tab

  type: 'verb'
  iconClass: 'icon-cog'

  constructor: (@verb, @view) ->

    @displayName = ko.computed =>
      object = @verb.object
      objName = if object.alias()? then object.alias() else "[##{object.id} #{object.name()}]"
      "#{objName}.#{@verb.name()}"

    @mode = ko.computed =>
      switch @verb.lang()
        when 'coffeescript'
          'ace/mode/coffee'
        when 'javascript'
          'ace/mode/javascript'
        else
          throw new Error 'invalid language specified'

    @session = new ace.EditSession @verb.code(), @mode()
    @session.on 'change', (e) => @verb.code @session.getValue()

    @mode.subscribe (newMode) => @session.setMode newMode

    @_code = ko.observable @verb.code()
    @_dobjarg = ko.observable @verb.dobjarg()
    @_preparg = ko.observable @verb.preparg()
    @_iobjarg = ko.observable @verb.iobjarg()
    @_hidden = ko.observable @verb.hidden()
    @_name = ko.observable @verb.name()
    @_lang = ko.observable @verb.lang()

    @dirty = ko.computed =>
      not (
        @verb.code() is @_code() and
        @verb.dobjarg() is @_dobjarg() and
        @verb.preparg() is @_preparg() and
        @verb.iobjarg() is @_iobjarg() and
        @verb.hidden() is @_hidden() and
        @verb.name() is @_name() and
        @verb.lang() is @_lang()
      )

    super()

  save: =>
    @view.socket.emit 'save_verb', @serialize(), (error) =>
      if error?
        toastr.error "There was an error saving: #{error}"
      else
        @_code @verb.code()
        @_dobjarg @verb.dobjarg()
        @_preparg @verb.preparg()
        @_iobjarg @verb.iobjarg()
        @_hidden @verb.hidden()
        @_name @verb.name()
        @_lang @verb.lang()

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
      lang: @verb.lang()
    }

  restore: ->
    @verb.code @_code()
    @verb.dobjarg @_dobjarg()
    @verb.preparg @_preparg()
    @verb.iobjarg @_iobjarg()
    @verb.hidden @_hidden()
    @verb.name @_name()
    @verb.lang @_lang()

  update: (verb) ->
    @verb.name verb.name
    @verb.dobjarg verb.dobjarg
    @verb.preparg verb.preparg
    @verb.iobjarg verb.iobjarg
    @verb.code verb.code
    @verb.hidden verb.hidden
    @verb.lang verb.lang

    @_name verb.name
    @_dobjarg verb.dobjarg
    @_preparg verb.preparg
    @_iobjarg verb.iobjarg
    @_code verb.code
    @_hidden verb.hidden
    @_lang verb.lang

    @session.setValue verb.code