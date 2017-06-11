const bunyan = require('bunyan')

const config = require('./config')
const RoomJSServer = require('./lib/room-js-server')

const { appName, logLevel } = config
const logger = bunyan.createLogger({ name: appName, level: logLevel })

const server = new RoomJSServer(logger, config)

server.on('ready', () => {
  server.start()
})
