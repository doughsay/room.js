const test = require('tape')
const Timer = require('../../src/lib/timer')

test('Timer: can set timeout', t => {
  const timer = new Timer()

  timer.runIn(() => {
    t.end()
  }, 10)
})

test('Timer: can set immediate', t => {
  const timer = new Timer()

  timer.runNext(() => {
    t.end()
  })
})

test('Timer: can set interval and cancel it', t => {
  const timer = new Timer()
  let count = 0

  const id = timer.runEvery(() => {
    count++

    if (count === 3) {
      timer.cancel(id)
      t.end()
    }
  }, 10)
})

test('Timer: canceling non-existen timer returns false', t => {
  const timer = new Timer()

  t.false(timer.cancel('nope'))

  t.end()
})
