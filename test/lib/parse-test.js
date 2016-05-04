const test = require('tape');
const parse = require('../../src/lib/parse');

test('parse: "look"', t => {
  const value = 'look';
  const expected = {
    verb: 'look',
    dobjstr: void 0,
    prepstr: void 0,
    iobjstr: void 0,
    argstr: '',
  };
  const actual = parse(value);

  t.deepEqual(actual, expected);
  t.end();
});

test('parse: "take yellow bird"', t => {
  const value = 'take yellow bird';
  const expected = {
    verb: 'take',
    dobjstr: 'yellow bird',
    prepstr: void 0,
    iobjstr: void 0,
    argstr: 'yellow bird',
  };
  const actual = parse(value);

  t.deepEqual(actual, expected);
  t.end();
});

test('parse: "put yellow bird in cuckoo clock"', t => {
  const value = 'put yellow bird in cuckoo clock';
  const expected = {
    verb: 'put',
    dobjstr: 'yellow bird',
    prepstr: 'in',
    iobjstr: 'cuckoo clock',
    argstr: 'yellow bird in cuckoo clock',
  };
  const actual = parse(value);

  t.deepEqual(actual, expected);
  t.end();
});

test('parse: "look at"', t => {
  const value = 'look at';
  const expected = {
    verb: 'look',
    dobjstr: void 0,
    prepstr: 'at',
    iobjstr: void 0,
    argstr: 'at',
  };
  const actual = parse(value);

  t.deepEqual(actual, expected);
  t.end();
});
