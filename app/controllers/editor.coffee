log4js = require '../lib/logger'
logger = log4js.getLogger 'editor'

phash = require('../lib/hash').phash

EditorInterface = require '../lib/editor_interface'

# An Editor represents a socket.io connection from the web editor.
# It handles editor messages.
module.exports = class Editor

  constructor: (@db, @socket) ->
    logger.info 'new socket connection'

    @editorInterface = new EditorInterface @db

    @socket.on 'disconnect', @disconnect

    @socket.on 'login', @login
    @socket.on 'get_tree', @getTree
    @socket.on 'get_object', @getObject

    @socket.on 'save_property', @saveProperty
    @socket.on 'create_property', @createProperty
    @socket.on 'delete_property', @deleteProperty

    @socket.on 'save_verb', @saveVerb
    @socket.on 'create_verb', @createVerb
    @socket.on 'delete_verb', @deleteVerb

    @socket.on 'create_object', @createObject
    @socket.on 'create_child', @createChild
    @socket.on 'rename_object', @renameObject
    @socket.on 'delete_object', @deleteObject

    @db.on 'objectCreated', @objectCreated
    @db.on 'objectDeleted', @objectDeleted
    @db.on 'objectParentChanged', @objectParentChanged
    @db.on 'objectNameChanged', @objectNameChanged

    @db.on 'propertyAdded', @propertyAdded
    @db.on 'propertyDeleted', @propertyDeleted
    @db.on 'propertyUpdated', @propertyUpdated

    @db.on 'verbAdded', @verbAdded
    @db.on 'verbDeleted', @verbDeleted
    @db.on 'verbUpdated', @verbUpdated

    @player = null

  # fires when a socket disconnects, either by the client closing the connection
  # or calling the `disconnect` method of the socket.
  disconnect: =>
    @db.removeListener 'objectCreated', @objectCreated
    @db.removeListener 'objectDeleted', @objectDeleted
    @db.removeListener 'objectParentChanged', @objectParentChanged
    @db.removeListener 'objectNameChanged', @objectNameChanged

    @db.removeListener 'propertyAdded', @propertyAdded
    @db.removeListener 'propertyDeleted', @propertyDeleted
    @db.removeListener 'propertyUpdated', @propertyUpdated

    @db.removeListener 'verbAdded', @verbAdded
    @db.removeListener 'verbDeleted', @verbDeleted
    @db.removeListener 'verbUpdated', @verbUpdated

    logger.info "socket disconnected"

  ####################
  # Editor callbacks #
  ####################

  login: (userData, fn) =>
    sanitize = (userData) ->
      username: (userData.username || "").trim()
      password: userData.password || ""

    formData = sanitize userData
    [player] = @db.players.filter (player) -> player.authenticates(formData.username, phash formData.password)
    if player? and player.programmer
      logger.info "#{player} logged in"
      @player = player
      fn true
    else if player?
      logger.info "#{player} attempted to log in but is not a programmer"
      fn false
    else
      logger.warn 'invalid login credentials supplied'
      fn false

  getTree: (data, fn) =>
    logger.debug "#{@player} requested object tree"
    fn @editorInterface.objectsTree()

  getObject: (id, fn) =>
    logger.debug "#{@player} requested object #{id}"
    fn @editorInterface.getObject id

  # properties

  saveProperty: (property, fn) =>
    logger.debug "#{@player} saved property #{property.object_id}.#{property.key}"
    @editorInterface.saveProperty property
    fn()

  createProperty: (data, fn) =>
    logger.debug "#{@player} created property #{data.id}.#{data.key}"
    @editorInterface.createProperty data.id, data.key, data.value
    fn()

  deleteProperty: (data) =>
    logger.debug "#{@player} deleted property #{data.id}.#{data.key}"
    @editorInterface.deleteProperty data.id, data.key

  # verbs

  saveVerb: (verb, fn) =>
    logger.debug "#{@player} saved verb #{verb.object_id}.#{verb.name}"
    fn @editorInterface.saveVerb verb

  createVerb: (data, fn) =>
    logger.debug "#{@player} created verb #{data.id}.#{data.name}"
    @editorInterface.createVerb data.id, data.name
    fn()

  deleteVerb: (data) =>
    logger.debug "#{@player} deleted verb #{data.id}.#{data.name}"
    @editorInterface.deleteVerb data.id, data.name

  # objects

  createObject: (data) =>
    logger.debug "#{@player} created top level object #{data.name}"
    @editorInterface.createObject data.name

  createChild: (data) =>
    logger.debug "#{@player} created object #{data.name} as child of #{data.id}"
    @editorInterface.createChild data.id, data.name

  renameObject: (data) =>
    logger.debug "#{@player} renamed object #{data.id} to #{data.name}"
    @editorInterface.renameObject data.id, data.name

  deleteObject: (data) =>
    logger.debug "#{@player} deleted object #{data.id}"
    @editorInterface.deleteObject data.id

  ##################
  # Sync callbacks #
  ##################
  # These callbacks keep the editor in sync when things change in the database

  objectCreated: (id) => @socket.emit 'object_created', @editorInterface.getObjectNode id
  objectDeleted: (id) => @socket.emit 'object_deleted', id
  objectParentChanged: (spec) => @socket.emit 'object_parent_changed', spec
  objectNameChanged: (spec) => @socket.emit 'object_name_changed', spec

  propertyAdded: (spec) => @socket.emit 'property_added', spec
  propertyDeleted: (spec) => @socket.emit 'property_deleted', spec
  propertyUpdated: (spec) => @socket.emit 'property_updated', spec

  verbAdded: (spec) => @socket.emit 'verb_added', spec
  verbDeleted: (spec) => @socket.emit 'verb_deleted', spec
  verbUpdated: (spec) => @socket.emit 'verb_updated', spec