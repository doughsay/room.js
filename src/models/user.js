'use strict';
var mongoose = require('../datasources/mongoose')
  , Pbkdf2 = require('../lib/pbkdf2')
  , hasher = new Pbkdf2()
  , Schema = mongoose.Schema
  , UserSchema

UserSchema = new Schema(
  { username:  String
  , password:  String
  , lastLogin: Date
  , createdAt: { type: Date, default: Date.now }
  }
)

UserSchema.pre('save', function(next) {
  var user = this

  if (!user.isModified('password')) {
    next()
    return
  }

  hasher.hashPassword(user.password, function(err, hashedPassword) {
    if (err) {
      next(err)
      return
    }
    user.password = hashedPassword
    next()
  })
})

UserSchema.methods.checkPassword = function(password) {
  var user = this

  return function(done) {
    return hasher.checkPassword(password, user.password, function(err, valid) {
      if (err) {
        done(err)
        return
      }
      done(null, valid)
    })
  }
}

UserSchema.methods.updateLastLogin = function() {
  var self = this
  this.lastLogin = new Date()
  return function(done) { self.save(done) }
}

module.exports = mongoose.model('User', UserSchema)
