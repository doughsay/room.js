const bunyan = require('bunyan')
const { filter } = require('fuzzaldrin-plus')
const BaseChildController = require('./base-child-controller')
const serialize = require('../lib/serialize')
const print = require('../lib/print')
const rewriteEval = require('../lib/rewrite-eval')
const { bgRed } = require('../lib/colors')

class ProgrammerController extends BaseChildController {
  get logger () {
    return this.parent.logger.child({
      component: 'programmer-controller',
      user: this.user.id,
      player: this.playerId
    })
  }

  onEval (input) {
    try {
      const code = rewriteEval(input, this.playerId)
      const filename = `Eval::${this.playerId}`

      this.logger.debug({ code }, 'eval')

      const retVal = this.world.run(code, filename)

      this.emit('output', print(retVal, 1))
    } catch (err) {
      this.emit('output', bgRed(ProgrammerController.formatError(err)))
      this.logger.warn({ err: bunyan.stdSerializers.err(err) }, 'error running eval code')
    }
  }

  // TODO: this is incredibly innefficient, but works for now
  onSearch (query, done) {
    const candidates = []

    this.world.all().forEach(object => {
      Reflect.ownKeys(object).forEach(key => {
        const value = object[key]
        if (value && typeof value === 'function') {
          const searchStr = `${object.id}.${key}`
          const objectId = object.id
          if (value.verb) {
            candidates.push({ searchStr, objectId, verb: key })
          } else if (value.text) {
            candidates.push({ searchStr, objectId, text: key })
          } else {
            candidates.push({ searchStr, objectId, function: key })
          }
        }
      })
    })

    const results = filter(candidates, query, { key: 'searchStr', maxResults: 50 })
    done(results)
  }

  onGetVerb ({ objectId, name }, done) {
    const object = this.world.get(objectId)
    if (!object) { done(undefined); return }
    const verb = object[name]
    if (!verb || !verb.verb) { done(undefined); return }
    const verbDescriptor = serialize(verb)
    verbDescriptor.code = verbDescriptor.source
    verbDescriptor.name = name
    delete verbDescriptor.source
    done({ objectId, verb: verbDescriptor })
  }

  onGetFunction ({ objectId, name }, done) {
    const object = this.world.get(objectId)
    if (!object) { done(undefined); return }
    const func = object[name]
    if (!func || !func.source) { done(undefined); return }
    done({ objectId, src: func.source, name })
  }

  onGetText ({ objectId, name }, done) {
    const object = this.world.get(objectId)
    if (!object) { done(undefined); return }
    const text = object[name]
    if (!text || text.source === undefined) { done(undefined); return }
    done({ objectId, src: text.source, name })
  }

  onSaveVerb ({ objectId, verb }, done) {
    const dbObject = this.db.findById(objectId)
    if (!dbObject) { done('no such object'); return }

    const { name, pattern, dobjarg, preparg, iobjarg, code: source } = verb
    dbObject.properties[name] = { verb: true, source, pattern, dobjarg, preparg, iobjarg }
    this.db.markObjectDirty(objectId)

    done('saved')
  }

  onSaveFunction ({ objectId, src: source, name }, done) {
    const dbObject = this.db.findById(objectId)
    if (!dbObject) { done('no such object'); return }

    dbObject.properties[name] = { function: true, source }
    this.db.markObjectDirty(objectId)

    done('saved')
  }

  onSaveText ({ objectId, src: source, name }, done) {
    const dbObject = this.db.findById(objectId)
    if (!dbObject) { done('no such object'); return }

    dbObject.properties[name] = { text: true, source }
    this.db.markObjectDirty(objectId)

    done('saved')
  }

  static formatError (err) {
    return err.stack
  }
}

module.exports = ProgrammerController
