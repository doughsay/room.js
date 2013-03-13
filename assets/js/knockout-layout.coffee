ko.bindingHandlers.layout =
  init: (element, valueAccessor) ->

    options = ko.utils.unwrapObservable valueAccessor()
    $(element).layout options

    ko.utils.domNodeDisposal.addDisposeCallback element, ->
      $(element).layout().destroy()