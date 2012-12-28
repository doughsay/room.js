_ = require 'underscore'
c = require('./color').color

# A MOO DB is a collection of Moo Objects
class MooDB
  # @objects: Array[MooObject]

  constructor: (@objects = {}) ->

  load: (db) ->
    for o in db
      newMooObj = new MooObject o.id, o.parent_id, o.name, o.aliases, o.location_id, o.contents_ids
      for key, value of o.properties
        newMooObj.addProperty key, value
      for v in o.verbs
        newMooObj.addVerb v.name, v.dobjarg, v.preparg, v.iobjarg, v.code
      @objects[parseInt(o.id)] = newMooObj

  findById: (id) ->
    if @objects[id] then @objects[id] else null

  findByNum: (numStr) ->
    @findById parseInt numStr.match(/^#([0-9]+)$/)[1]

  buildContextForCommand: (player, command) ->
    context = _({c: c}).extend @findCommandObjects(player, command), command
    verb = @findVerb context
    [verb, context]

  # find the objects matched by the command
  findCommandObjects: (player, command) ->
    player: player
    dobj: if command.dobjstr? then @findObject command.dobjstr, player else null
    iobj: if command.iobjstr? then @findObject command.iobjstr, player else null

  # search string can be:
  # 'me', 'here', '#123' (an object number),
  # or an object name or alias, in which case we search "nearby"
  findObject: (search, player) ->
    return player if search == 'me'
    return player.location() if search == 'here'
    return @findByNum search if search.match /^#[0-9]+$/
    @findNearby search, player


  # find objects "nearby"
  # i.e. the room, objects the player is holding, or objects in the room
  findNearby: (search, player) ->
    room = player.location()
    return room if room.matches search
    for o in player.contents()
      return o if o.matches search
    for o in room.contents()
      return o if o.matches search
    return null

  findVerb: (context) ->
    if context.player.respondsTo context
      context.player.findVerb context
    if context.player.location_id? && context.player.location().respondsTo context
      context.player.location().findVerb context
    else if context.dobj? && context.dobj.respondsTo context
      context.dobj.findVerb context
    else if context.iobj? && context.iobj.respondsTo context
      context.iobj.findVerb context
    else
      null

# A Moo Object has properties and verbs
class MooObject
  # @id: Int
  # @parent_id: Int
  # @name: String
  # @aliases: Array[String]
  # @location_id: Int
  # @contents_ids: Array[Int]
  # @properties: Array[MooProperty]
  # @verbs: Array[MooVerb]

  constructor: (@id, @parent_id, @name, @aliases, @location_id, @contents_ids, @properties = [], @verbs = []) ->

  toString: ->
    "[MooObject #{@name}]"

  addProperty: (key, value) ->
    @properties.push new MooProperty key, value

  addVerb: (name, dobjarg, preparg, iobjarg, code) ->
    @verbs.push new MooVerb name, dobjarg, preparg, iobjarg, code

  parent: ->
    if @parent_id
      db.findById @parent_id
    else
      null

  location: ->
    if @location_id
      db.findById @location_id
    else
      null

  contents: ->
    @contents_ids.map (id) -> db.findById id

  prop: (key, newValue = undefined) ->
    if newValue?
      for prop in @properties
        if prop.key == key
          prop.value = newValue
          return newValue
      @addProperty key, newValue
      return newValue
    else
      for prop in @properties
        return prop.value if prop.key == key
      return undefined

  # does this object match the search string?
  # TODO: make it work like this:
  # FROM THE LAMBDAMOO MANUAL:
  # The server checks to see if the object string in the command is either
  # exactly equal to or a prefix of any alias; if there are any exact
  # matches, the prefix matches are ignored. If exactly one of the objects
  # being considered has a matching alias, that object is used. If more
  # than one has a match, then the special object #-2 (aka
  # $ambiguous_match in LambdaCore) is used. If there are no matches, then
  # the special object #-3 (aka $failed_match in LambdaCore) is used.
  #
  # for now, the first object found to match is used
  matches: (search) ->
    match = (x, y) -> x == y || y.indexOf(x) == 0
    return true if match search, @name
    for alias in @aliases
      return true if match search, alias

  # does this object respond to this verb?
  respondsTo: (context) ->
    @findVerb(context)?

  # look for a verb on this object (or it's parents) that matches the given context
  findVerb: (context) ->
    for verb in @verbs
      if verb.matchesContext context
        return verb
      else if @parent_id
        return @parent().findVerb context
    return null

  # player specific methods

  send: (msg) ->
    if @socket
      @socket.emit 'output', {msg: msg}

  disconnect: ->
    if @socket
      @socket.disconnect()
      @socket = null

# A Moo Property is basically a single key value store
class MooProperty
  # @key: String
  # @value: String|Int|Float|Array[String|Int|Float|Array]
  constructor: (@key, @value) ->

# A Moo Verb is a js function which runs in a sandboxed context
class MooVerb
  # @name: String
  # @aliases: Array[String]
  # @dobjarg: String
  # @preparg: String
  # @iobjarg: String
  # @code: String
  constructor: (@name, @dobjarg, @preparg, @iobjarg, @code) ->

  # does this verb match the search string?
  # TODO: make it work like this:
  # FROM THE LAMBDAMOO MANUAL:
  # Every verb has one or more names; all of the names are kept in a single string,
  # separated by spaces. In the simplest case, a verb-name is just a word made up
  # of any characters other than spaces and stars (i.e., ` ' and `*'). In this
  # case, the verb-name matches only itself; that is, the name must be matched
  # exactly.
  #
  # If the name contains a single star, however, then the name matches any prefix
  # of itself that is at least as long as the part before the star. For example,
  # the verb-name `foo*bar' matches any of the strings `foo', `foob', `fooba', or
  # `foobar'; note that the star itself is not considered part of the name.
  #
  # If the verb name ends in a star, then it matches any string that begins with
  # the part before the star. For example, the verb-name `foo*' matches any of the
  # strings `foo', `foobar', `food', or `foogleman', among many others. As a
  # special case, if the verb-name is `*' (i.e., a single star all by itself),
  # then it matches anything at all.
  #
  # for now, just exact matches are considered
  matches: (search) ->
    search == @name

  # does this verb match the context?
  matchesContext: (context) ->
    return false if not @matches context.verb
    switch @dobjarg
      when 'none'
        return false if context.dobj?
      when 'any'
        return false if not context.dobj?
      when 'this'
        # TODO
        return false
    switch @iobjarg
      when 'none'
        return false if context.iobj?
      when 'any'
        return false if not context.dobj?
      when 'this'
        # TODO
        return false
    switch @preparg
      when 'none'
        return false if context.prepstr?
      when 'any'
        return false if not context.prepstr?
      else
        # TODO: improve this?  e.g. 'with' and 'using' are interchangeable.
        return false if context.prepstr != @preparg
    true

serializedDb = [
  {
    id: 1
    parent_id: null
    name: 'root'
    aliases: []
    location_id: null
    contents_ids: []
    properties: {}
    verbs: [
      {
        name: 'examine'
        dobjarg: 'any'
        preparg: 'none'
        iobjarg: 'none'
        code:"""
          player.send("\\nIt looks uninteresting.")
        """
      }
    ]
  },
  {
    id: 2
    parent_id: 1
    name: 'root user'
    aliases: []
    location_id: 3
    contents_ids: []
    properties: {}
    verbs: []
  },
  {
    id: 3
    parent_id: 1
    name: 'generic room'
    aliases: ['room']
    location_id: null
    contents_ids: [2]
    properties: {
      description: 'A generic room.'
    }
    verbs: [
      {
        name: 'look'
        dobjarg: 'none'
        preparg: 'none'
        iobjarg: 'none'
        code:"""
          var loc = player.location()
          player.send("\\n"+c(loc.name, 'yellow bold') + "\\n" + loc.prop('description'))
        """
      }
    ]
  }
]

db = new MooDB
db.load serializedDb

exports.db = db