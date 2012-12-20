socket = io.connect 'http://localhost'

setLayout = ->
  $('.command input').width $(window).width() - 4
  $('.screen').height $(window).height() - 27

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
  console.log data
  moo.addLine data.name, data.msg

$ ->
  setLayout()
  ko.applyBindings moo