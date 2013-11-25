config = require '../config/logger'
app_config = require '../config/app'
module.exports = log4js = require 'log4js'

appenders = [{
  type: 'file',
  filename: config.file,
  backups: config.backups,
  maxLogSize: config.max_size,
  layout: type: 'colored'
}]
appenders.push {type: 'console'} if app_config.env is 'development'

log4js.configure appenders: appenders

# set log levels from config
for logger, level of config.levels
  log4js.getLogger(logger).setLevel level
