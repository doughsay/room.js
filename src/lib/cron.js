'use strict';
var CronJob = require('cron').CronJob
  , crondb = require('./cron-db')
  , util = require('./util')
  , Cron = {}
  , jobs = {}

function JobProxy(job) {
  util.modifyObject(this, function(property, accessor) {
    accessor('pattern', function() { return job._job.cronTime.source })
    accessor('running', function() { return job.running })

    function start() { return job.start() }
    function stop() { return job.stop() }
    function remove() { return job.remove() }

    function toString() {
      return  [ '[CronJob('
              , (this.running ? 'running' : 'stopped')
              , ') '
              , this.pattern
              , ']'
              ].join('')
    }

    util.overrideToString(start, 'start')
    util.overrideToString(stop, 'stop')
    util.overrideToString(remove, 'remove')
    util.overrideToString(toString, 'toString')

    property('start', start)
    property('stop', stop)
    property('remove', remove)
    property('toString', toString)
  })
}

function Job(id, pattern, fn, removeAfterRun, autoStart) {
  var removeFn  = removeAfterRun  ? function() {
                                      jobs[id].remove()
                                    }
                                  : null
    , onError   = function() {
                    jobs[id].stop()
                  }
  this._job = new CronJob ( pattern
                          , util.buildCronFunction(fn, id, onError, removeFn)
                          , null
                          , autoStart
                          )

  this.running = autoStart

  this.start = function() {
    this.running = true
    crondb.findById(id).running = true
    this._job.start()
    return true
  }

  this.stop = function() {
    this.running = false
    crondb.findById(id).running = false
    this._job.stop()
    return true
  }

  this.remove = function() {
    this.stop()
    delete jobs[id]
    crondb.removeById(id)
    return true
  }
}

function validPattern(pattern) {
  try {
    new CronJob(pattern, function() {})
    return true
  }
  catch(err) {
    return false
  }
}

function schedule(id, pattern, fn, start) {
  var removeAfterRun = false

  if (typeof start === 'undefined') {
    start = true
  }
  if (!(id && id.constructor.name === 'String')) {
    throw new Error('ID must be a valid string.')
  }
  if (!(fn && typeof fn === 'function')) {
    throw new Error('A valid function must be provided.')
  }
  if (jobs[id]) {
    throw new Error('A job with id `' + id + '` already exists.')
  }

  // node-cron uses "instanceof" to check for Date objects; this fails
  // when sending Date objects from behind a VM context.
  if (pattern && pattern.constructor.name === 'Date') {
    pattern = new Date(pattern) // convert it to a Date from this context
    removeAfterRun = true
  }
  else if (pattern && pattern.constructor.name === 'Number') {
    let date = new Date()
    date.setTime(date.getTime() + pattern)
    pattern = date
    removeAfterRun = true
  }

  if (!validPattern(pattern)) {
    throw new Error('Invalid cron pattern given.')
  }
  crondb.insert({id: id, pattern: pattern, code: fn.toString(), running: start})
  jobs[id] = new Job(id, pattern, fn, removeAfterRun, start)
  return true
}

function getJobs() {
  var output = {}
  for (let id in jobs) {
    output[id] = new JobProxy(jobs[id])
  }
  return output
}

util.overrideToString(schedule, 'schedule')

util.modifyObject(Cron, function(property, accessor) {
  property('schedule', schedule, true)
  accessor('jobs', getJobs, null, true)
})

// load initial state of cron
function init() {
  crondb.all().forEach(function(jd) {
    jobs[jd.id] = new Job(jd.id, jd.pattern, jd.code, false, jd.running)
  })
}

module.exports = { Cron: Cron, init: init }
