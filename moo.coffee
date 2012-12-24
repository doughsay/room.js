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

  getById: (id) ->
    for o in @objects
      return o if o.id == id
    return null

  # simple matching.  TODO: more complex matching.
  findNearbyByName: (name, player) ->
    room = @getById player.location
    for oid in player.contents
      o = @getById oid
      return o if o.name == name
    for oid in room.contents
      o = @getById oid
      return o if o.name == name
    return null

  # find the objects matched by the command
  findMatchedObjects: (player, command) ->
    player: player
    room: if player.location? then @getById player.location else null
    do: if command.do? then @findNearbyByName command.do, player else null
    io: if command.io? then @findNearbyByName command.io, player else null

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

  addProperty: (key, value) ->
    @properties.push new MooProperty key, value

  addVerb: (name, aliases, doj, prep, io, code) ->
    @verbs.push new MooVerb name, aliases, doj, prep, io, code

  respondsTo: (command) ->
    @findVerb(command)?

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

# A Moo Verb is a coffeescript function which runs in a sandboxed context
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