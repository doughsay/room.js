const test = require('tape');
const Deserializer = require('../../src/lib/deserializer');
const deserializer = new Deserializer({});

test('deserialize a string', t => {
  const value = { value: 'foo' };
  const expected = 'foo';
  const actual = deserializer.deserialize(value);

  t.equal(actual, expected);
  t.end();
});

test('deserialize a number', t => {
  const value = { value: 3.14159 };
  const expected = 3.14159;
  const actual = deserializer.deserialize(value);

  t.equal(actual, expected);
  t.end();
});

test('deserialize not a number', t => {
  const value = { NaN: true };
  const actual = deserializer.deserialize(value);

  t.true(isNaN(actual));
  t.end();
});

test('deserialize true', t => {
  const value = { value: true };
  const expected = true;
  const actual = deserializer.deserialize(value);

  t.equal(actual, expected);
  t.end();
});

test('deserialize false', t => {
  const value = { value: false };
  const expected = false;
  const actual = deserializer.deserialize(value);

  t.equal(actual, expected);
  t.end();
});

test('deserialize a date', t => {
  const value = { date: '2016-01-01T00:00:00.000Z' };
  const expected = new Date(Date.UTC(2016, 0));
  const actual = deserializer.deserialize(value);

  t.equal(actual.getTime(), expected.getTime());
  t.end();
});

test('deserialize a regular expression', t => {
  const value = { regexp: 'foo|bar', flags: 'gi' };
  const expected = /foo|bar/gi;
  const actual = deserializer.deserialize(value);

  t.equal(actual.source, expected.source);
  t.equal(actual.flags, expected.flags);
  t.end();
});

test('deserialize undefined', t => {
  const value = { undefined: true };
  const expected = void 0;
  const actual = deserializer.deserialize(value);

  t.equal(actual, expected);
  t.end();
});

test('deserialize null', t => {
  const value = { object: null };
  const expected = null;
  const actual = deserializer.deserialize(value);

  t.equal(actual, expected);
  t.end();
});

test('deserialize a simple object', t => {
  const value = { object: { foo: { value: 'bar' } } };
  const expected = { foo: 'bar' };
  const actual = deserializer.deserialize(value);

  t.deepEqual(actual, expected);
  t.end();
});

test('deserialize a simple array', t => {
  const value = { array: [{ value: 1 }, { value: 'two' }] };
  const expected = [1, 'two'];
  const actual = deserializer.deserialize(value);

  t.deepEqual(actual, expected);
  t.end();
});

test('deserialize a complex object', t => {
  const value = {
    object: {
      s: { value: 's' },
      n: { value: 2 },
      nl: { object: null },
      u: { undefined: true },
      o: {
        object: { x: { value: 'y' }, z: { object: null } },
      },
      a: {
        array: [{ value: 1 }, { value: 't' }],
      },
    },
  };
  const expected = {
    s: 's', n: 2, nl: null, u: void 0, o: { x: 'y', z: null }, a: [1, 't'],
  };
  const actual = deserializer.deserialize(value);

  t.deepEqual(actual, expected);
  t.end();
});

// TODO: deserialize functions
