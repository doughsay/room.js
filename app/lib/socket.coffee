fs = require 'fs'
{socket} = require '../config/app'

process.on 'exit', -> fs.unlink socket