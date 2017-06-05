const stripAnsi = require('strip-ansi')
const { authenticatedTest, insertTestPlayer } = require('../helpers/test-server')

authenticatedTest('room.js: as an authenticated user, help', (t, { server, socket, end }) => {
  socket.emit('input', 'help')

  socket.once('output', (msg) => {
    const expected = 'Available commands:\n• logout - logout of your account\n• create - create a new character\n• play   - enter the game\n• help   - show this message'
    const actual = stripAnsi(msg)

    t.equal(actual, expected)
    end()
  })
})

authenticatedTest('room.js: as an authenticated user, create player', (t, { server, socket, end }) => {
  socket.emit('input', 'create')

  socket.once('request-input', (inputs, send) => {
    const expectedInputs = [ { label: 'player name', name: 'playerName', type: 'text' } ]

    t.deepEqual(inputs, expectedInputs)

    send({ playerName: 'test' })

    socket.once('output', (msg) => {
      const expected = 'Character created! To start the game now, type play!'
      const actual = stripAnsi(msg)

      t.equal(actual, expected)
      end()
    })
  })
})

authenticatedTest('room.js: as an authenticated user, invalid command', (t, { server, socket, end }) => {
  socket.emit('input', 'invalidcommand')

  socket.once('output', (msg) => {
    const expected = 'Invalid command.'
    const actual = stripAnsi(msg)

    t.equal(actual, expected)
    end()
  })
})

authenticatedTest('room.js: as an authenticated user, play', (t, { server, socket, end }) => {
  insertTestPlayer(server)

  socket.emit('input', 'play')

  socket.once('output', (msg) => {
    const expected = 'Now playing as test'
    const actual = msg

    t.equal(actual, expected)
    end()
  })
})

authenticatedTest('room.js: as an authenticated user, logout', (t, { server, socket, end }) => {
  socket.emit('input', 'logout')

  socket.once('output', (msg) => {
    const expected = 'Bye!'
    const actual = msg

    t.equal(actual, expected)
    end()
  })
})
