# Knockout.js view model for bootstrap modal forms
class @ModalFormView

  class Input
    constructor: (inputDescriptor) ->
      @type = ko.observable inputDescriptor.type
      @name = ko.observable inputDescriptor.name
      @label = ko.observable inputDescriptor.label
      @error = ko.observable inputDescriptor.error || false
      @value = ko.observable inputDescriptor.value || ""

  constructor: (formDescriptor, @socket) ->
    @event = ko.observable formDescriptor.event
    @title = ko.observable formDescriptor.title
    @submit = ko.observable formDescriptor.submit
    @error = ko.observable formDescriptor.error || false
    @inputs = ko.observableArray formDescriptor.inputs.map (inputDescriptor) -> new Input(inputDescriptor)

  updateObservables: (newFormDescriptor) ->
    @error newFormDescriptor.error || false
    @inputs newFormDescriptor.inputs.map (inputDescriptor) -> new Input(inputDescriptor)
    $('.modal').find('input').first().trigger('focus')

  doSubmit: ->
    modal = $('.modal')
    form = modal.find('form')
    formData = form.serializeArray().reduce ((o,c) -> o[c.name] = c.value; o), {}
    @socket.emit "form_input_#{@event()}", formData, (response) =>
      if response?
        @updateObservables response
      else
        modal.modal 'hide'
    false

  shown: (element, valueAccessor) ->
    $(element).find('input').first().focus()

  hidden: (element, valueAccessor) ->
    valueAccessor()(null)
    $('.command input').focus()