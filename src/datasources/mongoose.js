'use strict';
var mongoose = require('mongoose')
  , util = require('util')
  , mongoConfig = require('../config/mongo')
  , winston = require('../lib/winston')
  , mongoLogger = winston.loggers.get('mongo')

mongoose.connect(mongoConfig.uri, mongoConfig.options, function(err) {
  if (err) {
    mongoLogger.error('unable to connect')
    throw err
  }
  mongoLogger.info('connected')
})

mongoose.set('debug', function(collectionName, method, query, doc, options) {
  mongoLogger.log ( 'verbose'
                  , [ collectionName
                    , '.'
                    , method
                    , '('
                    , (util.inspect(query, false, Infinity))
                    , ')'
                    ].join('')
                  )
})

mongoose.connection.on('error', function(err) {
  mongoLogger.error(err)
})

module.exports = mongoose
