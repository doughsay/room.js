const test = require('tape');
const WorldObjectClassBuilder = require('../../src/lib/world-object-class-builder');

test('WorldObjectClassBuilder: can be initialized', t => {
  const builder = new WorldObjectClassBuilder();

  t.ok(builder);
  t.end();
});
