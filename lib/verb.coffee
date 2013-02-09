_ = require 'underscore'

# A RoomJsVerb is a js function which runs in a sandboxed context
exports.RoomJsVerb = class
  # @name: String
  # @hidden: Bool
  # @aliases: Array[String]
  # @dobjarg: String
  # @preparg: String
  # @iobjarg: String
  # @code: String
  constructor: (verb, @db) ->
    @name = verb.name
    @hidden = verb.hidden
    @dobjarg = verb.dobjarg
    @preparg = verb.preparg
    @iobjarg = verb.iobjarg
    @code = verb.code

  # does this verb match the search string?
  matchesName: (search) ->
    match = (name, search) ->
      return true if name == '*'
      if name.indexOf('*') != -1
        nameParts = name.split '*'
        return true if search == nameParts[0]
        if search.indexOf(nameParts[0]) == 0
          return true if nameParts[1] == ''
          rest = search[nameParts[0].length..search.length]
          return true if nameParts[1].indexOf(rest) == 0
      else
        return true if name == search

      false

    names = @name.split ' '
    for name in names
      return true if match name, search

    false

  # does this verb match the context?
  matchesCommand: (command, objects, self) ->
    return false if not @matchesName command.verb
    switch @dobjarg
      when 'none'
        return false if objects.dobj not in [@db.nothing, @db.failed_match, @db.ambiguous_match]
      # when 'any' anything goes!
      when 'this'
        return false if objects.dobj isnt self
    switch @iobjarg
      when 'none'
        return false if objects.iobj not in [@db.nothing, @db.failed_match, @db.ambiguous_match]
      # when 'any' anything goes!
      when 'this'
        return false if objects.iobj isnt self
    switch @preparg
      when 'none'
        return false if command.prepstr isnt undefined
      when 'any' # anything goes!
        return true
      else
        return false if command.prepstr not in @preparg.split('/')
    true

  toJSON: ->
    clone = _.clone @
    delete clone.db
    clone

  toString: ->
    "[RoomJsVerb #{@name}]"