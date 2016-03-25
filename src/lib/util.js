import vm from 'vm';
import chalk from 'chalk';

import World from './world';
import SocketMap from './socket-map';
import { vmLogger } from './logger';

const fmtErr = chalk.black.bgRed;

function buildFunction(x, id, key) {
  const context = require('./context'); // TODO: circular import?
  const code = `(${x.__function__})`;
  const script = new vm.Script(code, { filename: `${id}.${key}` });

  function f(...args) {
    vmLogger.debug(code);
    return script.runInContext(context).apply(this, args);
  }

  // eslint-disable-next-line no-use-before-define
  modifyObject(f, (property, accessor) => {
    const source = () => x.__function__;

    accessor('__source__', source);
    property('toString', source);
  });

  return f;
}

function buildCronFunction(fn, id, onError, afterRun) {
  var context = require('./context')
    , code = '(' + fn.toString() + ')'
    , script = new vm.Script(code, { filename: 'Cron.jobs.' + id })
    , f = function () {
      vmLogger.debug(code);
      try {
              script.runInContext(context).apply(null, arguments);
            }
            catch (err) {
              vmLogger.error(err.toString());
              onError();
            }
      if (afterRun) {
              afterRun();
            }
    };

  modifyObject(f, function (property, accessor) {

    function source() {
      return fn.toString();
    }

    property('toString', source);

  });

  return f;
}

function buildVerb(verb) {
  var context = require('./context')
    , script = new vm.Script('(' + verb.code + ')', { filename: verb.name || verb.pattern })
    , f = function () { return script.runInContext(context).apply(this, arguments); };

  modifyObject(f, function (property, accessor) {

    function match(pattern, str) {
      var patternParts
        , rest;

      if (pattern === '*') {
        return true;
      }
      if (pattern.indexOf('*') !== -1) {
        patternParts = pattern.split('*');
        if (str === patternParts[0]) {
          return true;
        }
        if (str.indexOf(patternParts[0]) === 0) {
          if (patternParts[1] === '') {
            return true;
          }
          rest = str.slice(patternParts[0].length, str.length + 1);
          if (patternParts[1].indexOf(rest) === 0) {
            return true;
          }
        }
      }
      else {
        if (pattern === str) {
          return true;
        }
      }
      return false;
    }

    function matches(str) {
      return this.pattern.split(' ').reduce(function (last, pattern) {
        return last || match(pattern, str);
      }, false);
    }

    function matchesCommand(command, objects, self) {
      if (!this.matches(command.verb)) {
        return false;
      }
      switch (this.dobjarg) {
        case 'none':
          if (typeof command.dobjstr !== 'undefined') {
            return false;
          }
          break;
        case 'this':
          if (objects.dobj !== self) {
            return false;
          }
      }
      switch (this.iobjarg) {
        case 'none':
          if (typeof command.iobjstr !== 'undefined') {
            return false;
          }
          break;
        case 'this':
          if (objects.iobj !== self) {
            return false;
          }
      }
      switch (this.preparg) {
        case 'none':
          if (typeof command.prepstr !== 'undefined') {
            return false;
          }
          break;
        case 'any':
          return true;
        default:
          if (this.preparg.split('/').indexOf(command.prepstr) < 0) {
            return false;
          }
      }
      return true;
    }

    function toString() {
      return verb.code;
    }

    property('__source__', verb.code);
    property('__verb__', true);
    property('pattern', verb.pattern);
    property('dobjarg', verb.dobjarg);
    property('preparg', verb.preparg);
    property('iobjarg', verb.iobjarg);
    property('toString', toString);
    property('matches', matches);
    property('matchesCommand', matchesCommand);

  });

  return f;
}

