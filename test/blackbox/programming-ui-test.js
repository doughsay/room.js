const { programmerTest } = require('../helpers/test-server')

programmerTest('room.js: as a programmer, search for a verb', (t, { server, socket, end }) => {
  socket.emit('search', 'ech', (response) => {
    const expected = [ { objectId: 'root', searchStr: 'root.echo', verb: 'echo' } ]
    const actual = response

    t.deepEqual(actual, expected)
    end()
  })
})

programmerTest('room.js: as a programmer, search for a function', (t, { server, socket, end }) => {
  socket.emit('search', 'gree', (response) => {
    const expected = [ { objectId: 'root', searchStr: 'root.greet', function: 'greet' } ]
    const actual = response

    t.deepEqual(actual, expected)
    end()
  })
})

programmerTest('room.js: as a programmer, get a verb', (t, { server, socket, end }) => {
  const objectId = 'root'
  const name = 'echo'
  socket.emit('get-verb', { objectId, name }, (response) => {
    const expected = { objectId: 'root', verb: { code: 'function echo({ player, dobj, iobj, verbstr, argstr, dobjstr, prepstr, iobjstr }) {\n  player.send(argstr)\n}\n', dobjarg: 'any', iobjarg: 'any', name: 'echo', pattern: 'echo', preparg: 'any', verb: true } }
    const actual = response

    t.deepEqual(actual, expected)
    end()
  })
})

programmerTest('room.js: as a programmer, get a verb; non-existent object', (t, { server, socket, end }) => {
  const objectId = 'nope'
  const name = 'nope'
  socket.emit('get-verb', { objectId, name }, (response) => {
    const expected = null
    const actual = response

    t.equal(actual, expected)
    end()
  })
})

programmerTest('room.js: as a programmer, get a verb; non-existent verb', (t, { server, socket, end }) => {
  const objectId = 'root'
  const name = 'nope'
  socket.emit('get-verb', { objectId, name }, (response) => {
    const expected = null
    const actual = response

    t.equal(actual, expected)
    end()
  })
})

programmerTest('room.js: as a programmer, get a function', (t, { server, socket, end }) => {
  const objectId = 'root'
  const name = 'greet'
  socket.emit('get-function', { objectId, name }, (response) => {
    t.equal(response.name, 'greet')
    t.equal(response.objectId, 'root')
    t.ok(/function greet/.test(response.src))
    end()
  })
})

programmerTest('room.js: as a programmer, get a function; non-existent object', (t, { server, socket, end }) => {
  const objectId = 'nope'
  const name = 'nope'
  socket.emit('get-function', { objectId, name }, (response) => {
    const expected = null
    const actual = response

    t.equal(actual, expected)
    end()
  })
})

programmerTest('room.js: as a programmer, get a function; non-existent function', (t, { server, socket, end }) => {
  const objectId = 'root'
  const name = 'nope'
  socket.emit('get-function', { objectId, name }, (response) => {
    const expected = null
    const actual = response

    t.equal(actual, expected)
    end()
  })
})

programmerTest('room.js: as a programmer, get a text', (t, { server, socket, end }) => {
  const objectId = 'root'
  const name = 'desc'
  socket.emit('get-text', { objectId, name }, (response) => {
    t.equal(response.name, 'desc')
    t.equal(response.objectId, 'root')
    t.equal(response.src, 'long text string')
    end()
  })
})

programmerTest('room.js: as a programmer, get an empty', (t, { server, socket, end }) => {
  const objectId = 'root'
  const name = 'empty'
  socket.emit('get-text', { objectId, name }, (response) => {
    t.equal(response.name, 'empty')
    t.equal(response.objectId, 'root')
    t.equal(response.src, '')
    end()
  })
})

programmerTest('room.js: as a programmer, get a text; non-existent object', (t, { server, socket, end }) => {
  const objectId = 'nope'
  const name = 'nope'
  socket.emit('get-text', { objectId, name }, (response) => {
    const expected = null
    const actual = response

    t.equal(actual, expected)
    end()
  })
})

programmerTest('room.js: as a programmer, get a text; non-existent text', (t, { server, socket, end }) => {
  const objectId = 'root'
  const name = 'nope'
  socket.emit('get-text', { objectId, name }, (response) => {
    const expected = null
    const actual = response

    t.equal(actual, expected)
    end()
  })
})

programmerTest('room.js: as a programmer, save a verb', (t, { server, socket, end }) => {
  const input = { objectId: 'root', verb: { code: 'function echo({ player, dobj, iobj, verbstr, argstr, dobjstr, prepstr, iobjstr }) {\n  player.send(argstr)\n}\n', dobjarg: 'any', iobjarg: 'any', name: 'echo', pattern: 'echo', preparg: 'any', verb: true } }
  socket.emit('save-verb', input, (response) => {
    const expected = 'saved'
    const actual = response

    t.deepEqual(actual, expected)
    end()
  })
})

programmerTest('room.js: as a programmer, save a verb; non-existent object', (t, { server, socket, end }) => {
  const input = { objectId: 'nope', verb: { code: 'function echo({ player, dobj, iobj, verbstr, argstr, dobjstr, prepstr, iobjstr }) {\n  player.send(argstr)\n}\n', dobjarg: 'any', iobjarg: 'any', name: 'echo', pattern: 'echo', preparg: 'any', verb: true } }
  socket.emit('save-verb', input, (response) => {
    const expected = 'no such object'
    const actual = response

    t.deepEqual(actual, expected)
    end()
  })
})

programmerTest('room.js: as a programmer, save a function', (t, { server, socket, end }) => {
  const input = { objectId: 'root', name: 'greet', src: 'function greet(player) { player.send("Hi!") }' }
  socket.emit('save-function', input, (response) => {
    const expected = 'saved'
    const actual = response

    t.deepEqual(actual, expected)
    end()
  })
})

programmerTest('room.js: as a programmer, save a function; non-existent object', (t, { server, socket, end }) => {
  const input = { objectId: 'nope', name: 'greet', src: 'function greet(player) { player.send("Hi!") }' }
  socket.emit('save-function', input, (response) => {
    const expected = 'no such object'
    const actual = response

    t.deepEqual(actual, expected)
    end()
  })
})

programmerTest('room.js: as a programmer, save a text', (t, { server, socket, end }) => {
  const input = { objectId: 'root', name: 'desc', src: 'long text string' }
  socket.emit('save-text', input, (response) => {
    const expected = 'saved'
    const actual = response

    t.deepEqual(actual, expected)
    end()
  })
})

programmerTest('room.js: as a programmer, save a text; non-existent object', (t, { server, socket, end }) => {
  const input = { objectId: 'nope', name: 'desc', src: 'long text string' }
  socket.emit('save-text', input, (response) => {
    const expected = 'no such object'
    const actual = response

    t.deepEqual(actual, expected)
    end()
  })
})
