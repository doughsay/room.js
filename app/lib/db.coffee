fs = require 'fs'
_ = require 'underscore'
EventEmitter = require('events').EventEmitter

log4js = require './logger'
logger = log4js.getLogger 'db'

mooUtil = require './util'

RoomJsObject = require('./object').RoomJsObject
RoomJsPlayer = require('./player').RoomJsPlayer

# some constants
NO_MATCH = 0
EXACT_MATCH = 1
PARTIAL_MATCH = 2

# A Db is a collection of RoomJsObjects
module.exports = class Db extends EventEmitter

  objects: {}
  players: []

  constructor: (@filename, @getContext) ->
    startTime = mooUtil.tstart()

    if fs.existsSync @filename
      {nextId: @_nextId, objects: dbObjects} = JSON.parse fs.readFileSync @filename
    else
      {nextId: @_nextId, objects: dbObjects} = JSON.parse fs.readFileSync 'db.seed.json'

    for id, dbObject of dbObjects
      newMooObj = if dbObject.player
        new RoomJsPlayer id, dbObject, @
      else
        new RoomJsObject id, dbObject, @

      @objects[id] = newMooObj

      if newMooObj.player
        @players.push newMooObj

    @specials()

    @saveInterval = setInterval @save, 5*60*1000

    process.on 'exit', => @exit()

    logger.info "#{@filename} loaded in #{mooUtil.tend startTime}"

  exit: ->
    for player in @players
      if player.socket?
        player.socket.emit 'output', '{red|Server shutting down.}'
        # player.socket.disconnect()
    @saveSync()

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
    new RoomJsObject id, x, @

  specials: ->
    @nothing         = @blankObject 'nothing', 'nothing'
    @ambiguous_match = @blankObject 'ambiguous_match', 'ambiguous_match'
    @failed_match    = @blankObject 'failed_match', 'failed_match'
    @sys             = @objects.sys

  save: =>
    startTime = mooUtil.tstart()
    fs.writeFile '_' + @filename, @serialize(), (err) =>
      throw err if err
      fs.rename '_' + @filename, @filename, (err) =>
        throw err if err
        logger.info "#{@filename} saved in #{mooUtil.tend startTime}"

  saveSync: ->
    startTime = mooUtil.tstart()
    fs.writeFileSync '_' + @filename, @serialize()
    fs.renameSync '_' + @filename, @filename
    logger.info "#{@filename} saved in #{mooUtil.tend startTime}"

  serialize: ->
    JSON.stringify {nextId: @_nextId, objects: @objects}

  reId: (oldId, newId) ->
    like = (x, y) ->
      if not (x? and y?)
        return false
      x.toString() is y.toString()

    reIdVal = (x) ->
      if not x?
        false
      else if x._mooObject? and like x._mooObject, oldId
        x._mooObject = newId
        true
      else if typeof x is 'object'
        answers = for key, val of x
          reIdVal val
        true in _.flatten answers

    oldId = oldId.toString()
    newId = newId.toString()

    if @objects[newId]?
      throw new Error "An object with id '#{newId}' already exists."

    objectToChange = @objects[oldId]

    if objectToChange?
      objectToChange.id = newId
      # console.log "object id changed: #{objectToChange.toString()}"

      for id, object of @objects
        # console.log "checking object: #{object.toString()}"
        if like object.parent_id, oldId
          object.parent_id = newId
          # we don't need to emit an event here, because according to the editor, the parent didn't really change
          # console.log "changed parent of: #{object.toString()}"

        if like object.location_id, oldId
          object.location_id = newId
          # no event needed, editor doesn't care about object locations
          # console.log "changed location of: #{object.toString()}"

        for key, val of object.getOwnProperties()
          if not val?
            continue
          else if val._mooObject? and like val._mooObject, oldId
            val._mooObject = newId
            object.setProp key, val
            # setProp emits its own event
            # console.log "changed prop '#{key}' of: #{object.toString()}"
          else if typeof val is 'object'
            save = reIdVal val
            if save
              object.setProp key, val
              # setProp emits its own event
              # console.log "changed prop '#{key}' of: #{object.toString()}"

      delete @objects[oldId]
      @objects[newId] = objectToChange
      @emit 'objectIDChanged', oldId, newId
      true
    else
      false

  findById: (id) ->
    switch id
      when 'nothing'
        @nothing
      when 'ambiguous_match'
        @ambiguous_match
      when 'failed_match'
        @failed_match
      else
        if @objects[id]? then @objects[id] else null

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
      self = player
    else if (verb = player.location()?.findVerb command, objects)
      self = player.location()
    else if (verb = objects.dobj?.findVerb command, objects)
      self = objects.dobj
    else if (verb = objects.iobj?.findVerb command, objects)
      self = objects.iobj
    if verb and not verb.hidden
      verb: verb
      self: self
    else
      null

  objectsAsArray: -> object for id, object of @objects

  search: (search) ->
    @objectsAsArray().filter (object) ->
      object.name.toLowerCase().indexOf(search.toLowerCase()) >= 0

  usernameTaken: (username) ->
    !!(@players.filter (player) -> player.username == username).length

  playerNameTaken: (name) ->
    !!(@players.filter (player) -> player.name == name).length

  createNewPlayer: (name, username, password, programmer = false) ->
    nextId = @nextId()

    object =
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
      lastActivity: (new Date()).toString()

    newPlayer = new RoomJsPlayer nextId, object, @

    @objects[nextId] = newPlayer
    @players.push newPlayer

    @emit 'objectCreated', nextId

    newPlayer

  createNewObject: (name) ->
    nextId = @nextId()
    @objects[nextId] = @blankObject nextId, name
    @emit 'objectCreated', nextId
    @objects[nextId]

  # create a clone of this object with copies of all it's properties and verbs
  clone: (object, newName, newAliases) ->
    if not (newName? and newName.toString?)
      throw new Error "Invalid name for new object"
    for alias in newAliases
      if not (alias? and alias.toString?)
        throw new Error "Invalid alias '#{alias}'"
    nextId = @nextId()
    rawObject = JSON.parse JSON.stringify object
    rawObject.parent_id = object.parent_id
    rawObject.name = newName
    rawObject.aliases = newAliases
    newObject = new RoomJsObject nextId, rawObject, @
    newObject.moveTo object.location()
    @objects[nextId] = newObject
    @emit 'objectCreated', nextId
    newObject

  # Create a child of object
  # this child will inherit any of it's parent's properties and verbs
  createChild: (object, newName, newAliases = []) ->
    if not (newName? and newName.toString?)
      throw new Error "Invalid name for new object"
    for alias in newAliases
      if not (alias? and alias.toString?)
        throw new Error "Invalid alias '#{alias}'"
    nextId = @nextId()
    rawObject = JSON.parse JSON.stringify object
    rawObject.properties = []
    rawObject.verbs = []
    rawObject.parent_id = object.id
    rawObject.name = newName
    rawObject.aliases = newAliases
    newObject = new RoomJsObject nextId, rawObject, @
    newObject.moveTo object.location()
    @objects[nextId] = newObject
    @emit 'objectCreated', nextId
    newObject

  rm: (id) ->
    if id not in ['nothing', 'ambiguous_match', 'failed_match'] and @findById(id)?
      object = @findById id
      if object.children().length > 0
        throw new Error 'That object cannot be removed because it has children'
      object.moveTo null
      if @objects[id].player
        @players = @players.filter (p) -> p.id != id
      delete @objects[id]
      @emit 'objectDeleted', id
      true
    else
      false

  nextId: -> (@_nextId++).toString()