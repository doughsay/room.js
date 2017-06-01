const bunyan = require('bunyan')
const vm = require('vm')
const WorldObjectClassBuilder = require('./world-object-class-builder')
const WorldObjectProxyBuilder = require('./world-object-proxy-builder')
const idify = require('./idify')
const Deserializer = require('./deserializer')
const Context = require('./context')

class World {
  constructor (logger, db, controllerMap) {
    this.logger = logger
    this.db = db
    this.objects = {}
    this.deserializer = new Deserializer(this)
    const WorldObject = (new WorldObjectClassBuilder(db, this, controllerMap)).buildClass()
    this.builder = new WorldObjectProxyBuilder(db, this, WorldObject)

    db.all().forEach(object => {
      this.insert(object)
    })

    this.context = new Context(this)

    this.setupWatchers()
  }

  setupWatchers () {
    this.db.on('object-added', id => {
      const object = this.db.findById(id)
      this.insert(object)
    })

    this.db.on('object-removed', id => {
      this.removeById(id)
    })
  }

  static getDeep (object, keys) {
    if (!object) { return object }
    if (keys.length === 0) { return object }
    return keys.length === 1 ? object[keys[0]] : World.getDeep(object[keys[0]], keys.slice(1))
  }

  get (id) {
    if (!id) { return null }
    return World.getDeep(this.objects, id.split('.'))
  }

  all () {
    return this.db.ids().map(id => this.get(id))
  }

  players () {
    return this.db.playerIds().map(id => this.get(id))
  }

  nextId (raw) {
    const potentialId = idify(raw)
    if (!this.get(potentialId)) { return potentialId }

    let i = 1
    while (this.get(potentialId + i)) { i += 1 }
    return potentialId + i
  }

  static deepSet (object, keys, value) {
    if (keys.length === 1) {
      object[keys[0]] = value
      return
    }
    if (!object[keys[0]]) {
      object[keys[0]] = {} // TODO: use a "namespace proxy" maybe?
    }
    World.deepSet(object[keys[0]], keys.slice(1), value)
  }

  insert (object) {
    // TODO: protect against bad inserts?
    const obj = this.builder.build(object)
    World.deepSet(this.objects, object.id.split('.'), obj)
    return obj
  }

  static deleteDeep (object, keys) {
    return keys.length === 1 ? delete object[keys[0]] : World.deleteDeep(object[keys[0]], keys.slice(1))
  }

  removeById (id) {
    return World.deleteDeep(this.objects, id.split('.'))
  }

  newVerb (pattern = '', dobjarg = 'none', preparg = 'none', iobjarg = 'none') {
    const name = pattern.split(' ')[0].replace(/[^a-z]/g, '') || 'anonymous'
    const source = [
      `function ${name}`,
      '({ player, dobj, iobj, verbstr, argstr, dobjstr, prepstr, iobjstr }) ',
      '{\n  \n}\n'
    ].join('')
    return this.deserializer.deserialize({
      verb: true, source, pattern, dobjarg, preparg, iobjarg
    })
  }

  run (code, filename, timeout = 500) {
    return vm.runInContext(code, this.context, { filename, timeout })
  }

  runScript (script, thisArg, args, timeout = 500) {
    return script.runInContext(this.context, { timeout }).apply(thisArg, args)
  }

  hookExists (id, hookName) {
    return this.get(id) && typeof this.get(id)[hookName] === 'function'
  }

  runHook (...args) {
    const id = args.shift()
    const hook = args.shift()

    if (this.hookExists(id, hook)) {
      const code = `${id}.${hook}(${args.join(', ')})`

      this.logger.debug({ code }, 'running hook')

      try {
        const retval = vm.runInContext(code, this.context, {
          filename: `Hook::${id}.${hook}`,
          timeout: 500
        })
        return [true, retval]
      } catch (err) {
        this.logger.warn({ err: bunyan.stdSerializers.err(err) }, 'error running hook')
        return [false]
      }
    }

    return [false]
  }
}

module.exports = World
