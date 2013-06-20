process.on 'uncaughtException', (err) ->
  console.error '[uncaughtException]', err
  process.exit 1

process.on 'SIGTERM', ->
  console.log 'caught SIGTERM'
  process.exit 0

process.on 'SIGINT', ->
  console.log 'caught SIGINT'
  process.exit 0

process.on 'exit', ->
  console.log('exiting...')