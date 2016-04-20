const dotenv = require('dotenv');

const { loadFromEnv, loadIntegerFromEnv } = require('./environment-config');
const pkg = require('../../package.json');

dotenv.config();

module.exports.env = process.env.NODE_ENV || 'development';
module.exports.appName = pkg.name;
module.exports.version = pkg.version;
module.exports.port = loadIntegerFromEnv('PORT');
module.exports.logLevel = loadFromEnv('LOG_LEVEL');
