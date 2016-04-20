const onExit = require('../lib/on-exit');
const SimpleDB = require('../lib/simple-db');

const userDb = new SimpleDB('state/users.json');
const save = () => userDb.saveSync();

onExit(save);
setInterval(save, 30 * 60 * 1000); // every 30 minutes

module.exports = userDb;
