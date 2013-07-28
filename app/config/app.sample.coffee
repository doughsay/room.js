appName = 'room.js'

module.exports =
  appName: appName
  port: 8888
  # socket: "/usr/local/var/run/#{appName}.socket"
  pidFile: "/usr/local/var/run/#{appName}.pid"
  env: 'development'

  dbFile: 'db.json'
  verbTimeout: 1000
  maxStack: 40

  # log levels per module
  # available levels: (each module only outputs certain levels as marked)
  # TRACE, DEBUG, INFO, WARN, ERROR, FATAL
  logLevel:
    socket:   'INFO' # DEBUG and INFO
    cron:     'INFO' # DEBUG
    context:  'INFO' # DEBUG and WARN
    db:       'INFO' # DEBUG and INFO
    server:   'INFO' # INFO, WARN, and ERROR
    client:   'INFO' # INFO
    editor:   'INFO' # DEBUG, INFO, and WARN
    compiler: 'INFO' # DEBUG and WARN
    process:  'INFO' # INFO and FATAL