const stripAnsi = require('strip-ansi')
const { programmerTest } = require('../helpers/test-server')

programmerTest('room.js: as a programmer, eval code', (t, { server, socket, end }) => {
  socket.emit('input', 'eval 2 + 2')

  socket.once('output', (msg) => {
    const expected = '4'
    const actual = stripAnsi(msg)

    t.equal(actual, expected)
    end()
  })
})

programmerTest('room.js: as a programmer, list all objects', (t, { server, socket, end }) => {
  socket.emit('input', 'eval all()')

  socket.once('output', (msg) => {
    const expected = '[ [object root],\n  [object test] ]'
    const actual = stripAnsi(msg)

    t.equal(actual, expected)
    end()
  })
})

programmerTest('room.js: as a programmer, list all players', (t, { server, socket, end }) => {
  socket.emit('input', 'eval allPlayers()')

  socket.once('output', (msg) => {
    const expected = '[ [object test] ]'
    const actual = stripAnsi(msg)

    t.equal(actual, expected)
    end()
  })
})

programmerTest('room.js: as a programmer, find object using $', (t, { server, socket, end }) => {
  socket.emit('input', 'eval $("root")')

  socket.once('output', (msg) => {
    const expected = '{ id: \'root\',\n  name: \'root\',\n  aliases: [],\n  traits: [],\n  location: null,\n  contents: [],\n  greet: [Function],\n  echo: [Verb echo(any, any, any)] }'
    const actual = stripAnsi(msg)

    t.equal(actual, expected)
    end()
  })
})

programmerTest('room.js: as a programmer, use nextId helper', (t, { server, socket, end }) => {
  socket.emit('input', 'eval nextId("root")')

  socket.once('output', (msg) => {
    const expected = '\'root1\''
    const actual = stripAnsi(msg)

    t.equal(actual, expected)
    end()
  })
})

programmerTest('room.js: as a programmer, use run.in', (t, { server, socket, end }) => {
  socket.emit('input', 'eval run.in(() => {players.test.send("hello!")}, 10)')

  socket.once('output', (msg) => {
    const expected = /'[0-9a-zA-Z]+'/
    const actual = stripAnsi(msg)

    t.ok(expected.test(actual))
    end()
  })
})

programmerTest('room.js: as a programmer, use run.next', (t, { server, socket, end }) => {
  socket.emit('input', 'eval run.next(() => {players.test.send("hello!")})')

  socket.once('output', (msg) => {
    const expected = /'[0-9a-zA-Z]+'/
    const actual = stripAnsi(msg)

    t.ok(expected.test(actual))
    end()
  })
})

// TODO: this hangs the test runner
// programmerTest('room.js: as a programmer, use run.every', (t, { server, socket, end }) => {
//   socket.emit('input', 'eval run.every(() => {players.test.send("hello!")}, 10)')

//   socket.once('output', (msg) => {
//     const expected = /'[0-9a-zA-Z]+'/
//     const actual = stripAnsi(msg)

//     t.ok(expected.test(actual))
//     socket.emit('input', `eval run.cancel(${actual})`)
//     end()
//   })
// })

programmerTest('room.js: as a programmer, use run.cancel', (t, { server, socket, end }) => {
  socket.emit('input', 'eval run.cancel("foo")')

  socket.once('output', (msg) => {
    const expected = 'false'
    const actual = stripAnsi(msg)

    t.equal(actual, expected)
    end()
  })
})

programmerTest('room.js: as a programmer, use run.check', (t, { server, socket, end }) => {
  socket.emit('input', 'eval run.check("bogus")')

  socket.once('output', (msg) => {
    const expected = 'false'
    const actual = stripAnsi(msg)

    t.equal(actual, expected)
    end()
  })
})

programmerTest('room.js: as a programmer, use run.list', (t, { server, socket, end }) => {
  socket.emit('input', 'eval run.list()')

  socket.once('output', (msg) => {
    const expected = '[]'
    const actual = stripAnsi(msg)

    t.equal(actual, expected)
    end()
  })
})

programmerTest('room.js: as a programmer, inspect an object', (t, { server, socket, end }) => {
  socket.emit('input', 'eval root')

  socket.once('output', (msg) => {
    const expected = '{ id: \'root\',\n  name: \'root\',\n  aliases: [],\n  traits: [],\n  location: null,\n  contents: [],\n  greet: [Function],\n  echo: [Verb echo(any, any, any)] }'
    const actual = stripAnsi(msg)

    t.equal(actual, expected)
    end()
  })
})

programmerTest('room.js: as a programmer, call a function', (t, { server, socket, end }) => {
  socket.emit('input', 'eval root.greet(this)')

  socket.once('output', (msg) => {
    const expected = 'Hello, test!'
    const actual = stripAnsi(msg)

    t.equal(actual, expected)
    end()
  })
})

programmerTest('room.js: as a programmer, eval code that throws an error', (t, { server, socket, end }) => {
  socket.emit('input', 'eval asdf')

  socket.once('output', (msg) => {
    const expected = /ReferenceError: asdf is not defined/
    const actual = stripAnsi(msg)

    t.ok(expected.test(actual))
    end()
  })
})
