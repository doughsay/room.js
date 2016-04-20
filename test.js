'use strict';

require('babel-register');

const assert = require('assert');
Reflect = require('harmony-reflect');
const C3 = require('./src/lib/c3').default;

function mkProxy(target) {
  function linearize(target, linearization) {
    if (!linearization) { linearization = new C3(target); }
    target.traits.forEach(trait => {
      linearization.add(target, trait);
      linearize(trait, linearization);
    });
    return linearization.run();
  }

  // traps for multiple inheritance

  function get(target, property) {
    const targets = linearize(target);
    for (let i = 0; i < targets.length; i++) {
      const tgt = targets[i];
      if (property in tgt.properties) { return tgt.properties[property]; }
    }
  }

  function has(target, property) {
    const targets = linearize(target);
    for (let i = 0; i < targets.length; i++) {
      const tgt = targets[i];
      if (property in tgt.properties) { return true; }
    }
    return false;
  }

  function enumerate(target) {
    const targets = linearize(target);
    const propertySet = new Set();
    targets.forEach(tgt => {
      for (const property in tgt.properties) {
        propertySet.add(property);
      }
    });
    return propertySet.values();
  }

  // forward all other traps to the properties object

  function set(target, property, value) {
    return Reflect.set(target.properties, property, value)
  }

  function deleteProperty(target, property) {
    return Reflect.deleteProperty(target.properties, property)
  }

  function hasOwn(target, property) {
    return Reflect.hasOwn(target.properties, property);
  }

  function ownKeys(target) {
    return Reflect.ownKeys(target.properties);
  }

  function getOwnPropertyDescriptor(target, property) {
    return Reflect.getOwnPropertyDescriptor(target.properties, property);
  }

  function getOwnPropertyNames(target) {
    return Reflect.getOwnPropertyNames(target.properties);
  }

  function getOwnPropertyKeys(target) {
    return Reflect.getOwnPropertyKeys(target.properties);
  }

  return new Proxy(target, {
    get: get,
    set: set,
    deleteProperty: deleteProperty,
    has: has,
    hasOwn: hasOwn,
    ownKeys: ownKeys,
    getOwnPropertyDescriptor: getOwnPropertyDescriptor,
    getOwnPropertyNames: getOwnPropertyNames,
    getOwnPropertyKeys: getOwnPropertyKeys,
    enumerate: enumerate
  });
}

// Targets:

const BaseTarget = { traits: [],                     properties: { base: 'hello' } };
const FooTarget  = { traits: [BaseTarget],           properties: { foo: 'foo', shared: 'foo' } };
const BarTarget  = { traits: [BaseTarget],           properties: { bar: 'bar', shared: 'bar' } };
const BazTarget  = { traits: [FooTarget, BarTarget], properties: { baz: 'baz', returnBase: function() { return this.base; } } };

// Proxies

const Base = mkProxy(BaseTarget);
const Foo = mkProxy(FooTarget);
const Bar = mkProxy(BarTarget);
const Baz = mkProxy(BazTarget);

// Tests:

assert.equal(Baz.baz, 'baz');
assert.equal(Baz.bar, 'bar');
assert.equal(Baz.foo, 'foo');
assert.equal(Baz.shared, 'foo');
assert.equal(Baz.base, 'hello');

assert.equal('baz' in Baz, true);
assert.equal('bar' in Baz, true);
assert.equal('foo' in Baz, true);
assert.equal('shared' in Baz, true);
assert.equal('base' in Baz, true);
assert.equal('something' in Baz, false);

assert.equal(Baz.hasOwnProperty('baz'), true);
assert.equal(Baz.hasOwnProperty('bar'), false);
assert.equal(Baz.hasOwnProperty('foo'), false);
assert.equal(Baz.hasOwnProperty('shared'), false);
assert.equal(Baz.hasOwnProperty('base'), false);

Baz.baz = 'lol';

assert.equal(Baz.baz, 'lol');

Baz.foo = 'lol';

assert.equal(Baz.foo, 'lol');
assert.equal(Baz.hasOwnProperty('foo'), true);

delete Baz.foo;

assert.equal(Baz.foo, 'foo');
assert.equal(Baz.hasOwnProperty('foo'), false);

assert.equal(Baz.returnBase(), 'hello');

delete Foo.shared;

assert.equal(Baz.shared, 'bar');

assert.deepEqual(Object.keys(Baz), ['returnBase', 'baz'])
const allProps = [];
for (const p in Baz) { allProps.push(p); }
assert.deepEqual(allProps, ['baz', 'returnBase', 'foo', 'bar', 'shared', 'base'])
