const bunyan = require('bunyan');
const vm = require('vm');
const WorldObjectClassBuilder = require('./world-object-class-builder');
const WorldObjectProxyBuilder = require('./world-object-proxy-builder');
const idify = require('./idify');
const Deserializer = require('./deserializer');
const Context = require('./context');

class World {
  constructor(logger, db, controllerMap) {
    this.logger = logger;
    this.db = db;
    this.objects = {};
    this.deserializer = new Deserializer(this);
    const WorldObject = (new WorldObjectClassBuilder(db, this, controllerMap)).buildClass();
    this.builder = new WorldObjectProxyBuilder(db, this, WorldObject);

    db.all().forEach(object => {
      this.objects[object.id] = this.builder.build(object);
    });

    this.context = new Context(this);

    this.setupWatchers();
  }

  setupWatchers() {
    this.db.on('object-added', id => {
      const object = this.db.findById(id);
      this.objects[id] = this.builder.build(object);
    });

    this.db.on('object-removed', id => {
      delete this.objects[id];
    });
  }

  get(id) {
    return this.objects[id];
  }

  all() {
    return this.db.ids().map(id => this.get(id));
  }

  players() {
    return this.db.playerIds().map(id => this.get(id));
  }

  nextId(raw) {
    const str = idify(raw);
    if (!this.objects[str]) { return str; }

    let i = 1;
    while (this.objects[str + i]) { i++; }
    return str + i;
  }

  insert(object) {
    // TODO: protect against bad inserts
    this.objects[object.id] = this.builder.build(object);
  }

  removeById(id) {
    delete this.objects[id];
  }

  newVerb(pattern = '', dobjarg = 'none', preparg = 'none', iobjarg = 'none') {
    const name = pattern.split(' ')[0].replace(/[^a-z]/g, '') || 'anonymous';
    const source = [
      `function ${name}`,
      '({ player, dobj, iobj, verbstr, argstr, dobjstr, prepstr, iobjstr }) ',
      '{\n  \n}\n',
    ].join('');
    return this.deserializer.deserialize({
      verb: true, source, pattern, dobjarg, preparg, iobjarg,
    });
  }

  run(code, filename, timeout = 500) {
    return vm.runInContext(code, this.context, { filename, timeout });
  }

  runScript(script, thisArg, args, timeout = 500) {
    return script.runInContext(this.context, { timeout }).apply(thisArg, args);
  }

  hookExists(id, hookName) {
    return this.get(id) && typeof this.get(id)[hookName] === 'function';
  }

  runHook(...args) {
    const id = args.shift();
    const hook = args.shift();

    if (this.hookExists(id, hook)) {
      const code = `${id}.${hook}(${args.join(', ')})`;

      // vmLogger.debug(code);

      try {
        const retval = vm.runInContext(code, this.context, {
          filename: `Hook::${id}.${hook}`,
          timeout: 500,
        });
        return [true, retval];
      } catch (err) {
        this.logger.warn({ err: bunyan.stdSerializers.err(err) }, 'error running hook');
        return [false];
      }
    }

    return [false];
  }
}

module.exports = World;
