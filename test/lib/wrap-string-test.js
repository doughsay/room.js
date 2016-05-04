const test = require('tape');
const wrapString = require('../../src/lib/wrap-string');

test('wrapString: wraps a string in quotes', t => {
  const value = 'foo';
  const expected = '"foo"';
  const actual = wrapString(value);

  t.equal(actual, expected);
  t.end();
});

test('wrapString: escapes double quotes', t => {
  const value = 'foo "bar"';
  const expected = '"foo \\"bar\\""';
  const actual = wrapString(value);

  t.equal(actual, expected);
  t.end();
});

test('wrapString: escapes backslashes', t => {
  const value = 'foo \\ bar';
  const expected = '"foo \\\\ bar"';
  const actual = wrapString(value);

  t.equal(actual, expected);
  t.end();
});

test('wrapString: handles `undefined`', t => {
  const value = void 0;
  const expected = 'void 0';
  const actual = wrapString(value);

  t.equal(actual, expected);
  t.end();
});
