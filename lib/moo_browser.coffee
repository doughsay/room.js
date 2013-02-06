# A simple wrapper around the http module, allowing moo code to GET (and later POST)
http = require 'http'

c = require('./color').color

get = (host, path = '/', callback) ->
  throw new Error "No host specified" if not host?

  options =
    host: host
    path: path

  client = http.get options, (response) ->
    output = []
    response.on 'data', (chunk) ->
      output.push chunk
    response.on 'end', ->
      try
        callback? output.join ''
      catch error
        console.log "Caught Exception in browser callback: #{error.toString()}"

  client.on 'error', (error) ->
    try
      callback? c error.toString(), 'inverse bold red'
    catch error
      console.log "Caught Exception in browser callback: #{error.toString()}"

  return undefined

exports.get = get