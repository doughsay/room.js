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
    return false
  },

  deleteProperty: function (...args) {
    return false
  }
}

class Namespace {
  toString () {
    return '[object Namespace]'
  }
}

module.exports = { Namespace, namespaceHandler }
