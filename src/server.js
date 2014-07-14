'use strict';
require('harmony-reflect') // remove this once harmony proxies are real in v8
require('rjs-strings').attach(global)
var start = new Date()
  , World = require('./lib/load-world')()
  , winston = require('./lib/winston')
  , logger = winston.loggers.get('server')
  , socketController = require('./controllers/socket-controller')
  , coPatchSockets = require('./lib/co-patch-sockets')
  , server = require('http').createServer()
  , io = require('socket.io')(server)
  , config = require('./config/app')
  , fs = require('fs')
  , runHook = require('./lib/run-hook')

io.on('connection', coPatchSockets(socketController))

// Delete the socket file if it exists (from a previous crash)
// and set up a listener to remove it on clean exit
if (config.socket && fs.existsSync(config.socket)) {
  fs.unlinkSync(config.socket)
  process.on('exit', function() {
    fs.unlinkSync(config.socket)
  })
}

// Start the server.
server.listen(config.port || config.socket, function(err) {
  if (err) {
    throw err
  }
  // Fix socket permissions
  if(config.socket && fs.existsSync(config.socket)) {
    fs.chmodSync(config.socket, '777')
  }
  runHook(null, 'System', 'onServerStarted')
  logger.info ( '%s started on %s in %sms'
              , config.appName
              , (config.port || config.socket)
              , new Date() - start
              )
})
