const test = require('tape')
const stripAnsi = require('strip-ansi')
const SocketController = require('../../src/controllers/socket-controller')

function loggerFactory () {
  return {
    child () { return this },
    debug () {}
  }
}

function socketFactory (id = '1234') {
  return {
    events: [],
    id: id,
    on () {},
    emit (event, msg) { this.events.push([event, stripAnsi(msg)]) },
    lastEvent () { return this.events[this.events.length - 1] }
  }
}

test('SocketController: can be initialized', t => {
  const controller = new SocketController(socketFactory(), null, null, null, null, loggerFactory())

  t.ok(controller)
  t.end()
})

test('SocketController: emits a welcome message when a socket connects', t => {
  const socket = socketFactory()
  const controller = new SocketController(socket, null, null, null, null, loggerFactory())

  controller.onConnection()

  const expected = [
    'output',
    'Welcome to room.js!\nType help for a list of available commands.'
  ]

  t.deepEqual(socket.lastEvent(), expected)
  t.end()
})
