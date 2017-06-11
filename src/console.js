const repl = require('repl')
const bunyan = require('bunyan')

const config = require('./config')
const RoomJSServer = require('./lib/room-js-server')

const { appName, logLevel } = config
const logger = bunyan.createLogger({ name: appName, level: logLevel })

const server = new RoomJSServer(logger, config)

const local = repl.start('room.js > ')

for (const id in server.world.context) {
  local.context[id] = server.world.context[id]
}

local.on('exit', () => {
  process.exit()
})
