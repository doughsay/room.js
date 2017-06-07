const Hashids = require('hashids')

const clearFns = { timeout: clearTimeout, interval: clearInterval, immediate: clearImmediate }
const setFns = { timeout: setTimeout, interval: setInterval, immediate: setImmediate }

class Timer {
  constructor () {
    this.hashids = new Hashids(new Date().toISOString())
    this.counter = 0
    this.map = {}
  }

  runIn (fn, milliseconds, rethrow = true) {
    return this._schedule(fn, 'timeout', milliseconds, rethrow)
  }

  runEvery (fn, milliseconds, rethrow = true) {
    return this._schedule(fn, 'interval', milliseconds, rethrow)
  }

  runNext (fn, rethrow = true) {
    return this._schedule(fn, 'immediate', undefined, rethrow)
  }

  cancel (id) {
    const timer = this.map[id]
    if (!timer) { return false }

    clearFns[timer.type](timer.timer)
    delete this.map[id]

    return true
  }

  check (id) {
    return !!this.map[id]
  }

  list () {
    return Object.keys(this.map)
  }

  _schedule (fn, type, milliseconds, rethrow) {
    const id = this._nextId()
    const timer = setFns[type]((...args) => {
      try {
        fn(...args)
      } catch (err) {
        if (rethrow) { throw err }
      } finally {
        if (type !== 'interval') { delete this.map[id] }
      }
    }, milliseconds)

    this.map[id] = { timer, type }

    return id
  }

  _nextId () {
    return this.hashids.encode(this.counter++)
  }
}

module.exports = Timer
