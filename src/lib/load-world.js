'use strict';
// this creates an object graph with prototypal inheritence
// based on the world objects in the db.
var worldObjectProxy = require('./world-object-proxy')
  , World = require('./world')
  , db = require('./db')
  , initCron = require('./cron').init

function loadDescendentsOf(parentId) {
  var objects = db.findBy('parentId', parentId)

  if (!parentId && objects.length === 0) {
    // No objects in the DB!  Let's create at least an empty Root object.
    let Root =  { id: 'Root'
                , name: 'Root'
                , type: 'WorldObject'
                , aliases: []
                , properties: []
                , verbs: []
                , createdAt: new Date()
                }
    db.insert(Root)
    objects = [Root]
  }

  for(let i = 0; i < objects.length; i++) {
    load(objects[i])
  }
}

function load(object) {
  World[object.id] = worldObjectProxy(object)
  loadDescendentsOf(object.id)
}

module.exports = function() {
  loadDescendentsOf()
  initCron()
  return World
}
