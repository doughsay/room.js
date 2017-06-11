const { Namespace, namespaceHandler } = require('./namespace')

class NamespaceNode {
  constructor () {
    this.target = new Namespace()
    this.children = {}
    this.proxy = new Proxy(this.target, namespaceHandler)
  }

  static set (node, keys, value) {
    const key = keys[0]

    if (keys.length === 0) {
      throw new Error('No keys given for NamespaceNode.set')
    } else if (keys.length === 1) {
      node.target[key] = value
      return
    } else if (!node.children[key]) {
      const newNode = new NamespaceNode()
      node.children[key] = newNode
      node.target[key] = newNode.proxy
    }

    NamespaceNode.set(node.children[key], keys.slice(1), value)
  }

  static get (node, keys) {
    const key = keys[0]

    if (keys.length === 0) {
      throw new Error('No keys given for NamespaceNode.get')
    } else if (keys.length === 1) {
      return node.target[key]
    } else if (!node.children[key]) {
      return
    }

    return NamespaceNode.get(node.children[key], keys.slice(1))
  }

  static delete (node, keys) {
    const key = keys[0]

    if (keys.length === 0) {
      throw new Error('No keys given for NamespaceNode.delete')
    } else if (keys.length === 1) {
      return delete node.target[key]
    } else if (!node.children[key]) {
      return true
    }

    return NamespaceNode.delete(node.children[key], keys.slice(1))
  }
}

module.exports = NamespaceNode
