const test = require('tape')
const MooDb = require('../../src/lib/moo-db')

const mockLogger = {
  child: () => mockLogger,
  warn: () => {},
  info: () => {},
  trace: () => {}
}

test('MooDb: can be initialized', t => {
  const db = new MooDb('test', mockLogger)

  db.on('ready', () => {
    t.ok(db)
    db.close()
    t.end()
  })
})

test('MooDb: filenameForId', t => {
  const id = 'foo.bar.baz'
  const expected = 'foo/bar/baz/baz.json'
  const actual = MooDb.filenameForId(id)

  t.equal(actual, expected)
  t.end()
})

test('MooDb: filenameForSrcFile', t => {
  const id = 'foo.bar'
  const srcFileName = 'baz.js'
  const expected = 'foo/bar/baz.js'
  const actual = MooDb.filenameForSrcFile(id, srcFileName)

  t.equal(actual, expected)
  t.end()
})

test('MooDb: filepathForId', t => {
  const id = 'foo.bar.baz'
  const expected = 'foo/bar/baz'
  const actual = MooDb.filepathForId(id)

  t.equal(actual, expected)
  t.end()
})

test('MooDb: idFromFilename', t => {
  const filename = 'foo/bar/baz/baz.json'
  const expected = 'foo.bar.baz'
  const actual = MooDb.idFromFilename(filename)

  t.equal(actual, expected)
  t.end()
})

test('MooDb: idFromFilepath', t => {
  const filepath = 'foo/bar/baz'
  const expected = 'foo.bar.baz'
  const actual = MooDb.idFromFilepath(filepath)

  t.equal(actual, expected)
  t.end()
})
