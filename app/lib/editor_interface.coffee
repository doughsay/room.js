compileVerb = require('./compiler').compileVerb

isIntString = (x) -> "#{parseInt(x)}" is x

coersiveIDSort = ({id: a}, {id: b}) ->
  if isIntString(a) and isIntString(b)
    a = parseInt a
    b = parseInt b
  if a < b then -1 else if a > b then 1 else 0

module.exports = class EditorInterface

  constructor: (@db) ->

  objects: ->
    @db.objectsAsArray()

  objectsTree: ->
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
      x.children = children o
      x.children.sort coersiveIDSort
      x

    top = objects.filter (o) ->
      o.parent_id == null

    top.sort coersiveIDSort

    top.map show

  getObjectNode: (id) ->
    object = @db.findById id
    {
      id: object.id
      parent_id: object.parent_id
      name: object.name
      player: object.player
    }

  getObject: (id) ->
    object = @db.findById id
    {
      id: object.id
      name: object.name
      properties: object.getOwnProperties()
      verbs: object.getOwnVerbs()
    }

  saveProperty: (property) ->
    @db.findById(property.object_id).setProp property.key, property.value

  validateVerb: (verb) ->
    try
      compileVerb verb.lang, verb.code
      return true
    catch e
      return false

  saveVerb: (verb) ->
    if @validateVerb verb
      @db.findById(verb.object_id).saveVerb verb
      true
    else
      false

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