function escapeDoubleQuotes(s) {
  return s.replace(/"/g, '\\"');
}

function escapeSlashes(s) {
  return s.replace(/\\/g, '\\\\');
}

function capitalize(s) {
  return s.length > 0 ? s[0].toUpperCase() + s.slice(1).toLowerCase() : '';
}

function stringToId(s) {
  return s.replace(/^[0-9]+/, '').split(' ').map(function (t) {
    return capitalize(t.replace(/[^\w]+/g, ''));
  }).join('');
}

function wrapString(str) {
  return typeof str === 'undefined' ? 'void 0'
                                    : '"' + escapeDoubleQuotes(escapeSlashes(str)) + '"';
}

function omap(x, fn) {
  var result = {};
  for (let key in x) {
    result[key] = fn(x[key]);
  }
  return result;
}

// serialize a value for storage into mongo
function serialize(x) {
  if (x === null || typeof x === 'undefined') {
    return x;
  }
  else {
    switch (x.constructor.name) {
      case 'Object':
        if ('__proxy__' in x && x.id && World[x.id]) {
          return { __refid__: x.id };
        }
        else if ('__function__' in x || '__refid__' in x) {
          throw new Error('Assigned objects cannot have a __function__ field or a __refid__ field.');
        }
        else {
          return omap(x, serialize);
        }
        break;
      case 'Array':
        return x.map(serialize);
      case 'Function':
        if ('__source__' in x) {
          return { __function__: x.__source__ };
        }
        else {
          return { __function__: x.toString() };
        }
        break;
      default:
        return x;
    }
  }
}

// deserialize values from mongo
function deserialize(x, id, key) {
  if (x === null || typeof x === 'undefined') {
    return x;
  }
  else {
    switch (x.constructor.name) {
      case 'Object':
        if ('__function__' in x) {
          return buildFunction(x, id, key);
        }
        else {
          return omap(x, function (y) { return deserialize(y); });
        }
        break;
      case 'Array':
        return x.map(function (y) { return deserialize(y); });
      default:
        return x;
    }
  }
}

function serializeVerb(name, verb) {
  return { name: name
          , pattern: verb.pattern
          , dobjarg: verb.dobjarg
          , preparg: verb.preparg
          , iobjarg: verb.iobjarg
          , code: verb.__source__
          };
}

function deserializeReferences(x) {
  if (x === null || typeof x === 'undefined') {
    return x;
  }
  else {
    switch (x.constructor.name) {
      case 'Object':
        if ('__refid__' in x) {
          return World[x.__refid__];
        }
        else if ('__proxy__' in x) {
          return x;
        }
        else {
          return omap(x, function (y) { return deserializeReferences(y); });
        }
        break;
      case 'Array':
        return x.map(function (y) { return deserializeReferences(y); });
      default:
        return x;
    }
  }
}

function modifyObject(object, callback) {
  function property(name, value, enumerable) {
    var opts;

    // default enumerable to false
    if (typeof enumerable === 'undefined') {
      enumerable = false;
    }

    opts = { writable: false
            , configurable: false
            , enumerable: enumerable
            , value: value
            };

    Object.defineProperty(object, name, opts);
  }

  function accessor(name, get, set, enumerable) {
    var opts;

    // default enumerable to true
    if (typeof enumerable === 'undefined') {
      enumerable = true;
    }

    opts = { configurable: false
            , enumerable: enumerable
            };

    if (get) { opts.get = get; }
    if (set) { opts.set = set; }

    Object.defineProperty(object, name, opts);
  }

  callback(property, accessor);
}

function overrideToString(fn, name) {
  fn.toString = function () { return 'function ' + name + '() { [native code] }'; };
}

function formatError(err) {
  return fmtErr(err.toString());
}

function sendError(player, err) {
  var socket = SocketMap[player.id]
    , output = player.isProgrammer ? formatError(err)
                                    : fmtErr('An internal error occurred.');

  socket.emit('output', output);
}

function titleize(str) {
  if (str == null) return '';
  str = String(str).toLowerCase();
  return str.replace(/(?:^|\s|-)\S/g, function (c) { return c.toUpperCase(); });
}

function classify(str) {
  return titleize(String(str).replace(/[\W_]/g, ' ')).replace(/\s/g, '');
}

function nextId(raw) {
  var str = classify(raw);
  if (!World[str]) {
    return str;
  }
  else {
    let i = 1;
    while (World[str + i]) {
      i++;
    }
    return str + i;
  }
}

// function intersperse(sep, xs) {
//   var i = xs.length
//     , ys = new Array(i);
//
//   if (i < 2) { return xs; }
//   i = i * 2 - 1;
//   while (i--) { ys[i] = i % 2 === 0 ? xs[Math.floor(i / 2)] : sep; }
//   return ys;
// }

module.exports = { buildFunction: buildFunction
                  , buildVerb: buildVerb
                  , escapeSlashes: escapeSlashes
                  , stringToId: stringToId
                  , wrapString: wrapString
                  , serialize: serialize
                  , deserialize: deserialize
                  , serializeVerb: serializeVerb
                  , deserializeReferences: deserializeReferences
                  , modifyObject: modifyObject
                  , buildCronFunction: buildCronFunction
                  , overrideToString: overrideToString
                  , formatError: formatError
                  , sendError: sendError
                  , nextId: nextId
                  // , intersperse: intersperse
                  };
