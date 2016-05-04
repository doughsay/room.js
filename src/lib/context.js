const vm = require('vm');

const parse = require('./parse');
const { color } = require('./colors');

function Context(world) {
  const context = vm.createContext(world.objects);
  context.parse = parse;
  context.color = color;
  context.all = () => world.all();
  context.players = () => world.players();
  context.$ = id => world.get(id);
  context.nextId = raw => world.nextId(raw);

  context.Verb = (...args) => world.newVerb(...args);

  return context;
}

module.exports = Context;
