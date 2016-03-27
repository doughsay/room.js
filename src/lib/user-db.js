import SimpleDB from './simple-db';
import { serverLogger } from './logger';

const userdb = new SimpleDB('users.bson');

function save() {
  const time = new Date();
  userdb.saveSync();
  serverLogger.info('UserDB saved in %sms', new Date() - time);
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

export default userdb;