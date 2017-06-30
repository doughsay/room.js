const stripAnsi = require('strip-ansi')
const { unauthenticatedTest, insertTestUser } = require('../helpers/test-server')

unauthenticatedTest('room.js: as an unauthenticated user, help', (t, { server, socket, end }) => {
  socket.emit('input', 'help')

  socket.once('output', (msg) => {
    const expected = 'Available commands:\n• login  - login to an existing account\n• create - create a new account\n• help   - show this message'
    const actual = stripAnsi(msg)

    t.equal(actual, expected)
    end()
  })
})

unauthenticatedTest('room.js: as an unauthenticated user, create a user account', (t, { socket, end }) => {
  socket.emit('input', 'create')

  socket.once('request-input', (inputs, send) => {
    const expectedInputs = [
      { label: 'create username', name: 'username', type: 'text' },
      { label: 'create password', name: 'password', type: 'password' },
      { label: 'repeat password', name: 'password2', type: 'password' }
    ]

    t.deepEqual(inputs, expectedInputs)

    send({ username: 'test', password: 'test', password2: 'test' })

    socket.once('output', (msg) => {
      const expected = 'Welcome test!\nType help for a list of available commands.'
      const actual = stripAnsi(msg)

      t.equal(actual, expected)
      end()
    })
  })
})

unauthenticatedTest('room.js: as an unauthenticated user, attempt to create a user account that already exists', (t, { server, socket, end }) => {
  insertTestUser(server)

  socket.emit('input', 'create')

  socket.once('request-input', (inputs, send) => {
    send({ username: 'test', password: 'test', password2: 'test' })

    socket.once('output', (msg) => {
      const expected = 'Sorry, that username is taken.'
      const actual = stripAnsi(msg)

      t.equal(actual, expected)
      end()
    })
  })
})

unauthenticatedTest('room.js: as an unauthenticated user, attempt to create a user w/ mismatching passwords', (t, { server, socket, end }) => {
  socket.emit('input', 'create')

  socket.once('request-input', (inputs, send) => {
    send({ username: 'testbadpass', password: 'pass1', password2: 'pass2' })

    socket.once('output', (msg) => {
      const expected = 'Passwords did not match.'
      const actual = stripAnsi(msg)

      t.equal(actual, expected)
      end()
    })
  })
})

unauthenticatedTest('room.js: as an unauthenticated user, attempt to create a user, robustness check (non-string password)', (t, { server, socket, end }) => {
  socket.emit('input', 'create')

  socket.once('request-input', (inputs, send) => {
    send({ username: 'testbadpass', password: null, password2: null })

    socket.once('output', (msg) => {
      const expected = 'Invalid client response.'
      const actual = stripAnsi(msg)

      t.equal(actual, expected)
      end()
    })
  })
})

unauthenticatedTest('room.js: as an unauthenticated user, attempt to create a user, robustness check (non-string username)', (t, { server, socket, end }) => {
  socket.emit('input', 'create')

  socket.once('request-input', (inputs, send) => {
    send({ username: null, password: 'testbaduser', password2: 'testbaduser' })

    socket.once('output', (msg) => {
      const expected = 'Invalid client response.'
      const actual = stripAnsi(msg)

      t.equal(actual, expected)
      end()
    })
  })
})

unauthenticatedTest('room.js: as an unauthenticated user, attempt to create a user, robustness check (invalid reply)', (t, { server, socket, end }) => {
  socket.emit('input', 'create')

  socket.once('request-input', (inputs, send) => {
    send(1234)

    socket.once('output', (msg) => {
      const expected = 'Invalid client response.'
      const actual = stripAnsi(msg)

      t.equal(actual, expected)
      end()
    })
  })
})

unauthenticatedTest('room.js: as an unauthenticated user, login', (t, { server, socket, end }) => {
  insertTestUser(server)

  socket.emit('input', 'login')

  socket.once('request-input', (inputs, send) => {
    const expectedInputs = [
      { label: 'username', name: 'username', type: 'text' },
      { label: 'password', name: 'password', type: 'password' }
    ]

    t.deepEqual(inputs, expectedInputs)

    send({ username: 'test', password: 'test' })

    socket.once('output', (msg) => {
      const expected = 'Welcome back test!\nType help for a list of available commands.'
      const actual = stripAnsi(msg)

      t.equal(actual, expected)
      end()
    })
  })
})

unauthenticatedTest('room.js: as an unauthenticated user, login attempt w/ incorrect password', (t, { server, socket, end }) => {
  insertTestUser(server)

  socket.emit('input', 'login')

  socket.once('request-input', (_, send) => {
    send({ username: 'test', password: 'badpass' })

    socket.once('output', (msg) => {
      const expected = 'Invalid username or password.'
      const actual = stripAnsi(msg)

      t.equal(actual, expected)
      end()
    })
  })
})

unauthenticatedTest('room.js: as an unauthenticated user, login attempt for non-existent user', (t, { server, socket, end }) => {
  insertTestUser(server)

  socket.emit('input', 'login')

  socket.once('request-input', (_, send) => {
    send({ username: 'nope', password: 'badpass' })

    socket.once('output', (msg) => {
      const expected = 'Invalid username or password.'
      const actual = stripAnsi(msg)

      t.equal(actual, expected)
      end()
    })
  })
})

unauthenticatedTest('room.js: as an unauthenticated user, login attempt, robustness check (non-string password)', (t, { server, socket, end }) => {
  insertTestUser(server)

  socket.emit('input', 'login')

  socket.once('request-input', (_, send) => {
    send({ username: 'test', password: null })

    socket.once('output', (msg) => {
      const expected = 'Invalid client response.'
      const actual = stripAnsi(msg)

      t.equal(actual, expected)
      end()
    })
  })
})

unauthenticatedTest('room.js: as an unauthenticated user, login attempt, robustness check (non-string username)', (t, { server, socket, end }) => {
  insertTestUser(server)

  socket.emit('input', 'login')

  socket.once('request-input', (_, send) => {
    send({ username: null, password: 'test' })

    socket.once('output', (msg) => {
      const expected = 'Invalid client response.'
      const actual = stripAnsi(msg)

      t.equal(actual, expected)
      end()
    })
  })
})

unauthenticatedTest('room.js: as an unauthenticated user, login attempt, robustness check (invalid reply)', (t, { server, socket, end }) => {
  insertTestUser(server)

  socket.emit('input', 'login')

  socket.once('request-input', (_, send) => {
    send(1234)

    socket.once('output', (msg) => {
      const expected = 'Invalid client response.'
      const actual = stripAnsi(msg)

      t.equal(actual, expected)
      end()
    })
  })
})

unauthenticatedTest('room.js: as an unauthenticated user, invalid command', (t, { server, socket, end }) => {
  socket.emit('input', 'invalidcommand')

  socket.once('output', (msg) => {
    const expected = 'Invalid command.'
    const actual = stripAnsi(msg)

    t.equal(actual, expected)
    end()
  })
})

unauthenticatedTest('room.js: as an unauthenticated user, search for a verb or function', (t, { server, socket, end }) => {
  socket.emit('search', 'ech', (response) => {
    const expected = 'unauthorized'
    const actual = response

    t.deepEqual(actual, expected)
    end()
  })
})
