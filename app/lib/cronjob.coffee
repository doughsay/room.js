_ = require 'underscore'

log4js = require './logger'
logger = log4js.getLogger 'cron'
logger.setLevel 'INFO'

context = require './context'
Cron = require './cron'

class RoomJsCronJob

  constructor: (@object, jobSpec) ->
    @db = @object.db
    {spec: @spec, verb: @verb, enabled: @enabled} = jobSpec
    @id = Cron.registerJob @
    Cron.startJob @id if @enabled

  run: ->
    logger.debug 'running job: ' + @toString()
    verb = @object.findVerbByName @verb
    if verb?
      context.runVerb @db, null, verb, @object

  enable: ->
    if not @enabled
      Cron.startJob @id
      @enabled = true
    @enabled

  disable: ->
    if @enabled
      Cron.stopJob @id
      @enabled = false
    @enabled

  unregister: ->
    @disable()
    Cron.unregisterJob @id

  toJSON: ->
    clone = _.clone @
    delete clone.object
    delete clone.id
    delete clone.db
    clone

  toString: ->
    "[Job: #{@object.toString()} '#{@spec}' #{@verb}']"

module.exports = RoomJsCronJob