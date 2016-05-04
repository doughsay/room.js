const test = require('tape');
const MooDb = require('../../src/lib/moo-db');

const mockLogger = {
  child: () => mockLogger,
  warn: () => {},
  info: () => {},
  trace: () => {},
};

test('MooDb: can be initialized', t => {
  const db = new MooDb('test', mockLogger);

  db.on('ready', () => {
    t.ok(db);
    db.close();
    t.end();
  });
});
