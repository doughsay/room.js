const bunyan = require('bunyan')
const vm = require('vm')
const WorldObjectClassBuilder = require('./world-object-class-builder')
const WorldObjectProxyBuilder = require('./world-object-proxy-builder')
const idify = require('./idify')
const Deserializer = require('./deserializer')
const { parseSentence: parse, parseNoun: noun } = require('./parse')
const { color } = require('./colors')
const NamespaceNode = require('./namespace-node')
const Timer = require('./timer')

class World {
  constructor (logger, db, controllerMap) {
    this.logger = logger
    this.db = db
    this.deserializer = new Deserializer(this)
    const WorldObject = (new WorldObjectClassBuilder(db, this, controllerMap)).buildClass()
    this.builder = new WorldObjectProxyBuilder(db, this, WorldObject)
    this.timer = new Timer()

    this.setupContext()
    db.all().forEach(object => { this.insert(object) })
    this.setupWatchers()
  }

  setupContext () {
    this.global = new NamespaceNode()

    this.global.target.global = this.global.proxy
    this.global.target.parse = Object.freeze(parse)
    this.global.target.noun = Object.freeze(noun)
    this.global.target.color = Object.freeze(color)
    this.global.target.all = Object.freeze(() => this.all())
    this.global.target.allPlayers = Object.freeze(() => this.players())
    this.global.target.$ = Object.freeze(id => this.get(id))
    this.global.target.nextId = Object.freeze(raw => this.nextId(raw))
    this.global.target.Verb = Object.freeze((...args) => this.newVerb(...args))
    this.global.target.run = Object.freeze({
      in: Object.freeze((code, milliseconds) => this.runIn(code, milliseconds)),
      every: Object.freeze((code, milliseconds) => this.runEvery(code, milliseconds)),
      next: Object.freeze((code) => this.runNext(code)),
      cancel: Object.freeze((timerId) => this.timer.cancel(timerId))
    })

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

    return NamespaceNode.get(this.global, id.split('.'))
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
    NamespaceNode.set(this.global, object.id.split('.'), obj)
    return obj
  }

  removeById (id) {
    return NamespaceNode.delete(this.global, id.split('.'))
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
        const retval = this.run(code, `Hook::${id}.${hook}`)
        return [true, retval]
      } catch (err) {
        this.logger.warn({ err: bunyan.stdSerializers.err(err) }, 'error running hook')
        return [false]
      }
    }

    return [false]
  }

  runIn (code, milliseconds, timeout = 500) {
    return this.timer.runIn(() => {
      this.logger.debug({ code }, 'running delayed code')

      try {
        this.run(code, `Delayed::${milliseconds}`, timeout)
      } catch (err) {
        this.logger.warn({ err: bunyan.stdSerializers.err(err) }, 'error running delayed code')
      }
    }, milliseconds)
  }

  runEvery (code, milliseconds, timeout = 500) {
    return this.timer.runEvery(() => {
      this.logger.debug({ code }, 'running interval code')

      try {
        this.run(code, `Interval::${milliseconds}`, timeout)
      } catch (err) {
        this.logger.warn({ err: bunyan.stdSerializers.err(err) }, 'error running interval code')
      }
    }, milliseconds)
  }

  runNext (code, timeout = 500) {
    return this.timer.runNext(() => {
      this.logger.debug({ code }, 'running immediate code')

      try {
        this.run(code, 'Immediate', timeout)
      } catch (err) {
        this.logger.warn({ err: bunyan.stdSerializers.err(err) }, 'error running immediate code')
      }
    })
  }
}

module.exports = World
