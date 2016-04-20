import MooDB from './moo-db';
import { serverLogger } from './logger';

const db = new MooDB('new-db');

function save() {
  const time = new Date();
  db.saveSync();
  serverLogger.info('DB saved in %sms', new Date() - time);
}

function gracefulExitOn(signal) {
  process.once(signal, () => {
    save();
    process.kill(process.pid, signal);
  });
}

// nodemon
gracefulExitOn('SIGUSR2');

// ctrl-c
gracefulExitOn('SIGINT');

// save every 30 minutes
setInterval(save, 30 * 60 * 1000);

export default db;
