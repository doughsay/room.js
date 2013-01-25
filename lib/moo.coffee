fs = require 'fs'
util = require 'util'
_ = require 'underscore'

connections = require './connection_manager'
c = require('./color').color

# A MOO DB is a collection of Moo Objects
class MooDB
  # @objects: Array[MooObject]
  # @players: Array[MooPlayer]

  objects: {}
  players: []

  constructor: (filename) ->
    util.print "loading... "
    for id, dbObject of JSON.parse fs.readFileSync filename
      if dbObject.player
        newMooObj = new MooPlayer dbObject, @
      else
        newMooObj = new MooObject dbObject, @
      @objects[parseInt(dbObject.id)] = newMooObj
      if newMooObj.player
        @players.push newMooObj
    @specials()
    util.puts "done."

  blankObject: (id, name) ->
    x =
      id: id
      parent_id: null
      name: name
      aliases: []
      location_id: null
      contents_ids: []
      player: false
      programmer: false
      properties: []
      verbs: []
    new MooObject x, @

  specials: ->
    @objects[-1] = @blankObject -1, 'nothing'
    @objects[-2] = @blankObject -2, 'ambiguous_match'
    @objects[-3] = @blankObject -3, 'failed_match'
    @nothing = @objects[-1]
    @ambiguous_match = @objects[-2]
    @failed_match = @objects[-3]
    @sys = @objects[0]

    @nothing.send = (msg) ->
      console.log msg

  save: (filename) ->
    util.puts "saving... not!"

  saveSync: (filename) ->
    util.print "saving... "
    fs.writeFileSync filename, @serialize()
    util.puts "done."

  serialize: ->
    # don't safe the special objects
    objects = _.clone(@objects)
    delete objects[-1]
    delete objects[-2]
    delete objects[-3]
    JSON.stringify objects

  findById: (id) ->
    if @objects[id]? then @objects[id] else null

  findByNum: (numStr) ->
    @findById parseInt numStr.match(/^#([0-9]+)$/)?[1]

  # buildContextForCommand: (player, command) ->
  #   context = {}
  #   for key,val of command
  #     context["$#{key}"] = val
  #   context = _.extend context, @findCommandObjects(player, command)
  #   [verb, $this] = @findVerb context
  #   context.$this = $this
  #   [verb, context]

  # find the objects matched by the command
  matchObjects: (player, command) ->
    dobj: if command.dobjstr? then @findObject command.dobjstr, player else @nothing
    iobj: if command.iobjstr? then @findObject command.iobjstr, player else @nothing

  # search string can be:
  # 'me', 'here', '#123' (an object number),
  # or an object name or alias, in which case we search "nearby"
  findObject: (search, player) ->
    return player if search == 'me'
    return player.location() if search == 'here'
    #return @findByNum search if search.match /^#[0-9]+$/
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
    return @failed_match

  matchVerb: (player, command, objects) ->
    if (verb = player.findVerb command, objects)
      verb: verb
      self: player
    else if (verb = player.location()?.findVerb command, objects)
      verb: verb
      self: player.location()
    else if (verb = objects.dobj?.findVerb command, objects)
      verb: verb
      self: objects.dobj
    else if (verb = objects.iobj?.findVerb command, objects)
      verb: verb
      self: objects.iobj
    else
      null

  # findVerb: (context) ->
  #   if context.$player.respondsTo context
  #     [context.$player.findVerb(context), context.$player]
  #   if context.$here.respondsTo context
  #     [context.$here.findVerb(context), context.$here]
  #   else if context.$dobj? && context.$dobj.respondsTo context
  #     [context.$dobj.findVerb(context), context.$dobj]
  #   else if context.$iobj? && context.$iobj.respondsTo context
  #     [context.$iobj.findVerb(context), context.$iobj]
  #   else
  #     [null, null]

  objectsAsArray: ->
    for id,object of @objects
      object

  globalAliases: ->
    @sys.properties.filter((prop) -> prop.value._mooObject?).reduce(((map, prop) ->
      map[prop.value] = '$' + prop.key
      map
    ), {})

  list: ->
    aliases = @globalAliases()
    for id,object of @objects
      x =
        id: object.id
        name: object.name
      if aliases[id]?
        x.alias = aliases[id]
      x

  search: (search) ->
    regex = new RegExp "#{search}", 'i'
    @list().filter (object) ->
      !!object.name.match regex

  inheritance_tree: (root_id) ->
    aliases = @globalAliases()

    children = (o) =>
      child_os = @objectsAsArray().filter (other_o) ->
        other_o.parent_id == o.id
      child_os.map show

    show = (o) ->
      x =
        id: o.id
        name: o.name
      if aliases[o.id]?
        x.alias = aliases[o.id]
      x.children = children o
      x

    if root_id?
      root = @findById root_id
      if root?
        top = [root]
      else
        throw new Error "Invalid root object"
    else
      top = @objectsAsArray().filter (o) ->
        o? and o.parent_id == null
    top.map show

  location_tree: (root_id) ->
    aliases = @globalAliases()

    contents = (o) =>
      o.contents().map show

    show = (o) ->
      x =
        id: o.id
        name: o.name
      if aliases[o.id]?
        x.alias = aliases[o.id]
      x.contents = contents o
      x

    if root_id?
      root = @findById root_id
      if root?
        top = [root]
      else
        throw new Error "Invalid root object"
    else
      top = @objectsAsArray().filter (o) ->
        o? and o.location_id == null
    top.map show

  usernameTaken: (username) ->
    !!(@players.filter (player) -> player.username == username).length

  playerNameTaken: (name) ->
    !!(@players.filter (player) -> player.name == name).length

  createNewPlayer: (name, username, password, programmer = false) ->
    nextId = @nextId()

    object =
      id: nextId
      parent_id: null
      name: name
      aliases: []
      location_id: null
      contents_ids: []
      username: username
      password: password
      player: true
      programmer: programmer
      properties: []
      verbs: []

    newPlayer = new MooPlayer object, @

    @objects[nextId] = newPlayer
    @players.push newPlayer

    newPlayer

  # create a clone of this object with copies of all it's properties and verbs
  clone: (object, newName, newAliases) ->
    if not (newName? and newName.toString?)
      throw new Error "Invalid name for new object"
    for alias in newAliases
      if not (alias? and alias.toString?)
        throw new Error "Invalid alias '#{alias}'"
    nextId = @nextId()
    rawObject = JSON.parse JSON.stringify object
    rawObject.id = nextId
    rawObject.parent_id = object.parent_id
    rawObject.name = newName
    rawObject.aliases = newAliases
    newObject = new MooObject rawObject, @
    newObject.moveTo object.location()
    @objects[nextId] = newObject
    # @players.push newObject if newObject.player
    true

  # Create a child of object
  # this child will inherit any of it's parent's properties and verbs
  createChild: (object, newName, newAliases) ->
    if not (newName? and newName.toString?)
      throw new Error "Invalid name for new object"
    for alias in newAliases
      if not (alias? and alias.toString?)
        throw new Error "Invalid alias '#{alias}'"
    nextId = @nextId()
    rawObject = JSON.parse JSON.stringify object
    rawObject.id = nextId
    rawObject.parent_id = object.id
    rawObject.name = newName
    rawObject.aliases = newAliases
    newObject = new MooObject rawObject, @
    newObject.moveTo object.location()
    @objects[nextId] = newObject
    # @players.push newObject if newObject.player
    true

  # terrible way to get the next available id in the DB
  nextId: ->
    # the sorted keys of the objects hash not including the 3 special objects (-1, -2 and -3)
    sortedKeys = (Object.keys @objects).sort((a,b)->a-b)[3..]
    nextId = 0
    for i in [0..sortedKeys.length+1]
      if !@objects[i]
        break
      nextId++
    nextId

  toString: ->
    "[MooDB]"

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

  constructor: (dbObject, @db) ->
    @id = dbObject.id
    @parent_id = dbObject.parent_id
    @name = dbObject.name
    @aliases = dbObject.aliases
    @location_id = dbObject.location_id
    @contents_ids = dbObject.contents_ids
    @player = !!dbObject.player
    @programmer = !!dbObject.programmer

    @properties = dbObject.properties

    @verbs = dbObject.verbs.map (verb) -> new MooVerb verb

  parent: ->
    @db.findById @parent_id

  location: ->
    if @location_id isnt null
      @db.findById @location_id
    else
      null

  moveTo: (target) ->
    loc = @location()
    if loc?
      loc.contents_ids = loc.contents_ids.filter (id) =>
        id != @id
    if target?
      target.contents_ids.push @id
      @location_id = target.id
    else
      @location_id = null

  contents: ->
    @contents_ids.map (id) => @db.findById id

  addProp: (key, value) ->
    @properties.push {key: key, value: value}

  addVerb: (verb) ->
    @verbs.push new MooVerb verb

  rmProp: (key) ->
    if key in (prop.key for prop in @properties)
      @properties = @properties.filter (prop) ->
        prop.key != key
      return true
    else
      throw new Error "property '#{key}' doesn't exist on this object."

  getProp: (key) ->
    for prop in @properties
      if prop.key == key
        return prop.value
    return @parent()?.getProp key

  setProp: (key, value) ->
    for prop in @properties
      if prop.key == key
        prop.value = value
    @addProp key, value
    return value

  chparent: (id) ->
    if not id?
      @parent_id = null
      true
    else
      object = @db.findById id
      if not object?
        throw new Error "Invalid object"
      @parent_id = id
      true

  rename: (name) ->
    if not (name? and name.toString?)
      throw new Error "Invalid name"
    nameStr = name.toString()
    if @player and @db.playerNameTaken nameStr
      throw new Error "That player name is already taken"
    else
      @name = nameStr

  updateAliases: (aliases) ->
    for alias in aliases
      if not (alias? and alias.toString?)
        throw new Error "Invalid alias '#{alias}'"
    @aliases = (alias.toString() for alias in aliases)

  addVerbPublic: (player, verbName, dobjarg, preparg, iobjarg) ->
    socket = connections.socketFor player
    verb = (@verbs.filter (v) -> v.name == verbName)[0]
    if verb?
      throw new Error "That verb already exists on this object."
    else
      newVerb = {oid: @id, name: verbName, dobjarg: dobjarg, preparg: preparg, iobjarg: iobjarg, code: ''}
      socket.emit 'edit_verb', newVerb
      true

  editVerb: (player, verbName) ->
    socket = connections.socketFor player
    verb = (@verbs.filter (v) -> v.name == verbName)[0]
    if verb?
      clonedVerb = _.clone verb
      clonedVerb.oid = @id
      socket.emit 'edit_verb', clonedVerb
      true
    else
      throw new Error "That verb does not exist on this object."

  rmVerb: (verbName) ->
    @verbs = (@verbs.filter (v) -> v.name != verbName)
    true

  saveVerb: (newVerb) ->
    for verb in @verbs
      if verb.name == newVerb.original_name
        verb.name = newVerb.name
        verb.dobjarg = newVerb.dobjarg
        verb.preparg = newVerb.preparg
        verb.iobjarg = newVerb.iobjarg
        verb.code = newVerb.code
        return true
    @addVerb newVerb
    return true

  # recursively get all properties of an object and it's parent objects
  # as a hash
  getAllProperties: (map = {}) ->
    if @parent_id?
      @parent().getAllProperties(map)
    @properties.reduce(((map, prop) ->
      map[prop.key] = prop.value
      map
    ), map)

  # recursively get all verbs of an object and it's parent objects
  getAllVerbs: (map = {}) ->
    if @parent_id?
      @parent().getAllVerbs(map)
    @verbs.reduce(((map, verb) ->
      map[verb.name] = verb
      map
    ), map)

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

  # look for a verb on this object (or it's parents) that matches the given command
  findVerb: (command, objects, self = @) ->
    for verb in @verbs
      if verb.matchesCommand command, objects, self
        return verb
    return @parent()?.findVerb command, objects, self

  # find a verb on this object (or it's parents) that matches the given name
  findVerbByName: (name) ->
    for verb in @verbs
      if verb.name == name
        return verb
    if @parent_id?
      return @parent().findVerbByName name
    return null

  toJSON: ->
    clone = _.clone @
    delete clone.db
    clone

  toString: ->
    "[MooObject #{@name}]"

# a Moo Player is just a slightly more specialized Moo Object
class MooPlayer extends MooObject
  # MooObject fields +
  # @username: String
  # @password: String
  # @player: Boolean
  # @programmer: Boolean

  constructor: (player, db) ->
    super player, db
    @username = player.username
    @password = player.password
    @player = true
    @programmer = player.programmer

  authenticates: (username, passwordHash) ->
    @username == username and @password == passwordHash

  send: (msg) ->
    socket = connections.socketFor @
    if socket?
      socket.emit 'output', "\n#{msg}"
      true
    else
      false

  broadcast: (msg) ->
    loc = @location()
    if loc?
      for o in loc.contents()
        o.send msg if o.player and o != @
      true
    else
      false

  input: (msg, fn) ->
    socket = connections.socketFor @
    if socket?
      socket.emit 'request_input', "\n#{msg}", (response) ->
        fn(response)
      true
    else
      false

  setProgrammer: (programmer) ->
    @programmer = !!programmer

  toString: ->
    "[MooPlayer #{@name}]"

# A Moo Verb is a js function which runs in a sandboxed context
class MooVerb
  # @name: String
  # @aliases: Array[String]
  # @dobjarg: String
  # @preparg: String
  # @iobjarg: String
  # @code: String
  constructor: (verb) ->
    @name = verb.name
    @dobjarg = verb.dobjarg
    @preparg = verb.preparg
    @iobjarg = verb.iobjarg
    @code = verb.code

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
  matchesName: (search) ->
    search == @name

  # does this verb match the context?
  matchesCommand: (command, objects, self) ->
    return false if not @matchesName command.verb
    switch @dobjarg
      when 'none'
        return false if objects.dobj not in [db.nothing, db.failed_match, db.ambiguous_match]
      when 'any'
        return false if objects.dobj is db.nothing
      when 'this'
        return false if objects.dobj isnt self
    switch @iobjarg
      when 'none'
        return false if objects.iobj not in [db.nothing, db.failed_match, db.ambiguous_match]
      when 'any'
        return false if objects.iobj is db.nothing
      when 'this'
        return false if objects.iobj isnt self
    switch @preparg
      when 'none'
        return false if command.prepstr isnt undefined
      when 'any'
        return false if command.prepstr is undefined
      else
        return false if command.prepstr not in @preparg.split('/')
    true

  toString: ->
    "[MooVerb #{@name}]"

db = new MooDB('db.json')
exports.db = db