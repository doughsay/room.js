const test = require('tape')
const SimpleDb = require('../../src/lib/simple-db')

test('SimpleDb: can be initialized', t => {
  const db = new SimpleDb('test-db.json')

  t.ok(db)
  t.end()
})
