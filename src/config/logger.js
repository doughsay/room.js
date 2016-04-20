const bunyan = require('bunyan');
const { appName, logLevel } = require('./config');

const logger = bunyan.createLogger({ name: appName, level: logLevel });

module.exports = logger;
