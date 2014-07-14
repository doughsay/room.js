'use strict';
var pkg = require('../../package.json')

module.exports =
  { appName: pkg.name
  , version: pkg.version
  , port: 8888
  // , socket: "/tmp/#{pkg.name}.sock"
  , clientAddress: 'http://localhost:4200'
  }
