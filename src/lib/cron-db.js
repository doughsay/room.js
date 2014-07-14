'use strict';
var SimpleDB = require('./simple-db')
  , crondb = new SimpleDB('cron.bson')
  , winston = require('./winston')
  , logger = winston.loggers.get('server')

function save() {
  var time = new Date()
  crondb.saveSync()
  logger.info('CronDB saved in %sms', new Date() - time)
}

function gracefulExitOn(signal) {
  process.once(signal, function() {
    save()
    process.kill(process.pid, signal)
  })
}

// nodemon
gracefulExitOn('SIGUSR2')

// ctrl-c
gracefulExitOn('SIGINT')

// save every 30 minutes
setInterval(save, 30*60*1000)

module.exports = crondb
