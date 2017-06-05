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

playingTest('room.js: as a player, eval code', (t, { server, socket, end }) => {
  socket.emit('input', 'eval 2 + 2')

  socket.once('output', (msg) => {
    const expected = '4'
    const actual = stripAnsi(msg)

    t.equal(actual, expected)
    end()
  })
})

playingTest('room.js: as a player, eval code that throws an error', (t, { server, socket, end }) => {
  socket.emit('input', 'eval asdf')

  socket.once('output', (msg) => {
    const expected = /ReferenceError: asdf is not defined/
    const actual = stripAnsi(msg)

    t.ok(expected.test(actual))
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
