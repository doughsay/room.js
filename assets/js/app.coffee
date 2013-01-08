#= require jquery
#= require jquery-ui
#= require jquery-layout
#= require bootstrap
#= require knockout
#= require codemirror
#= require codemirror_modes/javascript
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

  # the details of the currently loaded object
  loadedObject: ko.observable null

  # construct the view model
  constructor: (@body, @screen, @input) ->
    @socket = io.connect()
    @attachListeners()
    @setLayout()
    @setSizes()
    @focusInput()

    # sign in as root for now for convenience
    @socket.emit 'form_input_login', formData: {username: 'root', password: 'p@ssw0rd'}

  # attach the websocket event listeners
  attachListeners: ->
    @socket.on 'connect', @connect
    @socket.on 'connecting', @connecting
    @socket.on 'disconnect', @disconnect
    @socket.on 'connect_failed', @connect_failed
    @socket.on 'error', @error
    @socket.on 'reconnect_failed', @reconnect_failed
    @socket.on 'reconnect', @reconnect
    @socket.on 'reconnecting', @reconnecting

    @socket.on 'output', @output
    @socket.on 'requestFormInput', @requestFormInput
    @socket.on 'activate_editor', @showObjectList
    @socket.on 'deactivate_editor', @hideObjectList

  # build the jqeury ui layout
  # this is only used when signed in as a programmer
  # the panes are hidden by default
  setLayout: ->
    @layout = @body.layout
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
            onresize: => @setCodeMirrorSize()
          center:
            paneSelector: '.ui-layout-inner-center'
            onresize: => @setSizes()

  # apply proper sizes to the input and the screen div
  setSizes: ->
    inputWidthDiff = @input.outerWidth() - @input.width()
    @input.width($('.ui-layout-inner-center').width() - inputWidthDiff)
    @screen.height($('.ui-layout-inner-center').height() - @input.outerHeight())

  # if a codemirror editor is present, resize it when the north pane is resized
  setCodeMirrorSize: ->
    $('.CodeMirror').height $('.ui-layout-inner-north').height()

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

  # return a loader function for knockout
  load_object: (id) ->
    # load the details of an object from the server
    =>
      @socket.emit 'object_details', id, (details) =>
        @loadedObject details

  edit_name: ->
    console.log 'edit name'

  edit_aliases: ->
    console.log 'edit aliases'

  edit_property: (property) ->
    =>
      console.log 'edit property:', property

  edit_verb: (verb) ->
    =>
      console.log 'edit verb:', verb

  # show the moo objects list
  showObjectList: =>
    @refresh_objects()
    @layout.show 'west'

  # hide the moo objects list
  hideObjectList: => @layout.hide 'west'

  # websocket event listeners:

  connect: =>
    @addLine c 'Connected!', 'bold green'

  connecting: =>
    @addLine c "Connecting...", 'gray'

  disconnect: =>
    @hideObjectList()
    @addLine c 'Disconnected from server.', 'bold red'

  connect_failed: =>
    @addLine c 'Connection to server failed.', 'bold red'

  error: =>
    @addLine c 'An unknown error occurred.', 'bold red'

  reconnect_failed: =>
    @addLine c 'Unable to reconnect to server.', 'bold red'

  reconnect: =>
  #  @addLine c 'Reconnected!', 'bold green'

  reconnecting: =>
    @addLine c "Attempting to reconnect...", 'gray'

  # output event
  # adds a line of output to the screen
  output: (data) =>
    @addLine data.msg

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