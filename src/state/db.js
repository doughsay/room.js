const MooDB = require('../lib/moo-db');
const logger = require('../config/logger');

const db = new MooDB('state/world', logger);

module.exports = db;
