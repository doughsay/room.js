'use strict';
var World = require('./world')
  , winston = require('./winston')
  , vmLogger = winston.loggers.get('vm')
  , context = require('./context')
  , vm = require('vm')
  , util = require('./util')

function hookExists(object, hookName) {
  return World[object] && typeof World[object][hookName] === 'function'
}

// run an event hook if it exists
function runHook() {
  var args = [].slice.call(arguments)
    , playerId = args.shift()
    , object = args.shift()
    , hook = args.shift()
    , player = playerId ? World[playerId] : void 0

  if (hookExists(object, hook)) {
    let code = object + '.' + hook + '(' + args.join(', ') + ')'

    vmLogger.debug(code)

    try {
      vm.runInContext(code, context, {filename: 'Hook::' + object + '.' + hook, timeout: 500})
    }
    catch (err) {
      if (player && player.isOnline) {
        util.sendError(player, err)
      }
      else {
        vmLogger.error(err.toString())
      }
    }
  }
}

module.exports = runHook
