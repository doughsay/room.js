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

  addLine: (line) ->
    @lines.push line
    if @lines().length > @maxLines()
      @lines.shift()
    scrollToBottom()

  command: ko.observable ""

  sendCommand: ->
    if @command()
      socket.emit 'chat', {msg: @command()}
      @command ""

moo = new Moo
moo.addLine "connecting..."

socket.on 'chat', (data) ->
  moo.addLine data.msg

$ ->
  setLayout()
  ko.applyBindings moo