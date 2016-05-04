const test = require('tape');
const serialize = require('../../src/lib/serialize');

test('serialize: a string', t => {
  const value = 'foo';
  const expected = { value: 'foo' };
  const actual = serialize(value);

  t.deepEqual(actual, expected);
  t.end();
});

test('serialize: a number', t => {
  const value = 3.14159;
  const expected = { value: 3.14159 };
  const actual = serialize(value);

  t.deepEqual(actual, expected);
  t.end();
});

test('serialize: not a number', t => {
  const value = NaN;
  const expected = { NaN: true };
  const actual = serialize(value);

  t.deepEqual(actual, expected);
  t.end();
});

test('serialize: true', t => {
  const value = true;
  const expected = { value: true };
  const actual = serialize(value);

  t.deepEqual(actual, expected);
  t.end();
});

test('serialize: false', t => {
  const value = false;
  const expected = { value: false };
  const actual = serialize(value);

  t.deepEqual(actual, expected);
  t.end();
});

test('serialize: a date', t => {
  const value = new Date(Date.UTC(2016, 0));
  const expected = { date: '2016-01-01T00:00:00.000Z' };
  const actual = serialize(value);

  t.deepEqual(actual, expected);
  t.end();
});

test('serialize: a regular expression', t => {
  const value = /foo|bar/gi;
  const expected = { regexp: 'foo|bar', flags: 'gi' };
  const actual = serialize(value);

  t.deepEqual(actual, expected);
  t.end();
});

test('serialize: undefined', t => {
  const value = void 0;
  const expected = { undefined: true };
  const actual = serialize(value);

  t.deepEqual(actual, expected);
  t.end();
});

test('serialize: null', t => {
  const value = null;
  const expected = { object: null };
  const actual = serialize(value);

  t.deepEqual(actual, expected);
  t.end();
});

test('serialize: a simple object', t => {
  const value = { foo: 'bar' };
  const expected = { object: { foo: { value: 'bar' } } };
  const actual = serialize(value);

  t.deepEqual(actual, expected);
  t.end();
});

test('serialize: a simple array', t => {
  const value = [1, 'two'];
  const expected = { array: [{ value: 1 }, { value: 'two' }] };
  const actual = serialize(value);

  t.deepEqual(actual, expected);
  t.end();
});

test('serialize: a complex object', t => {
  const value = {
    s: 's', n: 2, r: /r/, nl: null, u: void 0, o: { x: 'y', z: null }, a: [1, 't', { r: /r/ }],
  };
  const expected = {
    object: {
      s: { value: 's' },
      n: { value: 2 },
      r: { regexp: 'r', flags: '' },
      nl: { object: null },
      u: { undefined: true },
      o: {
        object: { x: { value: 'y' }, z: { object: null } },
      },
      a: {
        array: [{ value: 1 }, { value: 't' }, { object: { r: { regexp: 'r', flags: '' } } }],
      },
    },
  };
  const actual = serialize(value);

  t.deepEqual(actual, expected);
  t.end();
});

test('serialize: a world object', t => {
  const value = { __proxy__: true, id: 'foo' };
  const expected = { ref: 'foo' };
  const actual = serialize(value);

  t.deepEqual(actual, expected);
  t.end();
});

test('serialize: an unsupported object', t => {
  const value = new Map();
  t.throws(() => { serialize(value); }, /Unable to serialize object/);
  t.end();
});

test('serialize: a function', t => {
  const value = function foo() { return 'foo'; };
  const expected = { function: true, source: "function foo() { return 'foo'; }" };
  const actual = serialize(value);

  t.deepEqual(actual, expected);
  t.end();
});

test('serialize: a function that has a source attribute', t => {
  const value = function foo() { return 'foo'; };
  value.source = "function bar() { return 'bar'; }";
  const expected = { function: true, source: value.source };
  const actual = serialize(value);

  t.deepEqual(actual, expected);
  t.end();
});

test('serialize: a verb', t => {
  const value = function foo() { return 'foo'; };
  value.verb = true;
  value.pattern = 'f*oo';
  value.source = "function foo() { return 'foo'; }";
  value.dobjarg = 'this';
  value.preparg = 'none';
  value.iobjarg = 'none';
  const expected = {
    verb: true,
    pattern: value.pattern,
    source: value.source,
    dobjarg: value.dobjarg,
    preparg: value.preparg,
    iobjarg: value.iobjarg,
  };
  const actual = serialize(value);

  t.deepEqual(actual, expected);
  t.end();
});

test('serialize: an unsupported object', t => {
  const value = Symbol('foo');
  t.throws(() => { serialize(value); }, /Unable to serialize value/);
  t.end();
});
