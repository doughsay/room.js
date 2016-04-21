const db = require('./db');
const controllerMap = require('./controller-map');
const World = require('../lib/world');

const world = new World(db, controllerMap);

module.exports = world;
