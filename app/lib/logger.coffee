config = require '../config/app'
module.exports = log4js = require 'log4js'

log4js.configure
  appenders: [
    { type: 'console' },
    { type: 'file', filename: 'log/server.log'}
  ]

log4js.getLogger('cron').setLevel     config.logLevel.cron
log4js.getLogger('context').setLevel  config.logLevel.context
log4js.getLogger('db').setLevel       config.logLevel.db
log4js.getLogger('server').setLevel   config.logLevel.server
log4js.getLogger('client').setLevel   config.logLevel.client
log4js.getLogger('editor').setLevel   config.logLevel.editor
log4js.getLogger('compiler').setLevel config.logLevel.compiler
log4js.getLogger('process').setLevel  config.logLevel.process