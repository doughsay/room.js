appName = 'room.js'

module.exports =
  appName: appName
  port: 8888
  # socket: "/usr/local/var/run/#{appName}.socket"
  pidFile: "/usr/local/var/run/#{appName}.pid"
  env: 'development'

  dbFile: 'db.json'
  verbTimeout: 2000
  maxStack: 40