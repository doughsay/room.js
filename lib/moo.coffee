# A MOO DB is a collection of Moo Objects
class MooDB
  # @objects: Array[MooObject]

  constructor: (@objects = []) ->

  load: (db) ->
    for o in db
      newMooObj = new MooObject o.id, o.parent, o.name, o.aliases, o.location, o.contents
      for key, value of o.properties
        newMooObj.addProperty key, value
      for v in o.verbs
        newMooObj.addVerb v.name, v.aliases, v.do, v.prep, v.io, v.code
      @objects.push newMooObj

  findById: (id) ->
    for o in @objects
      return o if o.id == id
    return null

  findByNum: (numStr) ->
    @findById parseInt numStr.match(/^#([0-9]+)$/)[1]

  # find the objects matched by the command
  findCommandObjects: (player, command) ->
    player: player
    room: if player.location? then @findById player.location else null
    do: if command.do? then @findObject command.do, player else null
    io: if command.io? then @findObject command.io, player else null

  # search string can be:
  # 'me', 'here', '#123' (an object number),
  # or an object name or alias, in which case we search "nearby"
  findObject: (search, player) ->
    return player if search == 'me'
    return @findById player.location if search == 'here'
    return @findByNum search if search.match /^#[0-9]+$/
    @findNearby search, player


  # find objects "nearby"
  # i.e. objects the player is holding, or objects in the room
  findNearby: (search, player) ->
    room = @findById player.location
    return room if room.matches search
    for oid in player.contents
      o = @findById oid
      return o if o.matches search
    for oid in room.contents
      o = @findById oid
      return o if o.matches search
    return null

  findVerb: (command, matches) ->
    if matches.player.respondsTo command
      matches.player.findVerb command
    if matches.room.respondsTo command
      matches.room.findVerb command
    else if matches.do? && matches.do.respondsTo command
      matches.do.findVerb command
    else if matches.io? && matches.io.respondsTo command
      matches.io.findVerb command
    else
      null

# A Moo Object has properties and verbs
class MooObject
  # @id: Int
  # @parent: Int
  # @name: String
  # @aliases: Array[String]
  # @location: Int
  # @contents: Array[Int]
  # @properties: Array[MooProperty]
  # @verbs: Array[MooVerb]

  constructor: (@id, @parent, @name, @aliases, @location, @contents, @properties = [], @verbs = []) ->

  toString: ->
    @name

  addProperty: (key, value) ->
    @properties.push new MooProperty key, value

  addVerb: (name, aliases, doj, prep, io, code) ->
    @verbs.push new MooVerb name, aliases, doj, prep, io, code

  respondsTo: (command) ->
    @findVerb(command)?

  # does this object match the search string?
  matches: (search) ->
    match = (x, y) -> x == y || y.indexOf(x) == 0
    return true if match search, @name
    for alias in @aliases
      return true if match search, alias

  # TODO: fix this
  findVerb: (command) ->
    for v in @verbs
      if v.name == command.verb
        return v
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
  # @do: String
  # @prep: String
  # @io: String
  # @code: String
  constructor: (@name, @aliases, @do, @prep, @io, @code) ->

serializedDb = [
  {
    id: 1
    parent: null
    name: 'root'
    aliases: []
    location: null
    contents: []
    properties: {}
    verbs: [
      {
        name: 'examine'
        aliases: ['ex']
        do: 'any'
        prep: null
        io: null
        code:"""
          player.send("Bar!")
        """
      }
    ]
  },
  {
    id: 2
    parent: 1
    name: 'root user'
    aliases: []
    location: 3
    contents: []
    properties: {}
    verbs: []
  },
  {
    id: 3
    parent: 1
    name: 'generic room'
    aliases: ['room']
    location: null
    contents: []
    properties: {
      description: 'A generic room.'
    }
    verbs: [
      {
        name: 'look'
        aliases: ['l']
        do: null
        prep: null
        io: null
        code:"""
          player.send("Foo!")
        """
      }
    ]
  }
]

db = new MooDB
db.load serializedDb

exports.db = db