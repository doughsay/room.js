CronJob = require('cron').CronJob

log4js = require './logger'
logger = log4js.getLogger 'cron'

jobs = []

exports.registerJob = (job) ->
  logger.debug 'registering new job: ' + job.toString()
  j = new CronJob job.spec, -> job.run()
  j._job = job
  id = jobs.push j
  return id - 1

exports.unregisterJob = (id) ->
  if jobs[id]?
    job = jobs[id]._job
    logger.debug 'unregistering job: ' + job.toString()
    delete jobs[id]
    jobs = jobs.filter (x) -> x?
  else
    throw new Error 'No such job'

exports.startJob = (id) ->
  if jobs[id]?
    job = jobs[id]._job
    logger.debug 'starting job: ' + job.toString()
    jobs[id].start()
  else
    throw new Error 'No such job'

exports.stopJob = (id) ->
  if jobs[id]?
    job = jobs[id]._job
    logger.debug 'stopping job: ' + job.toString()
    jobs[id].stop()
  else
    throw new Error 'No such job'