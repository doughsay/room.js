// This module pretty prints a js object using room.js color markup

import chalk from 'chalk';

function truncate(s, length = 25) {
  if (s.length <= length) { return s; }
  return `${s.slice(0, length + 1)}...`;
}

function print(x, maxdepth, depth = 0, prefix = '', parents = []) {
  const indent = '  '.repeat(depth);

  const output = (() => {
    switch (typeof x) {
      case 'number': {
        return chalk.reset.yellow(x);
      }

      case 'string': {
        if (depth === 0) {
          return `'${chalk.reset.green(x)}'`;
        }
        return `'${chalk.reset.green(truncate(x))}'`;
      }

      case 'boolean': {
        return chalk.reset.magenta(x.toString());
      }

      case 'undefined': {
        return chalk.reset.gray('undefined');
      }

      case 'function': {
        if (x.__verb__) {
          const args = [x.dobjarg, x.preparg, x.iobjarg].join(', ');
          return chalk.reset.bold.cyan(`[Verb ${x.pattern}(${args})]`);
        }
        return chalk.reset.cyan('[Function]');
      }

      case 'object': {
        if (x === null) {
          return chalk.reset.gray('null');
        }

        if (Object.prototype.toString.call(x) === '[object Date]') {
          return chalk.reset.yellow(x.toString());
        }

        if (Object.prototype.toString.call(x) === '[object RegExp]') {
          return chalk.reset.red(x.toString());
        }

        if (x.constructor.name === 'JobProxy') {
          return chalk.reset.bold.yellow(x.toString());
        }

        if (parents.indexOf(x) >= 0) {
          return chalk.reset.black.bgYellow('[CircularReference]');
        }

        parents.push(x);

        if (Array.isArray(x)) {
          if (x.length === 0) {
            parents.pop(); return '[]';
          } else if (maxdepth === depth) {
            parents.pop(); return chalk.reset.blue(`[Array(${x.length})]`);
          }

          const xs = x.map(y => print(y, maxdepth, depth + 1, '', parents));

          xs[0].shift();
          xs[0].unshift('[ ');
          xs[xs.length - 1].push(' ]');
          if (prefix !== '') {
            xs[0].unshift('\n', indent);
          }
          parents.pop(); return xs.map(y => y.join('')).join(',\n');
        }

        if (Object.keys(x).length === 0) {
          parents.pop(); return '{}';
        } else if (maxdepth === depth) {
          parents.pop(); return chalk.reset.blue(x.toString());
        }

        const xs = [];
        for (const key in x) { // eslint-disable-line guard-for-in
          const value = x[key];
          const color = x.hasOwnProperty(key) ? chalk.reset.blue : chalk.reset.gray;
          const pfx = `${color(key)}: `;
          xs.push(print(value, maxdepth, depth + 1, pfx, parents));
        }

        xs[0].shift();
        xs[0].unshift('{ ');
        xs[xs.length - 1].push(' }');
        if (prefix !== '') {
          xs[0].unshift('\n', indent);
        }
        parents.pop(); return xs.map(y => y.join('')).join(',\n');
      }
      default: {
        throw new Error('Unexpected case in print.');
      }
    }
  })();
  return [indent, prefix, output];
}

function printHelper(x, maxdepth = 1) {
  return print(x, maxdepth).join('');
}

export default printHelper;
