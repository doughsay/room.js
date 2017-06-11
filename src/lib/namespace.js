const namespaceHandler = {
  setPrototypeOf: function (...args) {
    return false
  },

  preventExtensions: function (...args) {
    return false
  },

  defineProperty: function (...args) {
    return false
  },

  set: function (...args) {
    return true
  },

  deleteProperty: function (...args) {
    return true
  }
}

class Namespace {
  toString () {
    return '[object Namespace]'
  }
}

module.exports = { Namespace, namespaceHandler }
