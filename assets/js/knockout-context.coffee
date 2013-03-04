ko.bindingHandlers.context =
  init: (element, valueAccessor) ->
    newId = _.uniqueId 'menu_'
    $(element).attr 'id', newId
    selector = "##{newId}"
    ko.utils.domNodeDisposal.addDisposeCallback element, ->
      context.destroy selector
  update: (element, valueAccessor) ->
    menuItems = ko.utils.unwrapObservable valueAccessor()
    id = $(element).attr 'id'
    selector = "##{id}"
    context.destroy selector
    context.attach selector, menuItems