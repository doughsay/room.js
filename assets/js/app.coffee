#= require jquery
#= require jquery-ui
#= require jquery-layout
#= require bootstrap
#= require knockout
#= require codemirror
#= require compiled_templates

class MooViewModel

  # apply styles to a string using a span
  c = (str, styles) ->
    "<span class='#{styles}'>#{str}</span>"

  lines: ko.observableArray []
  maxLines: ko.observable 1000

  history: []
  currentHistory: -1
  maxHistory: ko.observable 1000

  command: ko.observable ""

  socket: null

  # list of moo objects; used when signed in as a programmer
  objects: ko.observableArray []

  # construct the view model
  constructor: (@body, @screen, @input) ->
    @connect()
    @attachListeners()
    @setLayout()
    @setSizes()
    @focusInput()

  # connect websocket to the server
  connect: ->
    address = location.href
    @socket = io.connect address
    @addLine c "websocket connecting to #{address}", 'grey'

  # attach the websocket event listeners
  attachListeners: ->
    @socket.on 'output', @output
    @socket.on 'disconnect', @disconnect
    @socket.on 'requestFormInput', @requestFormInput
    @socket.on 'list_output', @listOutput

  # build the jqeury ui layout
  # this is only used when signed in as a programmer
  # the panes are hidden by default
  setLayout: ->
    @body.layout
      livePaneResizing: true
      west:
        maxSize: '50%'
        minSize: 100
        slidable: false
        initHidden: true
      center:
        childOptions:
          livePaneResizing: true
          north:
            paneSelector: '.ui-layout-inner-north'
            maxSize: '50%'
            minSize: 200
            slidable: false
            initHidden: true
          center:
            paneSelector: '.ui-layout-inner-center'
            onresize: => @setSizes()

  # apply proper sizes to the input and the screen div
  setSizes: ->
    inputWidthDiff = @input.outerWidth() - @input.width()
    @input.width($('.ui-layout-inner-center').width() - inputWidthDiff)
    @screen.height($('.ui-layout-inner-center').height() - @input.outerHeight())

  # scroll the screen to the bottom
  scrollToBottom: ->
    @screen.scrollTop(@screen[0].scrollHeight);

  # add a line of output from the server to the screen
  addLine: (line) ->
    @lines.push line
    if @lines().length > @maxLines()
      @lines.shift()
    @scrollToBottom()

  # give focus to the command input element
  focusInput: ->
    @input.focus()

  # send the entered command to the server
  # and add it to the command history
  sendCommand: ->
    command = @command()
    if command
      @history.unshift command
      if @history.length > @maxHistory()
        @history.pop()
      @currentHistory = -1
      @socket.emit 'input', {msg: command}
      @command ""

  # given a javascript event for the 'up' or 'down' keys
  # scroll through history and fill the input box with
  # the selected command
  recall: (_, e) ->
    switch e.which
      when 38 # up
        if @currentHistory < @history.length - 1
          @currentHistory++
        @command @history[@currentHistory]
        # the up arrow likes to move the cursor to the beginning of the line
        # move it back!
        l = @command().length
        e.target.setSelectionRange(l,l)
      when 40 # down
        if @currentHistory > -1
          @currentHistory--
        if @currentHistory >= 0
          @command @history[@currentHistory]
        else
          @command ""
      else
        true

  # refresh the moo objects list
  refresh_objects: ->
    @socket.emit 'list_objects', format: 'list', (list) =>
      @objects list.map (o) ->
        id: o.id
        name: "##{o.id} - #{o.name}"
        load: -> # TODO
          console.log "TODO: load object for editing:", o.id

  # websocket event listeners:

  # output event
  # adds a line of output to the screen
  output: (data) =>
    @addLine data.msg

  # disconnect event
  disconnect: =>
    @addLine c 'Disconnected from server.  Attemping to reconnect...', 'bold red'

  # requestFormInput event
  # the server has requested some form input
  # so we display a modal with a dynamically
  # constructed form
  requestFormInput: (formDescriptor) =>
    # precompiled jade template from views/modal_form.jade
    modal = $ jade.templates.modal_form form: formDescriptor
    modal.modal()
    modal.on 'shown', ->
      modal.find('input').first().focus()
    modal.on 'hidden', =>
      modal.remove()
      @focusInput()
    form = modal.find('form')
    form.on 'submit', =>
      data = form.serializeArray().reduce ((o,c) -> o[c.name] = c.value; o), {}
      @socket.emit "form_input_#{formDescriptor.event}", formData: data
      modal.modal 'hide'
      false # return false to stop the form from actually submitting

# on dom ready, create the view model and apply the knockout bindings
$ ->
  ko.applyBindings new MooViewModel $('body'), $('.screen'), $('.command input')