ko.bindingHandlers.context =
  init: (element, valueAccessor) ->
    menuItems = ko.utils.unwrapObservable valueAccessor()
    newId = _.uniqueId 'menu_'
    $(element).attr 'id', newId
    selector = "##{newId}"
    context.attach selector, menuItems
    ko.utils.domNodeDisposal.addDisposeCallback element, ->
      context.destroy selector
  update: (element, valueAccessor) ->