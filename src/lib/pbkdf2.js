'use strict';
var crypto = require('crypto')

module.exports = (function() {
  var deserializePasswordData
    , serializePasswordData
    , uid

  function Pbkdf2(options) {
    if (typeof options === 'undefined') {
      options = {}
    }
    this.iterations = options.iterations || 10000
    this.saltLength = options.saltLength || 12
    this.derivedKeyLength = options.derivedKeyLength || 30
    this.lengthLimit = options.lengthLimit || 4096
  }

  uid = function(len) {
    return crypto.randomBytes(len).toString('base64').slice(0, len)
  }

  serializePasswordData = function(passwordData) {
    return  [ passwordData.salt
            , passwordData.derivedKey
            , passwordData.derivedKeyLength
            , passwordData.iterations
            ].join('::')
  }

  deserializePasswordData = function(serializedPasswordData) {
    var derivedKey
      , derivedKeyLength
      , iterations
      , salt
      , parts

    parts = serializedPasswordData.split('::')
    salt = parts[0]
    derivedKey = parts[1]
    derivedKeyLength = parts[2]
    iterations = parts[3]

    return  { salt: salt
            , derivedKey: derivedKey
            , derivedKeyLength: parseInt(derivedKeyLength, 10)
            , iterations: parseInt(iterations, 10)
            }
  }

  Pbkdf2.prototype.hashPassword = function(plaintextPassword, cb) {
    var randomSalt
      , self = this

    if (plaintextPassword.length >= this.lengthLimit) {
      cb(new Error('password is too long'))
      return
    }

    randomSalt = uid(this.saltLength)

    crypto.pbkdf2(plaintextPassword, randomSalt, this.iterations, this.derivedKeyLength, function(err, derivedKey) {
      if (err) {
        cb(err)
        return
      }
      cb(null, serializePasswordData(
        { salt: randomSalt
        , iterations: self.iterations
        , derivedKeyLength: self.derivedKeyLength
        , derivedKey: new Buffer(derivedKey, 'binary').toString('base64')
        }
      ))
    })
  }

  Pbkdf2.prototype.checkPassword = function(plaintextPassword, serializedPasswordData, cb) {
    var derivedKey
      , derivedKeyLength
      , iterations
      , salt
      , data

    if (plaintextPassword.length >= this.lengthLimit) {
      cb(new Error('password is too long'))
      return
    }

    data = deserializePasswordData(serializedPasswordData)
    salt = data.salt
    derivedKey = data.derivedKey
    derivedKeyLength = data.derivedKeyLength
    iterations = data.iterations

    if ((!salt) || (!derivedKey) || (!iterations) || (!derivedKeyLength)) {
      cb(new Error('serializedPasswordData doesn\'t have the right format'))
      return
    }

    crypto.pbkdf2(plaintextPassword, salt, iterations, derivedKeyLength, function(err, candidateDerivedKey) {
      if (err) {
        cb(err)
        return
      }

      if (new Buffer(candidateDerivedKey, 'binary').toString('base64') === derivedKey) {
        cb(null, true)
      }
      else {
        cb(null, false)
      }
    })
  }

  return Pbkdf2

})()
