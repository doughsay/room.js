app_config = require './app'

module.exports =
  file: "log/#{app_config.env}.log"
  backups: 10
  max_size: 20971520
  levels:
    # log levels per module
    # available levels: (each module only outputs certain levels as marked)
    # TRACE, DEBUG, INFO, WARN, ERROR, FATAL
    socket:   'INFO'  # DEBUG and INFO
    cron:     'INFO'  # DEBUG
    context:  'INFO'  # DEBUG and WARN
    db:       'INFO'  # DEBUG and INFO
    server:   'INFO'  # INFO, WARN, and ERROR
    client:   'INFO'  # INFO
    editor:   'INFO'  # DEBUG, INFO, and WARN
    compiler: 'INFO'  # DEBUG and WARN
    process:  'INFO'  # INFO and FATAL
    mongoose: 'DEBUG' # DEBUG and INFO
