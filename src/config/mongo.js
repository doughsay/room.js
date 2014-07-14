'use strict';
var appName = require('./app').appName

module.exports =
  { uri: 'mongodb://localhost/' + appName
  , options: { server: { poolSize: 5 } }
  }
