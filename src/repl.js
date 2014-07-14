'use strict';
// a REPL in the context of the world
require('harmony-reflect')
require('rjs-strings').attach(global)
require('./lib/load-world')()

var repl = require('repl').start('rjs-server > ')
  , World = require('./lib/world')

for (let id in World) {
  repl.context[id] = World[id]
}
