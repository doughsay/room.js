#= require js/jquery-ui-1.9.2.custom.min
#= require js/jquery.layout.min
#= require js/knockout

c = (str, styles) ->
  "<span class='#{styles}'>#{str}</span>"

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

    @addLine c "websocket connecting to #{address}", 'grey'

    @body = $('body')
    @screen = $('.screen')
    @input = $('.command input')

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
            onresize: @setSizes

    @setSizes()

    @screen.click =>
      @input.focus()
    @input.focus()

    @socket.on 'output', (data) =>
      @addLine data.msg

    @socket.on 'disconnect', =>
      @addLine c 'Disconnected from server.  Attemping to reconnect...', 'bold red'

    @socket.on 'requestFormInput', (data) =>
      console.log "form input requested!"

  setSizes: ->
    input = $('.command input')
    inputWidthDiff = input.outerWidth() - input.width()
    input.width($('.ui-layout-inner-center').width() - inputWidthDiff)
    $('.screen').height($('.ui-layout-inner-center').height() - input.outerHeight())

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
      else
        true

$ ->
  ko.applyBindings new MooViewModel