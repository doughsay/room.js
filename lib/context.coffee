color = require('./color').color
db = require('./moo').db

exports.base = ->
  c: color
  $: (id) -> db.findById(id)

exports.eval = ->
  c: color
  db: db
  $: (id) -> db.findById(id)