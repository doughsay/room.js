const callbacks = []

function cleanup (code) {
  callbacks.forEach(callback => { callback() })
  process.exit(code)
}

process.on('SIGINT', () => { cleanup(2) })
process.on('SIGTERM', () => { cleanup(0) })
process.on('uncaughtException', err => {
  callbacks.push(() => { throw err })
  cleanup(99)
})

module.exports = callback => { callbacks.push(callback) }
