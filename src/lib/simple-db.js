'use strict';
var fs = require('fs')
  , BSON = require('bson').pure().BSON

function SimpleDB(filename) {
  var db = {}

  this.loadSync = function(done) {
    db = BSON.deserialize(fs.readFileSync(filename))
    return true
  }

  this.saveSync = function() {
    fs.writeFileSync(filename, BSON.serialize(db))
    return true
  }

  this.insert = function(object) {
    if (typeof object.id !== 'string') {
      throw new Error('Object must contain a string id property.')
    }
    if (object.id in db) {
      throw new Error('An object with that ID already exists.')
    }
    db[object.id] = object
    return object
  }

  this.remove = function(object) {
    delete db[object.id]
  }

  this.removeById = function(id) {
    delete db[id]
  }

  this.findById = function(id) {
    return db[id]
  }

  this.findBy = function(field, value) {
    return this.all().filter(function(object) {
      return object[field] === value
    })
  }

  this.all = function() {
    return Object.keys(db).map(function(id) { return db[id] })
  }

  if (fs.existsSync(filename)) {
    this.loadSync()
  }
}

module.exports = SimpleDB
