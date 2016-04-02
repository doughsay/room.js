import cron from 'cron';

import crondb from './cron-db';
import util from './util';
import { cronLogger } from './logger';

const jobs = {};
const CronJob = cron.CronJob;

export const Cron = {};

function JobProxy(job) {
  util.modifyObject(this, (property, accessor) => {
    accessor('pattern', () => job._job.cronTime.source);
    accessor('running', () => job.running);

    function start() { return job.start(); }
    function stop() { return job.stop(); }
    function remove() { return job.remove(); }

    function toString() {
      return `[CronJob(${this.running ? 'running' : 'stopped'}) ${this.pattern}]`;
    }

    util.overrideToString(start, 'start');
    util.overrideToString(stop, 'stop');
    util.overrideToString(remove, 'remove');
    util.overrideToString(toString, 'toString');

    property('start', start);
    property('stop', stop);
    property('remove', remove);
    property('toString', toString);
  });
}

function Job(id, pattern, fn, removeAfterRun, autoStart) {
  const removeFn = removeAfterRun ? () => { jobs[id].remove(); } : null;
  const onError = () => { jobs[id].stop(); };

  this._job = new CronJob(
    pattern,
    util.buildCronFunction(fn, id, onError, removeFn),
    null,
    autoStart
  );

  this.running = autoStart;

  this.start = () => {
    this.running = true;
    crondb.findById(id).running = true;
    this._job.start();
    return true;
  };

  this.stop = () => {
    this.running = false;
    crondb.findById(id).running = false;
    this._job.stop();
    return true;
  };

  this.remove = () => {
    this.stop();
    delete jobs[id];
    crondb.removeById(id);
    return true;
  };
}

function validPattern(pattern) {
  try {
    new CronJob(pattern, () => {}); // eslint-disable-line no-new
    return true;
  } catch (err) {
    return false;
  }
}

function schedule(id, inPattern, fn, start = true) {
  let removeAfterRun = false;
  let pattern;

  if (!(id && id.constructor.name === 'String')) {
    throw new Error('ID must be a valid string.');
  }
  if (!(fn && typeof fn === 'function')) {
    throw new Error('A valid function must be provided.');
  }
  if (jobs[id]) {
    throw new Error(`A job with id ${id} already exists.`);
  }

  // node-cron uses "instanceof" to check for Date objects; this fails
  // when sending Date objects from behind a VM context.
  if (inPattern && inPattern.constructor.name === 'Date') {
    pattern = new Date(inPattern); // convert it to a Date from this context
    removeAfterRun = true;
  } else if (inPattern && inPattern.constructor.name === 'Number') {
    const date = new Date();
    date.setTime(date.getTime() + inPattern);
    pattern = date;
    removeAfterRun = true;
  }

  if (!validPattern(pattern)) {
    throw new Error('Invalid cron pattern given.');
  }
  crondb.insert({ id, pattern, code: fn.toString(), running: start });
  jobs[id] = new Job(id, pattern, fn, removeAfterRun, start);
  return true;
}

function getJobs() {
  const output = {};
  for (const id in jobs) {
    output[id] = new JobProxy(jobs[id]);
  }
  return output;
}

util.overrideToString(schedule, 'schedule');

util.modifyObject(Cron, (property, accessor) => {
  property('schedule', schedule, true);
  accessor('jobs', getJobs, null, true);
});

// load initial state of cron
export function initCron() {
  crondb.all().forEach(jd => {
    jobs[jd.id] = new Job(jd.id, jd.pattern, jd.code, false, jd.running);
  });
  cronLogger.info('cronjobs loaded and started');
}
