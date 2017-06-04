const test = require('tape')
const World = require('../../src/lib/world')

const mockDb = require('../helpers/mock-db')

function loggerFactory () {
  return {
    child () { return this },
    debug () {}
  }
}

function setup () {
  const db = mockDb()
  const world = new World(loggerFactory(), db, new Map())
  return [world, world.global.proxy, db]
}

test('World: get an existing object', t => {
  const [world, { foo }] = setup()

  t.equal(world.get('foo'), foo)
  t.end()
})

test('World: get with non-existent id', t => {
  const [world] = setup()

  t.equal(world.get('nope'), undefined)
  t.end()
})

test('World: get nested id', t => {
  const [world, { namespace: { foo } }] = setup()

  t.equal(world.get('namespace.foo'), foo)
  t.end()
})

test('World: get non-existent nested id', t => {
  const [world] = setup()

  t.equal(world.get('does.not.exist'), undefined)
  t.end()
})

test('World: get badly formatted id', t => {
  const [world] = setup()

  t.equal(world.get('...foo &^%*&^% bar.baz.   '), undefined)
  t.end()
})

test('World: get empty string', t => {
  const [world] = setup()

  t.equal(world.get(''), undefined)
  t.end()
})

test('World: get non-string', t => {
  const [world] = setup()

  t.equal(world.get({}), undefined)
  t.end()
})

test('World: get falsish', t => {
  const [world] = setup()

  t.equal(world.get(null), undefined)
  t.end()
})

test('World: all', t => {
  const [world] = setup()

  t.equal(world.all().length, 6)
  t.end()
})

test('World: players', t => {
  const [world] = setup()

  t.equal(world.players().length, 0)
  t.end()
})

test('World: nextId when the requested id does not exist yet', t => {
  const [world] = setup()

  t.equal(world.nextId('hello'), 'hello')
  t.end()
})

test('World: nextId when the requested id already exists', t => {
  const [world] = setup()

  t.equal(world.nextId('foo'), 'foo1')
  t.end()
})

test('World: nextId when given `undefined`', t => {
  const [world] = setup()

  t.equal(world.nextId(), '')
  t.end()
})

test('World: insert', t => {
  const [world] = setup()

  world.insert({ id: 'newObj' })

  t.equal(world.get('newObj').id, 'newObj')
  t.end()
})

test('World: removeById', t => {
  const [world] = setup()

  world.removeById('foo')

  t.equal(world.get('foo'), undefined)
  t.end()
})

test('World: newVerb', t => {
  const [world] = setup()
  const verb = world.newVerb('l*ook', 'none', 'none', 'none')

  t.equal(typeof verb, 'function')
  t.equal(verb.verb, true)
  t.equal(verb.pattern, 'l*ook')
  t.equal(verb.dobjarg, 'none')
  t.equal(verb.preparg, 'none')
  t.equal(verb.iobjarg, 'none')
  t.end()
})

// test('World: run', t => {
//   const [world] = setup();
//
//   t.ok(world);
//   t.end();
// });
//
// test('World: runScript', t => {
//   const [world] = setup();
//
//   t.ok(world);
//   t.end();
// });
//
// test('World: hookExists', t => {
//   const [world] = setup();
//
//   t.ok(world);
//   t.end();
// });
//
// test('World: runHook', t => {
//   const [world] = setup();
//
//   t.ok(world);
//   t.end();
// });
//
// test('World: runIn', t => {
//   const [world] = setup();
//
//   t.ok(world);
//   t.end();
// });
//
// test('World: runEvery', t => {
//   const [world] = setup();
//
//   t.ok(world);
//   t.end();
// });
//
// test('World: runNext', t => {
//   const [world] = setup();
//
//   t.ok(world);
//   t.end();
// });
