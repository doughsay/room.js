const repl = require('repl');
const world = require('./state/world');

const local = repl.start('room.js > ');

for (const id in world.context) { // eslint-disable-line guard-for-in
  local.context[id] = world.context[id];
}

local.on('exit', () => {
  process.exit();
});
