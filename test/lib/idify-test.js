const test = require('tape');
const idify = require('../../src/lib/idify');

test('idify: "foo"', t => {
  const value = 'foo';
  const expected = 'foo';
  const actual = idify(value);

  t.equal(actual, expected);
  t.end();
});

test('idify: "foo bar baz"', t => {
  const value = 'foo bar baz';
  const expected = 'fooBarBaz';
  const actual = idify(value);

  t.equal(actual, expected);
  t.end();
});

test('idify: "This is a sentence!"', t => {
  const value = 'This is a sentence!';
  const expected = 'thisIsASentence';
  const actual = idify(value);

  t.equal(actual, expected);
  t.end();
});

test('idify: "!@#$%^&*()_+"', t => {
  const value = '!@#$%^&*()_+';
  const expected = '';
  const actual = idify(value);

  t.equal(actual, expected);
  t.end();
});

test('idify: "hello !@#$%^&*()_+" world', t => {
  const value = 'hello !@#$%^&*()_+ world';
  const expected = 'helloWorld';
  const actual = idify(value);

  t.equal(actual, expected);
  t.end();
});

test('idify: ""', t => {
  const value = '';
  const expected = '';
  const actual = idify(value);

  t.equal(actual, expected);
  t.end();
});

test('idify: `undefined`', t => {
  const value = void 0;
  const expected = '';
  const actual = idify(value);

  t.equal(actual, expected);
  t.end();
});
