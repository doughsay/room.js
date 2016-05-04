const test = require('tape');
const Pbkdf2 = require('../../src/lib/pbkdf2');

test('Pbkdf2: can be initialized', t => {
  const pbkdf2 = new Pbkdf2;

  t.ok(pbkdf2);
  t.end();
});

test('Pbkdf2: can be initialized with custom options', t => {
  const pbkdf2 = new Pbkdf2({
    iterations: 20000,
    saltLength: 24,
    derivedKeyLength: 60,
    lengthLimit: 8192,
  });

  t.ok(pbkdf2);
  t.end();
});

test('Pbkdf2: hashes password', t => {
  const pbkdf2 = new Pbkdf2;

  pbkdf2.hashPassword('password', (err, hashedPassword) => {
    t.error(err);
    t.ok(hashedPassword);
    t.end();
  });
});

test('Pbkdf2: checks password validity when valid', t => {
  const pbkdf2 = new Pbkdf2;

  pbkdf2.hashPassword('password', (err, hashedPassword) => {
    t.error(err);
    pbkdf2.checkPassword('password', hashedPassword, (err2, valid) => {
      t.error(err2);
      t.true(valid);
      t.end();
    });
  });
});

test('Pbkdf2: checks password validity when not valid', t => {
  const pbkdf2 = new Pbkdf2;

  pbkdf2.hashPassword('password', (err, hashedPassword) => {
    t.error(err);
    pbkdf2.checkPassword('foo', hashedPassword, (err2, valid) => {
      t.error(err2);
      t.false(valid);
      t.end();
    });
  });
});

test('Pbkdf2: errors when bad hashed password given', t => {
  const pbkdf2 = new Pbkdf2;

  pbkdf2.checkPassword('password', 'bogus', err => {
    t.equal(err.message, "serializedPasswordData doesn't have the right format");
    t.end();
  });
});

test('Pbkdf2: errors when password is longer than length limit', t => {
  const pbkdf2 = new Pbkdf2({
    lengthLimit: 8,
  });

  pbkdf2.hashPassword('longpassword', err => {
    t.equal(err.message, 'password is too long');
    t.end();
  });
});

test('Pbkdf2: errors when password candidate is longer than length limit', t => {
  const pbkdf2 = new Pbkdf2({
    lengthLimit: 8,
  });

  pbkdf2.checkPassword('longpassword', 'foo', err2 => {
    t.equal(err2.message, 'password is too long');
    t.end();
  });
});
