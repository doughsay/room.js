color = require('./color').color
db = require('./moo').db

# TODO wrap Moo Objects in thin wrappers that restrict access to inner functionality
# TODO the wrappers could also add method wrappers for each of the objects verbs (so you can do "object.verb()" in moo code)
exports.base = ->
  c: color
  $: (id) -> db.findById(id)

exports.eval = ->
  c: color
  db: db
  $: (id) -> db.findById(id)