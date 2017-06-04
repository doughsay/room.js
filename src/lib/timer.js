const clearFns = { timeout: clearTimeout, interval: clearInterval, immediate: clearImmediate }
const setFns = { timeout: setTimeout, interval: setInterval, immediate: setImmediate }

class Timer {
  constructor () {
    this.counter = 0
    this.map = {}
  }

  runIn (fn, milliseconds) {
    return this._schedule(fn, 'timeout', milliseconds)
  }

  runEvery (fn, milliseconds) {
    return this._schedule(fn, 'interval', milliseconds)
  }

  runNext (fn) {
    return this._schedule(fn, 'immediate')
  }

  cancel (id) {
    const timer = this.map[id]
    if (!timer) { return false }

    clearFns[timer.type](timer.timer)
    delete this.map[id]

    return true
  }

  _schedule (fn, type, milliseconds = undefined) {
    const id = this._nextId()
    const timer = setFns[type]((...args) => {
      fn(...args)
      if (type !== 'interval') { delete this.map[id] }
    }, milliseconds)

    this.map[id] = { timer, type }

    return id
  }

  _nextId () {
    return this.counter++
  }
}

module.exports = Timer
