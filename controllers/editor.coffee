util = require 'util'

EditorInterface = require '../lib/editor_interface'

# An Editor represents a socket.io connection from the web editor.
# It handles editor messages.
class Editor

  constructor: (@db, @socket) ->
    @editorInterface = new EditorInterface @db

    @socket.on 'disconnect', @onDisconnect
    @socket.on 'get_tree', @onGetTree
    @socket.on 'get_object', @onGetObject
    @socket.on 'save_property', @onSaveProperty
    @socket.on 'save_verb', @onSaveVerb

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
  onDisconnect: =>
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

  onGetTree: (data, fn) =>
    fn @editorInterface.objectsTree()

  onGetObject: (id, fn) =>
    fn @editorInterface.getObject id

  onSaveProperty: (property, fn) =>
    @editorInterface.saveProperty property
    fn()

  onSaveVerb: (verb, fn) =>
    @editorInterface.saveVerb verb
    fn()

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