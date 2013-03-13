util = require 'util'

phash = require('../lib/hash').phash

EditorInterface = require '../lib/editor_interface'

# An Editor represents a socket.io connection from the web editor.
# It handles editor messages.
class Editor

  constructor: (@db, @socket) ->
    @editorInterface = new EditorInterface @db

    @socket.on 'disconnect', @disconnect
    @socket.on 'login', @login
    @socket.on 'get_tree', @getTree
    @socket.on 'get_object', @getObject
    @socket.on 'save_property', @saveProperty
    @socket.on 'save_verb', @saveVerb

    @socket.on 'create_property', @createProperty
    @socket.on 'create_verb', @createVerb
    @socket.on 'delete_property', @deleteProperty
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

    address = @socket.handshake.address
    util.log "editor disconnected from #{address.address}:#{address.port}"

  ####################
  # Editor callbacks #
  ####################

  login: (userData, fn) =>
    sanitize = (userData) ->
      username: (userData.username || "").trim()
      password: userData.password || ""

    formData = sanitize userData
    [player] = @db.players.filter (player) -> player.authenticates(formData.username, phash formData.password)
    fn player? and player.programmer

  getTree: (data, fn) =>
    fn @editorInterface.objectsTree()

  getObject: (id, fn) =>
    fn @editorInterface.getObject id

  saveProperty: (property, fn) =>
    @editorInterface.saveProperty property
    fn()

  saveVerb: (verb, fn) =>
    @editorInterface.saveVerb verb
    fn()

  createProperty: (data) =>
    @editorInterface.createProperty data.id, data.key, data.value

  createVerb: (data) =>
    @editorInterface.createVerb data.id, data.name

  deleteProperty: (data) =>
    @editorInterface.deleteProperty data.id, data.key

  deleteVerb: (data) =>
    @editorInterface.deleteVerb data.id, data.name

  createObject: (data) =>
    @editorInterface.createObject data.name

  createChild: (data) =>
    @editorInterface.createChild data.id, data.name

  renameObject: (data) =>
    @editorInterface.renameObject data.id, data.name

  deleteObject: (data) =>
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

# This is the editor controller.
# It handles socket.io connections from the editor.
module.exports = class EditorController

  constructor: (io, db) ->
    io.of('/editor').on 'connection', (socket) ->
      address = socket.handshake.address
      util.log "new editor connection from #{address.address}:#{address.port}"
      new Editor db, socket