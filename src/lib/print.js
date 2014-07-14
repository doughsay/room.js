'use strict';
// This module pretty prints a js object using room.js color markup
var util = require('./util')

function defined(x) {
  return typeof x !== 'undefined' && x !== null
}

function isFormattedString(data) {
  if (!defined(data)) {
    return false
  }
  return     typeof data.text === 'string'
          || typeof data.color === 'string'
          || typeof data.bold === 'boolean'
          || typeof data.inverse === 'boolean'
          || typeof data.pre === 'boolean'
}

function truncate(s, length) {
  if (typeof length === 'undefined') { length = 25 }

  if (s.length <= 25) {
    return s
  }
  else {
    return s.slice(0, length + 1) + '...'
  }
}

function print(x, maxdepth, depth, prefix, parents) {
  var indent
    , output

  // defaults
  if (typeof depth === 'undefined') { depth = 0 }
  if (typeof prefix === 'undefined') { prefix = '' }
  if (typeof parents === 'undefined') { parents = [] }

  indent = '  '.repeat(depth)

  output = (function() {
    var output

    switch (typeof x) {
      case 'number':
        return yellow(x)

      case 'string':
        if (depth === 0) {
          return ['\'', green(x), '\''] // escape?
        }
        else {
          return ['\'', green(truncate(x)), '\''] // escape?
        }
        break

      case 'boolean':
        return magenta(x.toString())

      case 'undefined':
        return black('undefined')

      case 'function':
        if (x.__verb__) {
          let args = [x.dobjarg, x.preparg, x.iobjarg].join(', ')

          return cyan(bold(['[Verb ', x.pattern, '(', args, ')]']))
        }
        else {
          return cyan('[Function]')
        }
        break

      case 'object':
        if (x === null) {
          return gray('null')
        }
        else if (Object.prototype.toString.call(x) === '[object Date]') {
          return orange(x.toString())
        }
        else if (Object.prototype.toString.call(x) === '[object RegExp]') {
          return red(x.toString())
        }
        else if (x.constructor.name === 'JobProxy') {
          return orange(bold(x.toString()))
        }
        else if (isFormattedString(x)) {
          return magenta(bold(['[FormattedString "', truncate(render(x, false)) ,'"]']))
        }
        else {
          if (parents.indexOf(x) >= 0) {
            return yellow(inverse('[CircularReference]'))
          }
          else {
            parents.push(x)
            if (Array.isArray(x)) {
              if (x.length === 0) {
                output = '[]'
              }
              else if (maxdepth === depth) {
                output = blue(['[Array(', x.length, ')]'])
              }
              else {
                let xs = x.map(function(y) {
                  return print(y, maxdepth, depth + 1, '', parents)
                })
                xs[0].shift()
                xs[0].unshift('[ ')
                xs[xs.length-1].push(' ]')
                if (prefix !== '') {
                  xs[0].unshift('\n', indent)
                }
                output = util.intersperse(',\n', xs)
              }
            }
            else {
              if (Object.keys(x).length === 0) {
                output = '{}'
              }
              else if (maxdepth === depth) {
                output = blue(x.toString())
              }
              else {
                let xs = []
                for (let key in x) {
                  let value = x[key]
                    , color = x.hasOwnProperty(key) ? blue : gray
                    , prefix = [color(key), ': ']
                  xs.push(print(value, maxdepth, depth + 1, prefix, parents))
                }
                xs[0].shift()
                xs[0].unshift('{ ')
                xs[xs.length-1].push(' }')
                if (prefix !== '') {
                  xs[0].unshift('\n', indent)
                }
                output = util.intersperse(',\n', xs)
              }
            }
            parents.pop()
            return output
          }
        }
    }
  })()
  return [indent, prefix, output]
}

function printHelper(x, maxdepth) {
  if (typeof maxdepth === 'undefined') {
    maxdepth = 1
  }
  return print(x, maxdepth)
}

module.exports = printHelper
