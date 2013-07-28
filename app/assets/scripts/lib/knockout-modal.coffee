# Knockout.js binding for bootstrap style modals
# applies decendant bindings and acts like "if" binding if value is falsey
# then shows the element with bootstrap modal
# a lot of this is yanked directly from knockout's own with and if binding
modalDomDataKey = '__ko_modalBindingData';
ko.bindingHandlers.modal =
  init: (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) ->
    ko.utils.domData.set(element, modalDomDataKey, {});
    return { controlsDescendantBindings: true }

  update: (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) ->
    modalData = ko.utils.domData.get(element, modalDomDataKey)
    dataValue = ko.utils.unwrapObservable(valueAccessor())
    shouldDisplay = !!dataValue
    isFirstRender = !modalData.savedNodes
    needsRefresh = isFirstRender || (shouldDisplay != modalData.didDisplayOnLastUpdate)

    if needsRefresh
      if isFirstRender
        modalData.savedNodes = ko.utils.cloneNodes(ko.virtualElements.childNodes(element), true)

      if shouldDisplay
        if !isFirstRender
          ko.virtualElements.setDomNodeChildren(element, ko.utils.cloneNodes(modalData.savedNodes))
        modal = $(element).modal(show: false)
        childContext = bindingContext.createChildContext(dataValue)
        ko.applyBindingsToDescendants(childContext, element)
        modal.modal('show')

        if dataValue.shown?
          modal.on 'shown', -> dataValue.shown.call(bindingContext, element, valueAccessor)

        if dataValue.hidden?
          modal.on 'hidden', -> dataValue.hidden.call(bindingContext, element, valueAccessor)

      else
        ko.virtualElements.emptyNode(element)
        $(element).modal('hide')

      modalData.didDisplayOnLastUpdate = shouldDisplay