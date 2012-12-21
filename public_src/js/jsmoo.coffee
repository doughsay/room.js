socket = io.connect 'http://localhost'

setLayout = ->
  input = $ '.command input'
  inputWidthDiff = input.outerWidth() - input.width()
  input.width $(window).width() - inputWidthDiff
  $('.screen').height $(window).height() - input.outerHeight()

scrollToBottom = ->
  $('.screen').scrollTop($('.screen')[0].scrollHeight);

$(window).resize setLayout

class Moo

  lines: ko.observableArray []
  maxLines: ko.observable 1000

  history: []
  maxHistory: ko.observable 1000
  currentHistory: -1

  addLine: (line) ->
    @lines.push line
    if @lines().length > @maxLines()
      @lines.shift()
    scrollToBottom()

  command: ko.observable ""

  sendCommand: ->
    c = @command()
    if c
      @history.unshift c
      if @history.length > @maxHistory()
        @history.pop()
      @currentHistory = -1
      socket.emit 'chat', {msg: c}
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

moo = new Moo
moo.addLine "connecting..."

socket.on 'chat', (data) ->
  moo.addLine data.msg

$ ->
  setLayout()
  ko.applyBindings moo