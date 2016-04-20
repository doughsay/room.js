import assert from 'assert';
import MooDB from './lib/moo-db';
import worldObjectProxy from './lib/world-object-proxy';

const db = new MooDB('new-db');

const root = db.findById('core.root');
const foo = db.findById('core.foo');

assert.ok(root);
assert.ok(foo);
assert.equal(root.id, 'root');
assert.equal(root.pkgId, 'core');
assert.deepEqual(foo.traitIds, ['core.root']);

const world = {};

db.pkgs().forEach((pkg, pkgId) => {
  world[pkgId] = {};
  pkg.forEach(object => {
    world[pkgId][object.id] = worldObjectProxy(object);
  });
});

console.log('done?');
