process.env.NODE_ENV = 'test'

const bunyan = require('bunyan')
const test = require('tape')
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
  return new RoomJSServer(testLogger(), testConfig())
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

function insertTestUser (server, id = 'test') {
  server.userDb.insert({
    id, password: 'jAVsDRvHKWu9::v1vJ+yNnKyuHTv4nKLjwECWl/J5IhpUmWHTQ3OI9::30::10000' // "test"
  })
}

function insertTestPlayer (server, id = 'test') {
  const newPlayerObj = {
    id: id,
    name: id,
    aliases: [],
    traitIds: [],
    locationId: null,
    userId: id,
    properties: {
      programmer: { value: true }
    }
  }

  server.db.insert(newPlayerObj)
  server.world.insert(newPlayerObj)
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

      run(t, { server, socket, end })
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

module.exports = { unauthenticatedTest, authenticatedTest, playingTest, insertTestUser, insertTestPlayer }
