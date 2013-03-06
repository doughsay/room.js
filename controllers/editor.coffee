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

    @db.on 'newObject', @onNewObject
    @db.on 'rmObject', @onRmObject
    @db.on 'objectParentChanged', @onObjectParentChanged
    @db.on 'objectNameChanged', @onObjectNameChanged

  # fires when a socket disconnects, either by the client closing the connection
  # or calling the `disconnect` method of the socket.
  onDisconnect: =>
    @db.removeListener 'newObject', @onNewObject
    @db.removeListener 'rmObject', @onRmObject
    @db.removeListener 'objectParentChanged', @onObjectParentChanged
    @db.removeListener 'objectNameChanged', @onObjectNameChanged

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

  onNewObject: (id) =>
    @socket.emit 'new_object', @editorInterface.getObjectNode id


  onRmObject: (id) =>
    @socket.emit 'rm_object', id

  onObjectParentChanged: (spec) =>
    @socket.emit 'object_parent_changed', spec

  onObjectNameChanged: (spec) =>
    @socket.emit 'object_name_changed', spec

# This is the editor controller.
# It handles socket.io connections from the editor.
module.exports = class EditorController

  constructor: (io, db) ->
    io.of('/editor').on 'connection', (socket) ->
      address = socket.handshake.address
      util.log "new editor connection from #{address.address}:#{address.port}"
      new Editor db, socket