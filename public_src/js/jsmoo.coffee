class MooViewModel

  lines: ko.observableArray []
  maxLines: ko.observable 1000

  history: []
  maxHistory: ko.observable 1000
  currentHistory: -1

  command: ko.observable ""

  socket: null

  constructor: ->
    address = location.href
    @socket = io.connect address

    @addLine "websocket connecting to #{address}"

    $(window).resize @setLayout
    @setLayout()

    $('.screen').click ->
      $('.command input').focus()
    $('.command input').focus()

    @socket.on 'output', (data) =>
      @addLine data.msg

    @socket.on 'disconnect', =>
      @addLine 'Disconnected from server.  Attemping to reconnect...'

    @socket.on 'requestFormInput', (data) =>
      Avgrund.show "#default-popup"
      $('.command input').blur()

  setLayout: ->
    input = $ '.command input'
    inputWidthDiff = input.outerWidth() - input.width()
    input.width $(window).width() - inputWidthDiff
    $('.screen').height $(window).height() - input.outerHeight()

  scrollToBottom: ->
    $('.screen').scrollTop($('.screen')[0].scrollHeight);

  addLine: (line) ->
    @lines.push line
    if @lines().length > @maxLines()
      @lines.shift()
    @scrollToBottom()

  sendCommand: ->
    c = @command()
    if c
      @history.unshift c
      if @history.length > @maxHistory()
        @history.pop()
      @currentHistory = -1
      @socket.emit 'input', {msg: c}
      @command ""

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

$ ->
  ko.applyBindings new MooViewModel