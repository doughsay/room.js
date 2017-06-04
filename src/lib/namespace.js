const namespaceHandler = {
  setPrototypeOf: function (...args) {
    return false
  },

  preventExtensions: function (...args) {
    return false
  },

  defineProperty: function (...args) {
    throw new Error('You cannot set properties on namespaces.')
  },

  set: function (...args) {
    throw new Error('You cannot set properties on namespaces.')
  },

  deleteProperty: function (...args) {
    throw new Error('You cannot delete properties from a namespaces.')
  }
}

class Target {
  toString () {
    return '[object Namespace]'
  }
}

class Namespace {
  constructor () {
    this.target = new Target()
    this.children = {}
    this.proxy = new Proxy(this.target, namespaceHandler)
  }

  static set (namespace, keys, value) {
    const key = keys[0]

    if (keys.length === 0) {
      throw new Error('No keys given for Namespace.set')
    } else if (keys.length === 1) {
      namespace.target[key] = value
      return
    } else if (!namespace.children[key]) {
      const newNamespace = new Namespace()
      namespace.children[key] = newNamespace
      namespace.target[key] = newNamespace.proxy
    }

    Namespace.set(namespace.children[key], keys.slice(1), value)
  }

  static get (namespace, keys) {
    const key = keys[0]

    if (keys.length === 0) {
      throw new Error('No keys given for Namespace.get')
    } else if (keys.length === 1) {
      return namespace.target[key]
    } else if (!namespace.children[key]) {
      return
    }

    return Namespace.get(namespace.children[key], keys.slice(1))
  }

  static delete (namespace, keys) {
    const key = keys[0]

    if (keys.length === 0) {
      throw new Error('No keys given for Namespace.delete')
    } else if (keys.length === 1) {
      return delete namespace.target[key]
    } else if (!namespace.children[key]) {
      return false
    }

    return Namespace.delete(namespace.children[key], keys.slice(1))
  }
}

module.exports = Namespace
