const stripAnsi = require('strip-ansi')
const { playingTest } = require('../helpers/test-server')

playingTest('room.js: as player, send an unknown command', (t, { server, socket, end }) => {
  socket.emit('input', 'hello, is anyone there?')

  socket.once('output', (msg) => {
    const expected = 'I didn\'t understand that.'
    const actual = stripAnsi(msg)

    t.equal(actual, expected)
    end()
  })
})

playingTest('room.js: as player, invoke a verb', (t, { server, socket, end }) => {
  socket.emit('input', 'echo hello, is anyone there?')

  socket.once('output', (msg) => {
    const expected = 'hello, is anyone there?'
    const actual = stripAnsi(msg)

    t.equal(actual, expected)
    end()
  })
})

playingTest('room.js: as player, quit', (t, { server, socket, end }) => {
  socket.emit('input', 'quit')

  socket.once('output', (msg) => {
    const expected = 'Bye!'
    const actual = msg

    t.equal(actual, expected)
    end()
  })
})
