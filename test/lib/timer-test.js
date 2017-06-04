const test = require('tape')
const Timer = require('../../src/lib/timer')

function setup () {
  return new Timer()
}

test('Timer: can set timeout', t => {
  const timer = setup()

  timer.runIn(() => {
    t.end()
  }, 10)
})

test('Timer: can set immediate', t => {
  const timer = setup()

  timer.runNext(() => {
    t.end()
  })
})

test('Timer: can set interval and cancel it', t => {
  const timer = setup()
  let count = 0

  const id = timer.runEvery(() => {
    count++

    if (count === 3) {
      timer.cancel(id)
      t.end()
    }
  }, 10)
})
