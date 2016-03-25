'use strict';

// a REPL in the context of the world

require('babel-register');
require('harmony-reflect'); // remove this once harmony proxies are real in v8
require('./lib/load-world').default();

const repl = require('repl').start('rjs-server > ');
const World = require('./lib/world').default;

for (const id in World) {
  if ({}.hasOwnProperty.call(World, id)) {
    repl.context[id] = World[id];
  }
}
