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

authenticatedTest('room.js: as an authenticated user, create player; invalid name', (t, { server, socket, end }) => {
  socket.emit('input', 'create')

  socket.once('request-input', (inputs, send) => {
    const expectedInputs = [ { label: 'player name', name: 'playerName', type: 'text' } ]

    t.deepEqual(inputs, expectedInputs)

    send({ playerName: '!!!' })

    socket.once('output', (msg) => {
      const expected = 'Sorry, that name is invalid.'
      const actual = stripAnsi(msg)

      t.equal(actual, expected)
      end()
    })
  })
})

authenticatedTest('room.js: as an authenticated user, create player; existing name', (t, { server, socket, end }) => {
  insertTestPlayer(server)
  socket.emit('input', 'create')

  socket.once('request-input', (inputs, send) => {
    const expectedInputs = [ { label: 'player name', name: 'playerName', type: 'text' } ]

    t.deepEqual(inputs, expectedInputs)

    send({ playerName: 'test' })

    socket.once('output', (msg) => {
      const expected = 'Sorry, a character by that name already exists.'
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

authenticatedTest('room.js: as an authenticated user, play without any character', (t, { server, socket, end }) => {
  socket.emit('input', 'play')

  socket.once('output', (msg) => {
    const expected = 'You have no characters to play as. Create one first with create.'
    const actual = stripAnsi(msg)

    t.equal(actual, expected)
    end()
  })
})

authenticatedTest('room.js: as an authenticated user, play w/ multiple characters to pick from', (t, { server, socket, end }) => {
  insertTestPlayer(server)
  insertTestPlayer(server, 'bob', 'test')

  socket.emit('input', 'play')

  socket.once('output', (msg) => {
    const expected = 'Choose a character to play as:\n1. #cmd[test]\n2. #cmd[bob]'
    const actual = msg

    t.equal(actual, expected)

    socket.once('request-input', (inputs, send) => {
      const expectedInputs = [ { type: 'text', label: 'character', name: 'selection' } ]

      t.deepEqual(inputs, expectedInputs)

      send({ selection: '1' })

      socket.once('output', (msg) => {
        const expected = 'Now playing as test'
        const actual = msg

        t.equal(actual, expected)
        end()
      })
    })
  })
})

authenticatedTest('room.js: as an authenticated user, play w/ multiple characters to pick from; picking by name', (t, { server, socket, end }) => {
  insertTestPlayer(server)
  insertTestPlayer(server, 'bob', 'test')

  socket.emit('input', 'play')

  socket.once('output', (msg) => {
    const expected = 'Choose a character to play as:\n1. #cmd[test]\n2. #cmd[bob]'
    const actual = msg

    t.equal(actual, expected)

    socket.once('request-input', (inputs, send) => {
      const expectedInputs = [ { type: 'text', label: 'character', name: 'selection' } ]

      t.deepEqual(inputs, expectedInputs)

      send({ selection: 'test' })

      socket.once('output', (msg) => {
        const expected = 'Now playing as test'
        const actual = msg

        t.equal(actual, expected)
        end()
      })
    })
  })
})

authenticatedTest('room.js: as an authenticated user, play w/ multiple characters to pick from; invalid selection', (t, { server, socket, end }) => {
  insertTestPlayer(server)
  insertTestPlayer(server, 'bob', 'test')

  socket.emit('input', 'play')

  socket.once('output', (msg) => {
    const expected = 'Choose a character to play as:\n1. #cmd[test]\n2. #cmd[bob]'
    const actual = msg

    t.equal(actual, expected)

    socket.once('request-input', (inputs, send) => {
      const expectedInputs = [ { type: 'text', label: 'character', name: 'selection' } ]

      t.deepEqual(inputs, expectedInputs)

      send({ selection: 'bad' })

      socket.once('output', (msg) => {
        const expected = 'Invalid selection.'
        const actual = stripAnsi(msg)

        t.equal(actual, expected)
        end()
      })
    })
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
