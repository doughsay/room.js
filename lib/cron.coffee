CronJob = require('cron').CronJob
util = require 'util'

jobs = []

exports.registerJob = (job) ->
  util.log 'registering new job: ' + job.toString()
  j = new CronJob job.spec, -> job.run()
  j._job = job
  id = jobs.push j
  return id - 1

exports.unregisterJob = (id) ->
  if jobs[id]?
    job = jobs[id]._job
    util.log 'unregistering job: ' + job.toString()
    delete jobs[id]
    jobs = jobs.filter (x) -> x?
  else
    throw new Error 'No such job'

exports.startJob = (id) ->
  if jobs[id]?
    job = jobs[id]._job
    util.log 'starting job: ' + job.toString()
    jobs[id].start()
  else
    throw new Error 'No such job'

exports.stopJob = (id) ->
  if jobs[id]?
    job = jobs[id]._job
    util.log 'stopping job: ' + job.toString()
    jobs[id].stop()
  else
    throw new Error 'No such job'