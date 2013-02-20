# Knockout.js view model for the room.js client
class ClientView

  # apply styles to a color marked up string using a span
  colorize = (str) ->
    str
      .replace(/\\\{/g, "!~TEMP_SWAP_LEFT~!")
      .replace(/\\\}/g, "!~TEMP_SWAP_RIGHT~!")
      .replace(/\{(.*?)\|/g, "<span class='$1'>")
      .replace(/\}/g, "</span>")
      .replace(/!~TEMP_SWAP_LEFT~!/g, "{")
      .replace(/!~TEMP_SWAP_RIGHT~!/g, "}")

  # escape any html in a string
  escapeHTML = (str) ->
    str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')

  # escape curly brackets in a string
  escapeBrackets = (str) ->
    str
      .replace(/\{/g, '\\{')
      .replace(/\}/g, '\\}')

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
    @socket = io.connect(window.location.href+'client')
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
    @input.width($('.ui-layout-center').width() - inputWidthDiff - $('.prompt').outerWidth())
    @screen.height($('.ui-layout-center').height() - @input.outerHeight() - 2)

    # if an ace editor is present, call it's resize function
    # and set sizes for all the form elements to make them look prettier
    editorDiv = $ '.ace_editor'
    if editorDiv.length != 0
      editor = ace.edit editorDiv[0]
      editor.resize()

      editor = $ '.editor'
      actions = $ '.editor .actions'
      widthToSplit = editor.width() - actions.width()
      input = editor.children 'input'
      inputWidthDiff = input.outerWidth() - input.width() + 2
      select = editor.children 'select'
      selectWidthDiff = select.outerWidth() - select.width() + 2
      label = editor.children 'label'
      labelWidthDiff = label.outerWidth() - label.width() + 2
      input.width (widthToSplit / 5) - inputWidthDiff
      select.width (widthToSplit / 5) - selectWidthDiff
      label.width (widthToSplit / 5) - labelWidthDiff

  # scroll the screen to the bottom
  scrollToBottom: ->
    @screen.scrollTop(@screen[0].scrollHeight);

  # add a line of output from the server to the screen
  addLine: (line, escape = true) ->
    line = escapeHTML line if escape
    @lines.push colorize line
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
    escapedCommand = escapeBrackets command
    if command
      @addLine "\n{gray|> #{escapedCommand}}", false
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
          @socket.emit 'input', escapedCommand
      @command ""

  # simple client-side commands
  clientCommand: (command) ->
    if command == 'clear'
      @lines []
      true
    else if command == 'toasty!'
      toasty()
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
    @addLine '{bold green|Connected!}'

  connecting: =>
    @addLine '{gray|Connecting...}'

  disconnect: =>
    @addLine '{bold red|Disconnected from server.}'
    @loadedVerb null
    @form null

  connect_failed: =>
    @addLine '{bold red|Connection to server failed.}'

  error: =>
    @addLine '{bold red|An unknown error occurred.}'

  reconnect_failed: =>
    @addLine '{bold red|Unable to reconnect to server.}'

  reconnect: =>
  #  @addLine '{bold green|Reconnected!}'

  reconnecting: =>
    @addLine '{gray|Attempting to reconnect...}'

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