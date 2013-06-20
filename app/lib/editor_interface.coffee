module.exports = class EditorInterface

  constructor: (@db) ->

  objects: ->
    objects = @db.objectsAsArray()
    objects[0...objects.length-3]

  objectsTree: ->
    aliases = @db.globalAliases()

    objects = @objects()

    children = (o) =>
      child_os = objects.filter (other_o) ->
        other_o.parent_id == o.id
      child_os.map show

    show = (o) ->
      x =
        id: o.id
        name: o.name
        player: o.player
      if aliases[o.id]?
        x.alias = aliases[o.id]
      x.children = children o
      x

    top = objects.filter (o) ->
      o.parent_id == null

    top.map show

  getObjectNode: (id) ->
    object = @db.findById id
    alias = @db.aliasFor id
    {
      id: object.id
      parent_id: object.parent_id
      name: object.name
      player: object.player
      alias: alias
    }

  getObject: (id) ->
    object = @db.findById id
    alias = @db.aliasFor id
    {
      id: object.id
      name: object.name
      alias: alias
      properties: object.getOwnProperties()
      verbs: object.getOwnVerbs()
    }

  saveProperty: (property) ->
    @db.findById(property.object_id).setProp property.key, property.value

  saveVerb: (verb) ->
    @db.findById(verb.object_id).saveVerb verb

  createProperty: (id, key, value) =>
    @db.findById(id).addProp key, value

  createVerb: (id, name) =>
    verb =
      name: name
      hidden: false
      dobjarg: 'none'
      preparg: 'none'
      iobjarg: 'none'
      code: ''
      lang: 'coffeescript'
    @db.findById(id).addVerb verb

  deleteProperty: (id, key) =>
    @db.findById(id).rmProp key

  deleteVerb: (id, name) =>
    @db.findById(id).rmVerb name

  createObject: (name) =>
    @db.createNewObject name

  createChild: (id, name) =>
    object = @db.findById id
    @db.createChild object, name

  renameObject: (id, name) =>
    @db.findById(id).rename name

  deleteObject: (id) =>
    @db.rm id