_ = require 'underscore'

connections = require './connection_manager'

RoomJsVerb = require('./verb').RoomJsVerb
RoomJsCronJob = require './cronjob'

# some constants
NO_MATCH = 0
EXACT_MATCH = 1
PARTIAL_MATCH = 2

# A RoomJsObject has properties and RoomJsVerbs
exports.RoomJsObject = class
  # @id: Int
  # @parent_id: Int
  # @name: String
  # @aliases: Array[String]
  # @location_id: Int
  # @contents_ids: Array[Int]
  # @properties: Array[Object]
  # @verbs: Array[RoomJsVerb]

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

    @verbs = dbObject.verbs.map (verb) =>
      new RoomJsVerb verb, @db

    cronjobs = dbObject.crontab or []
    @crontab = cronjobs.map (job) => new RoomJsCronJob @, job

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
    @verbs.push new RoomJsVerb verb, @db

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

  addVerbPublic: (player, verbName, hidden, dobjarg, preparg, iobjarg) ->
    socket = connections.socketFor player
    verb = (@verbs.filter (v) -> v.name == verbName)[0]
    if verb?
      throw new Error "That verb already exists on this object."
    else
      newVerb = {oid: @id, name: verbName, hidden: hidden, dobjarg: dobjarg, preparg: preparg, iobjarg: iobjarg, code: ''}
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
        verb.hidden = newVerb.hidden
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
    "[RoomJsObject #{@name}]"