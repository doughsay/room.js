fs = require 'fs'
{pidFile} = require '../config/app'

fs.writeFileSync pidFile, "#{process.pid}\n"

process.on 'exit', -> fs.unlink pidFile