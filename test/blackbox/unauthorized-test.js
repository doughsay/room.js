const { playingTest } = require('../helpers/test-server')

playingTest('room.js: as a player, search for a verb or function', (t, { server, socket, end }) => {
  socket.emit('search', 'ech', (response) => {
    const expected = 'unauthorized'
    const actual = response

    t.deepEqual(actual, expected)
    end()
  })
})

playingTest('room.js: as a player, get a verb', (t, { server, socket, end }) => {
  const objectId = 'root'
  const name = 'echo'
  socket.emit('get-verb', { objectId, name }, (response) => {
    const expected = 'unauthorized'
    const actual = response

    t.deepEqual(actual, expected)
    end()
  })
})

playingTest('room.js: as a player, get a function', (t, { server, socket, end }) => {
  const objectId = 'root'
  const name = 'greet'
  socket.emit('get-function', { objectId, name }, (response) => {
    const expected = 'unauthorized'
    const actual = response

    t.deepEqual(actual, expected)
    end()
  })
})

playingTest('room.js: as a player, get a text', (t, { server, socket, end }) => {
  const objectId = 'root'
  const name = 'greet'
  socket.emit('get-text', { objectId, name }, (response) => {
    const expected = 'unauthorized'
    const actual = response

    t.deepEqual(actual, expected)
    end()
  })
})

playingTest('room.js: as a player, save a verb', (t, { server, socket, end }) => {
  const input = { objectId: 'root', verb: { code: 'function echo({ player, dobj, iobj, verbstr, argstr, dobjstr, prepstr, iobjstr }) {\n  player.send(argstr)\n}\n', dobjarg: 'any', iobjarg: 'any', name: 'echo', pattern: 'echo', preparg: 'any', verb: true } }
  socket.emit('save-verb', input, (response) => {
    const expected = 'unauthorized'
    const actual = response

    t.deepEqual(actual, expected)
    end()
  })
})

playingTest('room.js: as a player, save a function', (t, { server, socket, end }) => {
  const input = { objectId: 'root', name: 'greet', src: 'function greet(player) { player.send("Hi!") }' }
  socket.emit('save-function', input, (response) => {
    const expected = 'unauthorized'
    const actual = response

    t.deepEqual(actual, expected)
    end()
  })
})

playingTest('room.js: as a player, save a text', (t, { server, socket, end }) => {
  const input = { objectId: 'root', name: 'greet', src: 'long text string' }
  socket.emit('save-text', input, (response) => {
    const expected = 'unauthorized'
    const actual = response

    t.deepEqual(actual, expected)
    end()
  })
})
