CronJob = require('cron').CronJob

jobs = []

exports.registerJob = (job) ->
  console.log 'register job', job.toString()
  id = jobs.push new CronJob job.spec, -> job.run()
  return id - 1

exports.unregisterJob = (id) ->
  console.log 'unregister job', id
  delete jobs[id]
  jobs = jobs.filter (x) -> x?

exports.startJob = (id) ->
  console.log 'start job', id
  if jobs[id]?
    jobs[id].start()
  else
    throw new Error 'No such job'

exports.stopJob = (id) ->
  console.log 'stop job', id
  if jobs[id]?
    jobs[id].stop()
  else
    throw new Error 'No such job'