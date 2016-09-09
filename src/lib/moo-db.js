const EventEmitter = require('events');
const util = require('util');
const path = require('path');
const bunyan = require('bunyan');
const FsDb = require('./fs-db');

function* entries(obj) {
  for (const key of Object.keys(obj)) {
    yield [key, obj[key]];
  }
}

class MooDB {
  constructor(directory, logger) {
    EventEmitter.call(this);

    this.logger = logger.child({ component: 'moo-db', directory });
    this.fsdb = new FsDb(directory, logger);
    this.db = new Map();

    const start = new Date();
    this.load();
    this.setupListeners();
    const loadTime = new Date() - start;
    this.logger.info({ loadTime }, 'moo-db loaded');
  }

  close() {
    this.removeAllListeners();
    this.fsdb.close();
  }

  setupListeners() {
    this.fsdb.on('added', this.onFileAddedOrChanged.bind(this));
    this.fsdb.on('changed', this.onFileAddedOrChanged.bind(this));
    this.fsdb.on('removed', this.onFileRemoved.bind(this));
    this.fsdb.on('ready', () => { this.emit('ready'); });
  }

  load(dir = '') {
    const ids = this.fsdb.lsDirs(dir);
    ids.forEach(id => {
      const filepath = path.posix.join(dir, id);
      // Recurse
      this.load(filepath);
      // Load object contents
      if (this.fsdb.hasContents(filepath, '.json')) {
        this.loadObject(MooDB.idFromFilepath(filepath));
      }
    });
  }

  static filenameForObj(id, ext = 'json') {
    const filename = id.split('_').pop();
    const filepath = id.replace(/_/g, '/');
    return `${filepath}/${filename}.${ext}`;
  }

  static filenameForSrc(id, file) {
    const filepath = id.replace(/_/g, '/');
    return `${filepath}/${file}`;
  }

  static filepathToObj(id) {
    return id.replace(/_/g, '/');
  }

  static idFromFilename(filename) {
    const fpsplit = filename.split(/\//);
    fpsplit.pop();
    return fpsplit.join('_');
  }

  static idFromFilepath(filepath) {
    return filepath.replace(/\//g, '_');
  }

  loadObject(id) {
    try {
      const fileContents = this.fsdb.read(MooDB.filenameForObj(id));
      const object = JSON.parse(fileContents);
      object.id = id;
      this.loadCallables(id, object.properties);
      this.db.set(id, object);
      this.logger.trace({ objectId: id }, 'loaded object');
      return true;
    } catch (err) {
      this.logger.warn(
        { err: bunyan.stdSerializers.err(err), objectId: id },
        'tried loading object from fsdb, but failed'
      );
      return false;
    }
  }

  loadCallables(id, properties) {
    for (const [key, value] of entries(properties)) {
      if (value.verb || value.function) {
        properties[key] = this.loadCallable(id, value);
      }
    }
  }

  loadCallable(id, value) {
    const source = this.fsdb.read(MooDB.filenameForSrc(id, value.file));
    value.source = source;
    return value;
  }

  onFileAddedOrChanged(file) {
    const id = MooDB.idFromFilename(file);
    if (file.endsWith('.json') || file.endsWith('.js')) {
      this.addOrUpdateObject(id);
    }
  }

  onFileRemoved(file) {
    const id = MooDB.idFromFilename(file);
    if (file.endsWith('.json')) {
      this.removeById(id);
      this.emit('object-removed', id);
    } else if (file.endsWith('.js')) {
      this.addOrUpdateObject(id);
    }
  }

  addOrUpdateObject(id) {
    try {
      const object = this.findById(id);
      const fileContents = this.fsdb.read(MooDB.filenameForObj(id));
      const newObjectProperties = JSON.parse(fileContents);
      if (object) {
        object.name = newObjectProperties.name;
        object.aliases = newObjectProperties.aliases;
        object.traitIds = newObjectProperties.traitIds;
        object.locationId = newObjectProperties.locationId;
        object.userId = newObjectProperties.userId;
        object.properties = newObjectProperties.properties;
        this.loadCallables(id, object.properties);
        this.logger.trace({ objectId: id }, 'reloaded object');
      } else {
        this.loadObject(id);
        this.emit('object-added', id);
      }
    } catch (err) {
      this.logger.warn(
        { err: bunyan.stdSerializers.err(err), objectId: id },
        'unable to add or update object'
      );
    }
  }

  serializeAndSaveCallable(id, key, value) {
    const file = value.file || `${key}.js`;
    const filepath = MooDB.filenameForSrc(id, file);
    this.fsdb.write(filepath, value.source);
    if (value.function) {
      return { function: true, file };
    } else if (value.verb) {
      return {
        file,
        verb: true,
        pattern: value.pattern,
        dobjarg: value.dobjarg,
        preparg: value.preparg,
        iobjarg: value.iobjarg,
      };
    }
    throw new Error('invalid callable');
  }

  savableProperties(object) {
    const properties = {};
    for (const [key, value] of entries(object.properties)) {
      if (value.verb || value.function) {
        properties[key] = this.serializeAndSaveCallable(object.id, key, value);
      } else {
        properties[key] = value;
      }
    }
    return properties;
  }

  serializeObject(object) {
    const obj = {
      name: object.name,
      aliases: object.aliases,
      traitIds: object.traitIds,
      locationId: object.locationId,
      userId: object.userId,
      properties: this.savableProperties(object),
    };
    return `${JSON.stringify(obj, null, '  ')}\n`;
  }

  saveObject(object) {
    this.fsdb.write(MooDB.filenameForObj(object.id), this.serializeObject(object));
    this.logger.trace({ objectId: object.id }, 'saved object');
  }

  removeFilesFor(id) {
    const object = this.findById(id);
    for (const [key, value] of entries(object.properties)) {
      if (value && (value.function || value.verb)) {
        const file = value.file || `${key}.js`;
        const filepath = MooDB.filenameForSrc(id, file);
        this.fsdb.rm(filepath);
      }
    }
    this.fsdb.rm(MooDB.filenameForObj(id));

    // cleanup; FsDb should do this for us, but it doesn't.
    this.fsdb.rmDir(MooDB.filepathToObj(id));
  }

  markObjectDirty(id) {
    this.saveObject(this.findById(id));
  }

  removeProperty(id, key, value) {
    if (value && (value.function || value.verb)) {
      const file = value.file || `${key}.js`;
      const filepath = MooDB.filenameForSrc(id, file);
      this.fsdb.rm(filepath);
    }
    this.saveObject(this.findById(id));
  }

  insert(object) {
    if (typeof object.id !== 'string') {
      throw new Error('Object must contain a string id property.');
    }
    if (this.db.has(object.id)) {
      throw new Error('An object with that id already exists.');
    }
    this.db.set(object.id, object);
    this.saveObject(object);
    return object;
  }

  remove({ id }) {
    return this.removeById(id);
  }

  removeById(id) {
    this.removeFilesFor(id);
    return this.db.delete(id);
  }

  findById(id) {
    return this.db.get(id);
  }

  findBy(field, value) {
    return [...this.db.values()].filter(object => object[field] === value);
  }

  all() {
    return this.db;
  }

  ids() {
    return [...this.db.keys()];
  }

  playerIds() {
    return [...this.db.values()].filter(object => !!object.userId).map(o => o.id);
  }

  clear() {
    this.ids().forEach(id => {
      this.removeById(id);
    });
  }
}
util.inherits(MooDB, EventEmitter);

module.exports = MooDB;
