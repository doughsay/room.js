const test = require('tape');
const serialize = require('../../src/lib/serialize');
const World = require('../../src/lib/world');
const WorldObjectProxyBuilder = require('../../src/lib/world-object-proxy-builder');
const WorldObjectClassBuilder = require('../../src/lib/world-object-class-builder');

function targetFactory(id, traitIds, properties) {
  const serializedProperties = {};
  for (const key in properties) { // eslint-disable-line guard-for-in
    serializedProperties[key] = serialize(properties[key]);
  }

  const locationId = id === 'room' ? null : 'room';

  return {
    id,
    name: id,
    aliases: [],
    traitIds,
    locationId,
    userId: null,
    properties: serializedProperties,
  };
}

function mockedDbFactory() {
  const baseTarget = targetFactory('base', [], { base: 'base' });
  const roomTarget = targetFactory('room', ['base'], {});
  const barTarget = targetFactory('bar', ['base'], { bar: 'bar', shared: 'from-bar' });
  const bazTarget = targetFactory('baz', ['base'], { baz: 'baz', shared: 'from-baz' });
  const fooTarget = targetFactory('foo', ['bar', 'baz'], { foo: 'foo' });

  return {
    findById(id) {
      if (id === 'base') {
        return baseTarget;
      } else if (id === 'bar') {
        return barTarget;
      } else if (id === 'baz') {
        return bazTarget;
      } else if (id === 'foo') {
        return fooTarget;
      } else if (id === 'room') {
        return roomTarget;
      }
      return void 0;
    },

    findBy(field, value) {
      return [baseTarget, roomTarget, barTarget, bazTarget, fooTarget]
        .filter(object => object[field] === value);
    },

    all() {
      return [baseTarget, roomTarget, barTarget, bazTarget, fooTarget];
    },
  };
}

function setup() {
  const db = mockedDbFactory();
  const world = new World(db, new Map());
  const WorldObject = (new WorldObjectClassBuilder(db, world, new Map())).buildClass();
  const builder = new WorldObjectProxyBuilder(mockedDbFactory(), world, WorldObject);
  db.all().forEach(target => { world[target.id] = builder.build(target); });
  return [world, db];
}

test('has property `foo`', t => {
  const [{ foo }] = setup();

  t.equal(foo.foo, 'foo');
  t.end();
});

test('has own property `foo`', t => {
  const [{ foo }] = setup();

  t.true(foo.hasOwnProperty('foo'));
  t.end();
});

test('has property `bar`', t => {
  const [{ foo }] = setup();

  t.equal(foo.bar, 'bar');
  t.end();
});

test('does not have own property `bar`', t => {
  const [{ foo }] = setup();

  t.false(foo.hasOwnProperty('bar'));
  t.end();
});

test('has property `baz`', t => {
  const [{ foo }] = setup();

  t.equal(foo.baz, 'baz');
  t.end();
});

test('does not have own property `baz`', t => {
  const [{ foo }] = setup();

  t.false(foo.hasOwnProperty('bar'));
  t.end();
});

test('inherits property `shared` from bar', t => {
  const [{ foo }] = setup();

  t.equal(foo.shared, 'from-bar');
  t.end();
});

test('does not have own property `shared`', t => {
  const [{ foo }] = setup();

  t.false(foo.hasOwnProperty('shared'));
  t.end();
});

test('has property `base`', t => {
  const [{ foo }] = setup();

  t.equal(foo.base, 'base');
  t.end();
});

test('does not have own property `base`', t => {
  const [{ foo }] = setup();

  t.false(foo.hasOwnProperty('base'));
  t.end();
});

test('set new property', t => {
  const [{ foo }] = setup();

  foo.prop = 'new prop';
  t.equal(foo.prop, 'new prop');
  t.end();
});

test('override inherited property', t => {
  const [{ foo }] = setup();

  foo.base = 'overridden';
  t.equal(foo.base, 'overridden');
  t.end();
});

test('deserialize values from the properties hash on get', t => {
  const [{ foo }, db] = setup();

  t.deepEqual(db.findById('foo').properties.foo, { value: 'foo' });
  t.equal(foo.foo, 'foo');
  t.end();
});

test('serialize values to the properties hash on set', t => {
  const [{ foo }, db] = setup();

  foo.prop = 'new-prop';
  t.deepEqual(db.findById('foo').properties.prop, { value: 'new-prop' });
  t.end();
});

test('get id', t => {
  const [{ foo }] = setup();

  t.equal(foo.id, 'foo');
  t.end();
});

test('set id', t => {
  const [{ foo }] = setup();

  foo.id = 'nope';
  t.equal(foo.id, 'foo');
  t.end();
});

test('get name', t => {
  const [{ foo }] = setup();

  t.equal(foo.name, 'foo');
  t.end();
});

test('set name', t => {
  const [{ foo }] = setup();

  foo.name = 'new name';
  t.equal(foo.name, 'new name');
  t.end();
});

test('set name coerces to string', t => {
  const [{ foo }] = setup();

  foo.name = /new name/gi;
  t.equal(foo.name, '/new name/gi');
  t.end();
});

test('get aliases', t => {
  const [{ foo }] = setup();

  t.deepEqual(foo.aliases, []);
  t.end();
});

test('set aliases', t => {
  const [{ foo }] = setup();

  foo.aliases = ['some', 'thing'];
  t.deepEqual(foo.aliases, ['some', 'thing']);
  t.end();
});

test('set aliases coerces to array of strings', t => {
  const [{ foo }] = setup();

  foo.aliases = [1, 'two', /three/i, {}];
  t.deepEqual(foo.aliases, ['1', 'two', '/three/i', '[object Object]']);
  t.end();
});

test('get userId', t => {
  const [{ foo }] = setup();

  t.equal(foo.userId, null);
  t.end();
});

test('set userId', t => {
  const [{ foo }] = setup();

  foo.userId = 'nope';
  t.equal(foo.userId, null);
  t.end();
});

// test('get location', t => {
//   const [{ foo, room }] = setup();
//
//   t.equal(foo.location, room);
//   t.end();
// });

test('set location to null', t => {
  const [{ foo }] = setup();

  foo.location = null;
  t.equal(foo.location, null);
  t.end();
});

test('set location to undefined', t => {
  const [{ foo }] = setup();

  foo.location = void 0;
  t.equal(foo.location, null);
  t.end();
});

// test('set location to another object', t => {
//   const [{ foo, bar }] = setup();
//
//   foo.location = bar;
//   t.equal(foo.location, bar);
//   t.end();
// });

test('get traits', t => {
  const [{ foo, bar, baz }] = setup();

  t.deepEqual(foo.traits, [bar, baz]);
  t.end();
});

test('set traits to empty array', t => {
  const [{ foo }] = setup();

  foo.traits = [];
  t.deepEqual(foo.traits, []);
  t.end();
});

test('set traits to new array of traits', t => {
  const [{ foo, base }] = setup();

  foo.traits = [base];
  t.deepEqual(foo.traits, [base]);
  t.end();
});
