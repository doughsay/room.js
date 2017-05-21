const test = require('tape')
const rewriteEval = require('../../src/lib/rewrite-eval')

test('rewriteEval: wraps js code in IIFE', t => {
  const value = '2+2'
  const expected = '(function (here) {\n    return 2 + 2;\n}.call(player, player.location));'
  const actual = rewriteEval(value, 'player')

  t.equal(actual, expected)
  t.end()
})
