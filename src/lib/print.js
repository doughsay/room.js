// This module pretty prints a js object using room.js color markup
const { color } = require('./colors')

const c = color.reset

function truncate (s, length = 25) {
  if (s.length <= length) { return s }
  return `${s.slice(0, length + 1)}...`
}

function print (x, maxdepth, depth = 0, prefix = '', parents = []) {
  const indent = '  '.repeat(depth)

  const output = (() => {
    switch (typeof x) {
      case 'number': {
        return c.yellow(x)
      }

      case 'string': {
        if (depth === 0) {
          return `'${c.green(x)}'`
        }
        return `'${c.green(truncate(x))}'`
      }

      case 'boolean': {
        return c.magenta(x.toString())
      }

      case 'undefined': {
        return c.gray('undefined')
      }

      case 'function': {
        if (x.verb) {
          const args = [x.dobjarg, x.preparg, x.iobjarg].join(', ')
          return c.bold.cyan(`[Verb ${x.pattern}(${args})]`)
        }
        return c.cyan('[Function]')
      }

      case 'object': {
        if (x === null) {
          return c.gray('null')
        }

        if (Object.prototype.toString.call(x) === '[object Date]') {
          return c.yellow(x.toString())
        }

        if (Object.prototype.toString.call(x) === '[object RegExp]') {
          return c.red(x.toString())
        }

        if (parents.indexOf(x) >= 0) {
          return c.black.bgYellow('[CircularReference]')
        }

        parents.push(x)

        if (Array.isArray(x)) {
          if (x.length === 0) {
            parents.pop(); return '[]'
          } else if (maxdepth === depth) {
            parents.pop(); return c.blue(`[Array(${x.length})]`)
          }

          const xs = x.map(y => print(y, maxdepth, depth + 1, '', parents))

          xs[0].shift()
          xs[0].unshift('[ ')
          xs[xs.length - 1].push(' ]')
          if (prefix !== '') {
            xs[0].unshift('\n', indent)
          }
          parents.pop(); return xs.map(y => y.join('')).join(',\n')
        }

        if (Object.keys(x).length === 0) {
          parents.pop(); return '{}'
        } else if (maxdepth === depth) {
          parents.pop(); return c.blue(x.toString())
        }

        const xs = []
        for (const key in x) {
          const value = x[key]
          const pfx = `${c.blue(key)}: `
          xs.push(print(value, maxdepth, depth + 1, pfx, parents))
        }

        xs[0].shift()
        xs[0].unshift('{ ')
        xs[xs.length - 1].push(' }')
        if (prefix !== '') {
          xs[0].unshift('\n', indent)
        }
        parents.pop(); return xs.map(y => y.join('')).join(',\n')
      }
      default: {
        throw new Error('print error: unsupported object')
      }
    }
  })()
  return [indent, prefix, output]
}

module.exports = function printHelper (x, maxdepth = 1) {
  return print(x, maxdepth).join('')
}
