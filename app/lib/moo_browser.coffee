# A simple wrapper around the http module, allowing moo code to GET (and later POST)
http = require 'http'

log4js = require './logger'
logger = log4js.getLogger 'moo browser'

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
        callback?.call null, output.join ''
      catch error
        logger.warn "Caught Exception in browser callback: #{error.toString()}"

  client.on 'error', (error) ->
    try
      callback?.call null, "{inverse bold red|#{error.toString()}}"
    catch error
      logger.warn "Caught Exception in browser callback: #{error.toString()}"

  return undefined

exports.get = get