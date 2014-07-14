'use strict';
var co = require('co')

// middleware for patching incoming socket connections with
// some helpful methods when using co.
module.exports = function(socketHandler) {
  return function(socket) {

    // usage:
    // response = yield socket.thunkEmit('get-data')
    socket.thunkEmit = function(event, data) {
      var socket = this
      return function(cb) {
        socket.emit(event, data, function(res) {
          cb(null, res)
        })
      }
    }

    // usage:
    // socket.coOn('message', function* (data) {
    //   stuff = yield someThunk(data)
    //   ...
    // })
    socket.coOn = function(event, gen) {
      this.on(event, function(data) {
        co(gen).call(socket, data)
      })
    }

    socketHandler.call(socket)

  }
}
