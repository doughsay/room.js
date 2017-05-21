const dotenv = require('dotenv')

const { loadFromEnv, loadIntegerFromEnv, loadBooleanFromEnv } = require('./lib/environment-config')
const pkg = require('../package.json')

dotenv.config()

module.exports.env = process.env.NODE_ENV || 'development'
module.exports.appName = pkg.name
module.exports.version = pkg.version
module.exports.port = loadIntegerFromEnv('PORT')
module.exports.address = loadFromEnv('ADDRESS')
module.exports.logLevel = loadFromEnv('LOG_LEVEL')
module.exports.maintenance = loadBooleanFromEnv('MAINTENANCE_MODE')
module.exports.userDbFile = loadFromEnv('USER_DB_FILE')
module.exports.worldDirectory = loadFromEnv('WORLD_DIRECTORY')
