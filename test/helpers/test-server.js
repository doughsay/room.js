process.env.NODE_ENV = 'test'

const bunyan = require('bunyan')
const test = require('tape')
const stripAnsi = require('strip-ansi')
const io = require('socket.io-client')

const RoomJSServer = require('../../src/lib/room-js-server')

const testPort = 8889
const socketURL = `http://localhost:${testPort}`
const options = {
  transports: ['websocket'],
  forceNew: true
}

function testLogger () {
  return bunyan.createLogger({ name: 'test', streams: [] })
}

function testConfig () {
  return {
    worldDirectory: 'test-state/world',
    userDbFile: 'test-state/users.json',
    maintenance: false,
    port: testPort,
    version: 'test'
  }
}

function testServer () {
  const server = new RoomJSServer(testLogger(), testConfig())

  const root = insertRoot(server)
  addGreetFuntion(root)
  addEchoVerb(root, server.world)

  return server
}

function setupTimeout (t, timeout = 500) {
  const teardownCbs = []
  const teardown = () => { teardownCbs.forEach(cb => { cb() }) }
  const fail = () => { teardown(); t.fail(); t.end() }
  const failTimeout = setTimeout(() => { fail() }, timeout)
  const end = () => { clearTimeout(failTimeout); teardown(); t.end() }
  const onTeardown = (cb) => { teardownCbs.push(cb) }

  return [end, onTeardown]
}

function insertRoot (server) {
  const root = {
    id: 'root',
    name: 'root',
    aliases: [],
    traitIds: [],
    locationId: null,
    properties: {}
  }

  server.db.insert(root)
  return server.world.insert(root)
}

function addGreetFuntion (object) {
  object.greet = function greet (player) { player.send(`Hello, ${player.name}!`) }
}

function addEchoVerb (object, world) {
  const [name, pattern, dobjarg, preparg, iobjarg] = ['echo', 'echo', 'any', 'any', 'any']
  const source = [
    `function ${name}`,
    '({ player, dobj, iobj, verbstr, argstr, dobjstr, prepstr, iobjstr }) ',
    '{\n  player.send(argstr)\n}\n'
  ].join('')
  object.echo = world.deserializer.deserialize({
    verb: true, source, pattern, dobjarg, preparg, iobjarg
  })
}

function insertTestUser (server, id = 'test') {
  server.userDb.insert({
    id, password: 'jAVsDRvHKWu9::v1vJ+yNnKyuHTv4nKLjwECWl/J5IhpUmWHTQ3OI9::30::10000' // "test"
  })
}

function insertTestPlayer (server, id = 'test', userId = id, programmer = false) {
  const newPlayerObj = {
    id: id,
    name: id,
    aliases: [],
    traitIds: [ 'root' ],
    locationId: null,
    userId: userId,
    properties: {
      programmer: { value: programmer }
    }
  }

  server.db.insert(newPlayerObj)
  server.world.insert(newPlayerObj)
}

function insertTestProgrammer (server, id = 'test', userId = id) {
  insertTestPlayer(server, id, userId, true)
}

function serverTest (description, run) {
  test(description, t => {
    const [end, onTeardown] = setupTimeout(t)

    const server = testServer()
    onTeardown(() => {
      server.userDb.clear()
      server.db.clear()
      server.close()
    })

    server.start()
    server.on('ready', () => {
      const socket = io(socketURL, options)
      onTeardown(() => { socket.disconnect() })

      socket.once('output', (msg) => {
        const expected = 'Welcome to room.js!\nType help for a list of available commands.'
        const actual = stripAnsi(msg)

        t.equal(actual, expected)

        run(t, { server, socket, end })
      })
    })
  })
}

const unauthenticatedTest = serverTest

function authenticatedTest (description, run) {
  serverTest(description, (t, { server, socket, end }) => {
    insertTestUser(server)

    socket.emit('input', 'login')

    socket.once('request-input', (_, send) => {
      send({ username: 'test', password: 'test' })

      socket.once('output', () => {
        run(t, { server, socket, end })
      })
    })
  })
}

function playingTest (description, run) {
  authenticatedTest(description, (t, { server, socket, end }) => {
    insertTestPlayer(server)

    socket.emit('input', 'play')

    socket.once('output', () => {
      run(t, { server, socket, end })
    })
  })
}

function programmerTest (description, run) {
  authenticatedTest(description, (t, { server, socket, end }) => {
    insertTestProgrammer(server)

    socket.emit('input', 'play')

    socket.once('output', () => {
      run(t, { server, socket, end })
    })
  })
}

module.exports = { unauthenticatedTest, authenticatedTest, playingTest, programmerTest, insertTestUser, insertTestPlayer }
