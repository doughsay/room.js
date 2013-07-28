log4js = require '../lib/logger'
logger = log4js.getLogger 'process'

process.on 'uncaughtException', (err) ->
  logger.fatal 'Uncaught Exception', err
  console.log err.stack
  process.exit 1

process.on 'SIGTERM', ->
  logger.info 'caught SIGTERM'
  process.exit 0

process.on 'SIGINT', ->
  logger.info 'caught SIGINT'
  process.exit 0

process.on 'exit', ->
  logger.info 'exiting...'