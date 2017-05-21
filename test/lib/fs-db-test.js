const test = require('tape')
const FsDb = require('../../src/lib/fs-db')

const mockLogger = {
  child: () => mockLogger,
  info: () => {},
  trace: () => {}
}

test('FsDb: can be initialized', t => {
  const fsdb = new FsDb('test', mockLogger)

  fsdb.on('ready', () => {
    t.ok(fsdb)
    fsdb.close()
    t.end()
  })
})
