ko.bindingHandlers.context =
  init: (element, valueAccessor) ->

    mkLi = (text, action) ->
      $("<li><a tabindex='-1' href='#'>#{text}</a></li>").on 'click', (e) ->
        e.preventDefault()
        action()

    mkUl = (x, y, lis) ->
      ul = $('<ul class="dropdown-menu open"></ul>')
      ul.append li for li in lis
      ul.css {top: y, left: x}

    handleClick = (e) ->
      $('.dropdown-menu').remove()
      e.preventDefault()
      e.stopPropagation()

      [x,y] = [e.pageX, e.pageY]

      menu = valueAccessor()()
      if menu?
        $('body').append mkUl x, y, menu.map (item) -> mkLi item.text, item.action
        $('body').one 'click', (e) -> $('.dropdown-menu').remove()

    $(element).on 'contextmenu', handleClick

    ko.utils.domNodeDisposal.addDisposeCallback element, ->
      $(element).off 'contextmenu', handleClick