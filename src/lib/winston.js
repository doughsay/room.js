'use strict';
var winston = require('winston')

winston.loggers.add('mongo', {
  console:  { level: 'silly'
            , colorize: 'true'
            , label: 'mongo'
            }
})

winston.loggers.add('socket', {
  console:  { level: 'silly'
            , colorize: 'true'
            , label: 'socket'
            }
})

winston.loggers.add('server', {
  console:  { level: 'silly'
            , colorize: 'true'
            , label: 'server'
            }
})

winston.loggers.add('vm', {
  console:  { level: 'silly'
            , colorize: 'true'
            , label: 'vm'
            }
})

module.exports = winston
