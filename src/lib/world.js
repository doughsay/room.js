const bunyan = require('bunyan')
const vm = require('vm')
const WorldObjectClassBuilder = require('./world-object-class-builder')
const WorldObjectProxyBuilder = require('./world-object-proxy-builder')
const idify = require('./idify')
const Deserializer = require('./deserializer')
const parse = require('./parse').parseSentence
const noun = require('./parse').parseNoun
const { color } = require('./colors')
const Namespace = require('./namespace')

class World {
  constructor (logger, db, controllerMap) {
    this.logger = logger
    this.db = db
    this.deserializer = new Deserializer(this)
    const WorldObject = (new WorldObjectClassBuilder(db, this, controllerMap)).buildClass()
    this.builder = new WorldObjectProxyBuilder(db, this, WorldObject)

    this.setupContext()
    db.all().forEach(object => { this.insert(object) })
    this.setupWatchers()
  }

  setupContext () {
    this.global = new Namespace()

    this.global.target.global = this.global.proxy
    this.global.target.parse = parse
    this.global.target.noun = noun
    this.global.target.color = color
    this.global.target.all = () => this.all()
    this.global.target.allPlayers = () => this.players()
    this.global.target.$ = id => this.get(id)
    this.global.target.nextId = raw => this.nextId(raw)
    this.global.target.Verb = (...args) => this.newVerb(...args)

    this.context = this.global.proxy
    vm.createContext(this.context)
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

  get (raw) {
    if (typeof raw !== 'string') { return }
    const id = raw.replace(/[.]+/g, '.').replace(/(^\.+|\.+$)/g, '')
    if (!id) { return }

    return Namespace.get(this.global, id.split('.'))
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

  insert (object) {
    const obj = this.builder.build(object)
    Namespace.set(this.global, object.id.split('.'), obj)
    return obj
  }

  removeById (id) {
    return Namespace.delete(this.global, id.split('.'))
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
