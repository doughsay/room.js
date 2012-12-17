socket = io.connect 'http://localhost'

setLayout = ->
  $('.screen').css
    height: "#{$(window).height()-25}px"

scrollToBottom = ->
  $('.screen').scrollTop($('.screen')[0].scrollHeight);

$(window).resize setLayout

class Moo

  lines: ko.observableArray []

  addLine: (name, line) ->
    @lines.push
      name: name
      line: line
    scrollToBottom()

  command: ko.observable ""

  sendCommand: ->
    socket.emit 'chat', {msg: @command()}
    @command ""

moo = new Moo
moo.addLine "<span class='cyan'>system</span>", "connecting..."

socket.on 'chat', (data) ->
  moo.addLine data.name, data.msg

$ ->
  setLayout()
  ko.applyBindings moo