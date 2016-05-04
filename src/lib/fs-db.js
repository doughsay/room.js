const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const remove = require('remove');
const chokidar = require('chokidar');
const EventEmitter = require('events');
const util = require('util');

class FsDb {
  constructor(directory, logger) {
    EventEmitter.call(this);

    this.directory = path.normalize(directory).replace(/\/$/, '');
    this.logger = logger.child({ directory });
    this.db = new Map();

    const start = new Date();
    this.load();
    this.setupWatcher();
    const loadTime = new Date() - start;
    this.logger.info({ loadTime }, 'fsdb loaded');
  }

  close() {
    this.removeAllListeners();
    this.watcher.close();
  }

  load(dir = this.directory) {
    fs.readdirSync(dir).forEach(file => {
      const filepath = path.join(dir, file);
      const stats = fs.statSync(filepath);
      if (stats.isDirectory()) {
        this.load(filepath);
      } else if (stats.isFile()) {
        this.loadFile(filepath);
      } else {
        const relpath = this.toRelpath(filepath);
        this.logger.warn({ relpath }, 'unknown file type');
      }
    });
  }

  setupWatcher() {
    this.watcher = chokidar.watch(this.directory, {
      ignored: /[\/\\]\./,
      persistent: true,
    });

    this.watcher.on('ready', () => {
      this.watcher
        .on('add', this.onFileAdded.bind(this))
        .on('change', this.onFileChanged.bind(this))
        .on('unlink', this.onFileRemoved.bind(this));
      this.emit('ready');
    });
  }

  toRelpath(filepath) {
    return filepath.slice(this.directory.length + 1);
  }

  toFilepath(relpath) {
    return path.join(this.directory, relpath);
  }

  createOrGetMap(map, key) {
    const existingMap = map.get(key);
    if (existingMap) { return existingMap; }
    const newMap = new Map();
    map.set(key, newMap);
    return newMap;
  }

  getMap(map, key) {
    if (map) { return map.get(key); }
    return void 0;
  }

  mapForDir(dirpath) {
    const keys = this.toRelpath(dirpath).split('/').filter(x => x);
    return keys.reduce((map, key) => this.getMap(map, key), this.db);
  }

  mapFor(filepath, create = true) {
    const getCallback = create ? this.createOrGetMap.bind(this) : this.getMap.bind(this);
    const keys = this.toRelpath(path.dirname(filepath)).split('/').filter(x => x);
    return keys.reduce((map, key) => getCallback(map, key), this.db);
  }

  loadFile(filepath) {
    const relpath = this.toRelpath(filepath);
    const contents = fs.readFileSync(filepath).toString();
    const originalContents = this.read(relpath);
    const originalDidntExist = typeof originalContents === 'undefined';
    if (originalDidntExist || contents !== originalContents) {
      this.set(relpath, contents);
      this.logger.trace({ relpath }, 'loaded file');
      const event = originalDidntExist ? 'added' : 'changed';
      this.emit(event, relpath, contents);
    }
  }

  unloadable(map) {
    return map.size === 0 && map !== this.db;
  }

  unloadDir(dirname) {
    const relpath = this.toRelpath(dirname);
    const map = this.mapFor(dirname);
    const dir = path.basename(dirname);
    map.delete(dir);
    this.logger.trace({ relpath }, 'unloaded directory');
    if (this.unloadable(map)) { this.unloadDir(path.dirname(dirname)); }
  }

  unloadFile(filepath, emit = true) {
    const relpath = this.toRelpath(filepath);
    const file = path.basename(filepath);
    const originalExisted = typeof this.read(relpath) !== 'undefined';
    if (originalExisted) {
      const map = this.mapFor(filepath);
      map.delete(file);
      this.logger.trace({ relpath }, 'unloaded file');
      if (this.unloadable(map)) { this.unloadDir(path.dirname(filepath)); }
      if (emit) { this.emit('removed', relpath); }
    }
  }

  onFileAdded(filepath) {
    const relpath = this.toRelpath(filepath);
    this.logger.trace({ relpath }, 'added to filesystem');
    this.loadFile(filepath);
  }

  onFileChanged(filepath) {
    const relpath = this.toRelpath(filepath);
    this.logger.trace({ relpath }, 'changed in filesystem');
    this.loadFile(filepath);
  }

  onFileRemoved(filepath) {
    const relpath = this.toRelpath(filepath);
    this.logger.trace({ relpath }, 'removed from filesystem');
    this.unloadFile(filepath);
  }

  set(relpath, contents) {
    const filepath = this.toFilepath(relpath);
    const file = path.basename(filepath);
    const map = this.mapFor(filepath);
    map.set(file, contents);
    return true;
  }

  read(relpath) {
    const filepath = this.toFilepath(relpath);
    const file = path.basename(filepath);
    const map = this.mapFor(filepath, false);
    if (!map) { return void 0; }
    return map.get(file);
  }

  write(relpath, contents) {
    const filepath = this.toFilepath(relpath);
    const originalContents = this.read(relpath);
    const originalDidntExist = typeof originalContents === 'undefined';
    this.set(relpath, contents);
    if (originalDidntExist || contents !== originalContents) {
      if (originalDidntExist) { mkdirp.sync(path.dirname(filepath)); }
      fs.writeFileSync(filepath, contents);
      this.logger.trace({ relpath }, 'wrote file to disk');
    }
    return true;
  }

  // input expected to be a path to a file only
  rm(relpath) {
    const filepath = this.toFilepath(relpath);
    const originalExisted = typeof this.read(relpath) !== 'undefined';
    this.unloadFile(filepath, false);
    if (originalExisted) {
      remove.removeSync(filepath); // TODO: this doesn't remove parent directories if they're empty
      this.logger.trace({ relpath }, 'removed file from disk');
    }
  }

  rmDir(relpath) {
    const filepath = this.toFilepath(relpath);
    fs.rmdirSync(filepath);
  }

  // input expected to be a path to a directory only
  ls(relpath) {
    const dirpath = this.toFilepath(relpath);
    const map = this.mapForDir(dirpath);
    const output = [];
    if (!map) { return output; }
    for (const [key, value] of map.entries()) {
      if (value instanceof Map) {
        output.push({ directory: key });
      } else {
        output.push({ file: key });
      }
    }
    return output;
  }

  lsBy(relpath, fn) {
    return this.ls(relpath).filter(fn).map(fn);
  }

  lsDirs(relpath) {
    return this.lsBy(relpath, x => x.directory);
  }

  lsFiles(relpath) {
    return this.lsBy(relpath, x => x.file);
  }

  _inspectTree(map = this.db, prefix = '', lines = []) {
    for (const [key, value] of map.entries()) {
      if (value instanceof Map) {
        lines.push(`${prefix}${key}:`);
        this._inspectTree(value, `${prefix}  `, lines);
      } else {
        lines.push(`${prefix}${key} (${value.toString().replace(/\n/g, '\\n')})`);
      }
    }
    return lines;
  }

  inspectTree() {
    return this._inspectTree().join('\n');
  }
}

util.inherits(FsDb, EventEmitter);

module.exports = FsDb;
