config = require '../config/app'
module.exports = log4js = require 'log4js'

log4js.configure
  appenders: [
    { type: 'console' },
    { type: 'file', filename: 'log/server.log'}
  ]

log4js.getLogger('cron').setLevel config.logLevel
log4js.getLogger('context').setLevel config.logLevel
log4js.getLogger('db').setLevel config.logLevel
log4js.getLogger('server').setLevel config.logLevel