_ = require 'underscore'
coffee = require 'coffee-script'
util = require 'util'
vm = require 'vm'

# A RoomJsVerb is a js function which runs in a sandboxed context
exports.RoomJsVerb = class
  # @name: String
  # @hidden: Bool
  # @aliases: Array[String]
  # @dobjarg: String
  # @preparg: String
  # @iobjarg: String
  # @code: String
  # @lang: String
  # @compiledCode: String
  constructor: (verb, @object) ->
    @name = verb.name
    @hidden = verb.hidden
    @dobjarg = verb.dobjarg
    @preparg = verb.preparg
    @iobjarg = verb.iobjarg
    @code = verb.code
    @lang = verb.lang or 'coffeescript' # default to coffeescript because that's all we supported at first
    @script = null
    @compile()

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
        return false if objects.dobj not in [@object.db.nothing, @object.db.failed_match, @object.db.ambiguous_match]
      # when 'any' anything goes!
      when 'this'
        return false if objects.dobj isnt self
    switch @iobjarg
      when 'none'
        return false if objects.iobj not in [@object.db.nothing, @object.db.failed_match, @object.db.ambiguous_match]
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

  # the name to use when as a property of an object
  propName: ->
    propName = @name.split(' ')[0]
    # if the name has a * in it, remove it. (unless it's only a *)
    if propName != '*'
      propName = propName.replace '*', ''

    propName

  compile: ->
    compiledCode = switch @lang
      when 'coffeescript'
        coffee.compile @wrappedCode(), bare: true
      when 'javascript'
        @wrappedCode()
      else
        throw new Error 'invalid verb language specified in compileCode:', @lang
    @script = vm.createScript compiledCode
    true

  wrappedCode: ->
    switch @lang
      when 'coffeescript'
        """
        (->
        #{@code.split('\n').map((line) -> '  ' + line).join('\n')}
        ).call(self)
        """
      when 'javascript'
        """
        (function() {
        #{@code}
        }).call(self);
        """
      else
        throw new Error 'invalid verb language:', @lang

  toJSON: ->
    clone = _.clone @
    delete clone.object
    clone

  toString: ->
    "[RoomJsVerb #{@name}]"