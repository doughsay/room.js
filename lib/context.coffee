color = require('./color').color
db = require('./moo').db

# TODO wrap Moo Objects in thin wrappers that restrict access to inner functionality
exports.base = ->
  c: color
  $: (id) -> db.findById(id)

exports.eval = ->
  c: color
  db: db
  $: (id) -> db.findById(id)