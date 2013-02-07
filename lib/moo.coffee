fs = require 'fs'
util = require 'util'
_ = require 'underscore'

connections = require './connection_manager'
c = require('./color').color
mooUtil = require './util'

# some constants
`const NO_MATCH = 0`
`const EXACT_MATCH = 1`
`const PARTIAL_MATCH = 2`

# A MOO DB is a collection of Moo Objects
class MooDB
  # @objects: Array[MooObject]
  # @players: Array[MooPlayer]

  objects: {}
  players: []

  constructor: (@filename) ->
    startTime = mooUtil.tstart()
    for id, dbObject of JSON.parse fs.readFileSync @filename
      if dbObject.player
        newMooObj = new MooPlayer dbObject, @
      else
        newMooObj = new MooObject dbObject, @
      @objects[parseInt(dbObject.id)] = newMooObj
      if newMooObj.player
        @players.push newMooObj
    @specials()
    util.log "#{@filename} loaded in #{mooUtil.tend startTime}"

    @saveInterval = setInterval @save, 5*60*1000

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

  save: =>
    startTime = mooUtil.tstart()
    fs.writeFile '_' + @filename, @serialize(), (err) =>
      throw err if err
      fs.rename '_' + @filename, @filename, (err) =>
        throw err if err
        util.log "#{@filename} saved in #{mooUtil.tend startTime}"

  saveSync: =>
    startTime = mooUtil.tstart()
    fs.writeFileSync '_' + @filename, @serialize()
    fs.renameSync '_' + @filename, @filename
    util.log "#{@filename} saved in #{mooUtil.tend startTime}"

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

  # find the objects matched by the command
  matchObjects: (player, command) ->
    dobj: if command.dobjstr? then @findObject command.dobjstr, player else @nothing
    iobj: if command.iobjstr? then @findObject command.iobjstr, player else @nothing

  # search string can be:
  # 'me', 'here'
  # or an object name or alias, in which case we search "nearby"
  findObject: (search, player) ->
    return player if search == 'me'
    return player.location() if search == 'here'
    #return @findByNum search if search.match /^#[0-9]+$/
    @findNearby search, player

  # find objects "nearby"
  # i.e. objects the player is holding, or objects in the room
  findNearby: (search, player) ->
    return @failed_match if search == ''

    searchItems = player.contents().concat player.location().contents().filter (o) -> o != player
    matches = searchItems.map (item) -> [item.matches(search), item]
    exactMatches = matches.filter (match) -> match[0] == EXACT_MATCH
    partialMatches = matches.filter (match) -> match[0] == PARTIAL_MATCH

    if exactMatches.length == 1
      return exactMatches[0][1]
    else if exactMatches.length > 1
      return @ambiguous_match

    if partialMatches.length == 1
      return partialMatches[0][1]
    else if partialMatches.length > 1
      return @ambiguous_match

    return @failed_match

  # return a list of matched objects for moo-side use
  mooMatch: (search, player) =>
    return [] if search == ''

    searchItems = player.contents().concat player.location().contents().filter (o) -> o != player
    matches = searchItems.map (item) -> [item.matches(search), item]
    exactMatches = matches.filter (match) -> match[0] == EXACT_MATCH
    partialMatches = matches.filter (match) -> match[0] == PARTIAL_MATCH

    if exactMatches.length == 1
      return [exactMatches[0][1]]
    else if exactMatches.length > 1
      return exactMatches.map (match) -> match[1]

    if partialMatches.length == 1
      return [partialMatches[0][1]]
    else if partialMatches.length > 1
      return partialMatches.map (match) -> match[1]

    return []

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

  objectsAsArray: ->
    for id,object of @objects
      object

  globalAliases: ->
    @sys.properties.filter((prop) -> prop.value._mooObject?).reduce(((map, prop) ->
      map[prop.value._mooObject] = '$' + prop.key
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
    rawObject.properties = []
    rawObject.verbs = []
    rawObject.id = nextId
    rawObject.parent_id = object.id
    rawObject.name = newName
    rawObject.aliases = newAliases
    newObject = new MooObject rawObject, @
    newObject.moveTo object.location()
    @objects[nextId] = newObject

  rm: (id) ->
    if id > -1 and @findById(id)?
      if @objects[id].player
        @players = @players.filter (p) -> p.id != id
      delete @objects[id]
      true
    else
      false

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
    if @hasOwnProp key
      @properties = @properties.filter (prop) -> prop.key != key
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
        return prop.value = value
    @addProp key, value
    return value

  hasOwnProp: (key) ->
    key in (prop.key for prop in @properties)

  inheritsProp: (key) ->
    !!@parent()?.getAllProperties()[key]?

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
    verb = (@verbs.filter (v) -> v.matchesName verbName)[0]
    if verb?
      clonedVerb = _.clone verb
      clonedVerb.oid = @id
      socket.emit 'edit_verb', clonedVerb
      true
    else
      throw new Error "That verb does not exist on this object."

  rmVerb: (verbName) ->
    if @hasOwnVerb verbName
      @verbs = (@verbs.filter (v) -> v.name != verbName)
      true
    else
      throw new Error "verb '#{verbName}' doesn't exist on this object."

  hasOwnVerb: (verbName) ->
    verbName in (verb.name for verb in @verbs)

  inheritsVerb: (verbName) ->
    !!@parent()?.getAllVerbs()[verbName]?

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

  # does this object exactly or partially match the search string?
  matches: (search) ->
    match = (x, y) ->
      x = x.toLowerCase()
      y = y.toLowerCase()
      return EXACT_MATCH if x == y
      return PARTIAL_MATCH if x.indexOf(y) == 0
      return NO_MATCH

    names = @aliases.concat [@name]
    matches = names.map (name) -> match name, search

    return EXACT_MATCH if EXACT_MATCH in matches
    return PARTIAL_MATCH if PARTIAL_MATCH in matches
    return NO_MATCH

  # look for a verb on this object (or it's parents) that matches the given command
  findVerb: (command, objects, self = @) ->
    for verb in @verbs
      if verb.matchesCommand command, objects, self
        return verb
    return @parent()?.findVerb command, objects, self

  # find a verb on this object (or it's parents) that matches the given name
  findVerbByName: (name) ->
    for verb in @verbs
      if verb.matchesName name
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

  online: ->
    (connections.socketFor @)?

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
        return false if objects.dobj not in [db.nothing, db.failed_match, db.ambiguous_match]
      # when 'any' anything goes!
      when 'this'
        return false if objects.dobj isnt self
    switch @iobjarg
      when 'none'
        return false if objects.iobj not in [db.nothing, db.failed_match, db.ambiguous_match]
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

  toString: ->
    "[MooVerb #{@name}]"

db = new MooDB('db.json')
exports.db = db