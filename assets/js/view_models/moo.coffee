class MooView

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

  loadedVerb: ko.observable null

  form: ko.observable null

  inputCallback: null

  # construct the view model
  constructor: (@body, @screen, @input) ->
    @socket = io.connect()
    @attachListeners()
    @setLayout()
    @setSizes()
    @focusInput()

    @loadedVerb.subscribe @verb_change

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
    @socket.on 'request_form_input', @request_form_input
    @socket.on 'request_input', @request_input

    @socket.on 'edit_verb', @edit_verb

  # build the jqeury ui layout
  # this is only used when signed in as a programmer
  # the panes are hidden by default
  setLayout: ->
    @layout = @body.layout
      livePaneResizing: true
      onresize: =>
        @setSizes()
        @scrollToBottom()
      north:
        maxSize: '50%'
        minSize: 200
        slidable: false
    @layout.hide 'north'

  # apply proper sizes to the input and the screen div
  setSizes: ->
    inputWidthDiff = @input.outerWidth() - @input.width()
    @input.width($('.ui-layout-center').width() - inputWidthDiff)
    @screen.height($('.ui-layout-center').height() - @input.outerHeight())

    # if an ace editor is present, call it's resize function
    # and set sizes for all the form elements to make them look prettier
    editorDiv = $ '.ace_editor'
    if editorDiv.length != 0
      editor = ace.edit editorDiv[0]
      editor.resize()

      editor = $ '.editor'
      actions = $ '.editor .actions'
      widthToSplit = editor.width() - actions.width()
      input = editor.find 'input'
      inputWidthDiff = input.outerWidth() - input.width() + 2
      select = editor.find 'select'
      selectWidthDiff = select.outerWidth() - select.width() + 2
      input.width (widthToSplit / 4) - inputWidthDiff
      select.width (widthToSplit / 4) - selectWidthDiff

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
      if not @clientCommand command
        # if an input callback is waiting, send it to that, otherwise, send it to the server
        if @inputCallback?
          @inputCallback command
          @inputCallback = null
        else
          @socket.emit 'input', command
      @command ""

  # simple client-side commands
  clientCommand: (command) ->
    if command == 'clear'
      @lines []
      true
    else
      false

  # given a javascript event for the 'up' or 'down' keys
  # scroll through history and fill the input box with
  # the selected command
  recall: (_, e) ->
    return true if @history.length == 0
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

  save_verb: =>
    @socket.emit 'save_verb', @loadedVerb().serialize(), (response) =>
      if !response.error
        @loadedVerb().dirty false
        @loadedVerb().original_name = response.verb.name

  unload_verb: =>
    if @loadedVerb().dirty()
      bootbox.confirm 'Are you sure you want to unload this verb?  Your changes will be lost.', (unload) =>
        @loadedVerb null if unload
    else
      @loadedVerb null

  verb_change: (verb) =>
    if verb == null
      @layout.hide 'north'
      @focusInput()
    else
      @layout.show 'north'

  #############################
  # websocket event listeners #
  #############################

  connect: =>
    @addLine c 'Connected!', 'bold green'

  connecting: =>
    @addLine c "Connecting...", 'gray'

  disconnect: =>
    @addLine c 'Disconnected from server.', 'bold red'
    @loadedVerb null
    @form null

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
  output: (msg) =>
    @addLine msg

  # input was requested from the server.
  # the next thing the user sends has to be returned to fn
  request_input: (msg, fn) =>
    @addLine msg
    @inputCallback = fn

  # request_form_input event
  # the server has requested some form input
  # so we display a modal with a dynamically
  # constructed form
  request_form_input: (formDescriptor) =>
    @form new ModalFormView formDescriptor, @socket

  edit_verb: (verb) =>
    @loadedVerb new VerbView verb
    @setSizes()