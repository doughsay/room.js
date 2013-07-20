fs = require 'fs'

option '-f', '--file [FILE]', 'json file to convert'
option '-o', '--out [FILE]', 'json file to output to'

task 'convert', 'convert a json db file from the old format to the new format', (options) ->

  if not options.file?
   console.log 'You must specify which file to load with -f'
   return false

  if not fs.existsSync options.file
    console.log "The file #{options.file} does not exist"
    return false

  {nextId: nextId, objects: objects} = JSON.parse fs.readFileSync options.file

  for id, object of objects
    delete object.id

  # get all aliases
  sys = objects['0']
  aliases = {}
  for property in sys.properties
    aliases[property.value._mooObject] = property.key

  # clear sys properties
  sys.properties = []

  # re-id all objects
  newObjects = {}

  like = (x, y) ->
    if not (x? and y?)
      return false
    x.toString() is y.toString()

  reIdVal = (oldId, newId, x) ->
    if not x?
      return
    else if x._mooObject?
      if like x._mooObject, oldId
        x._mooObject = newId
      else
        x._mooObject = x._mooObject.toString()
    else if typeof x is 'object'
      answers = for key, val of x
        reIdVal oldId, newId, val

  for id, object of objects
    if aliases[object.parent_id]?
      object.parent_id = aliases[object.parent_id]
    else if object.parent_id?
      object.parent_id = object.parent_id.toString()

    if aliases[object.location_id]?
      object.location_id = aliases[object.location_id]
    else if object.location_id?
      object.location_id = object.location_id.toString()

    for oldId, newId of aliases
      for key, value of object.properties
        reIdVal oldId, newId, value

      aliasReference = new RegExp "\\$#{newId}", 'g'
      for verb in object.verbs
        verb.code = verb.code.replace aliasReference, "\$('##{newId}')"

    idLookup = /\$\((\d+)\)/g
    idLookup2 = /\$ (\d+)/g
    for verb in object.verbs
      verb.code = verb.code.replace idLookup, "$('#$1')"
      verb.code = verb.code.replace idLookup2, "$ '#$1'"

    if aliases[id]?
      newObjects[aliases[id]] = object
    else
      newObjects[id] = object

  fs.writeFileSync options.out, JSON.stringify nextId: nextId, objects: newObjects
  console.log 'done'