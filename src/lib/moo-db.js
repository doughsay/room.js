const fs = require('fs');
const mkdirp = require('mkdirp');
const remove = require('remove');

const VERB_DESCRIPTOR = /^\s*\/\/\s*verb\s*:\s*(.*?)\s*;\s*(.*?)\s*;\s*(.*?)\s*;\s*(.*?)\s*$/;

function* entries(obj) {
  for (const key of Object.keys(obj)) {
    yield [key, obj[key]];
  }
}

class MooDB {
  constructor(directory) {
    this.directory = directory;
    this._db = new Map();
    // this._locationIdIndex = new Map();
    // this._userIdIndex = new Map();

    if (this.dbDirectoryExists()) {
      this.loadSync();
    }
  }

  dbDirectoryExists() {
    return fs.existsSync(this.directory);
  }

  dirnameFor(id) {
    return `${this.directory}/${id}`;
  }

  filenameFor(id) {
    return `${this.dirnameFor(id)}/${id}.json`;
  }

  callable(descriptor) {
    return 'function' in descriptor || 'verb' in descriptor;
  }

  nonCallableProperties(object) {
    const properties = {};
    for (const [key, value] of entries(object.properties)) {
      if (!this.callable(value)) { properties[key] = value; }
    }
    return properties;
  }

  callableProperties(object) {
    const properties = {};
    for (const [key, value] of entries(object.properties)) {
      if (this.callable(value)) { properties[key] = value; }
    }
    return properties;
  }

  serializeObject(object) {
    const obj = {
      id: object.id,
      name: object.name,
      aliases: object.aliases,
      traitIds: object.traitIds,
      locationId: object.locationId,
      userId: object.userId,
      properties: this.nonCallableProperties(object),
    };
    return `${JSON.stringify(obj, null, '  ')}\n`;
  }

  // index(object) {
  //   if (!this._locationIdIndex.get(object.locationId)) {
  //     this._locationIdIndex.set(object.locationId, []);
  //   }
  //   this._locationIdIndex.get(object.locationId).push(object);
  //
  //   if (!this._userIdIndex.get(object.userId)) {
  //     this._userIdIndex.set(object.userId, []);
  //   }
  //   this._userIdIndex.get(object.userId).push(object);
  // }

  loadSync() {
    if (!this.dbDirectoryExists()) {
      // TODO: warn
      return;
    }

    this._db.clear();
    const ids = fs.readdirSync(this.directory);
    ids.forEach(id => {
      if (id.startsWith('.')) { return; }
      this.loadObjectSync(id);
    });
  }

  loadObjectSync(id) {
    const fileContents = fs.readFileSync(this.filenameFor(id));
    const object = JSON.parse(fileContents);
    this.loadCallables(id, object.properties);
    this._db.set(id, object);
    // this.index(object);
  }

  loadCallables(id, properties) {
    const files = fs.readdirSync(this.dirnameFor(id));
    files.forEach(file => {
      if (!file.endsWith('.js')) { return; }
      const fileContents = fs.readFileSync(`${this.dirnameFor(id)}/${file}`).toString();
      const [key] = file.split('.');
      properties[key] = this.parseCallable(fileContents);
    });
  }

  parseCallable(fileContents) {
    const lines = fileContents.split('\n');
    const firstLineMatch = (lines[0] || '').match(VERB_DESCRIPTOR);
    if (firstLineMatch) {
      const [pattern, dobjarg, preparg, iobjarg] = firstLineMatch.slice(1);
      return {
        verb: lines.slice(1).join('\n'),
        pattern, dobjarg, preparg, iobjarg,
      };
    }
    return { function: fileContents };
  }

  saveSync() {
    if (this.dbDirectoryExists()) { remove.removeSync(this.directory); }

    this._db.forEach(object => {
      mkdirp.sync(this.dirnameFor(object.id));

      fs.writeFileSync(this.filenameFor(object.id), this.serializeObject(object));

      for (const [key, value] of entries(this.callableProperties(object))) {
        const filename = `${this.dirnameFor(object.id)}/${key}.js`;
        if ('function' in value) {
          fs.writeFileSync(filename, value.function);
        } else if ('verb' in value) {
          const verbDef =
            `// verb: ${value.pattern}; ${value.dobjarg}; ${value.preparg}; ${value.iobjarg}`;
          const code = `${verbDef}\n${value.verb}`;
          fs.writeFileSync(filename, code);
        }
      }
    });
  }

  insert(object) {
    if (typeof object.id !== 'string') {
      throw new Error('Object must contain a string id property.');
    }
    if (this._db.has(object.id)) {
      throw new Error('An object with that id already exists.');
    }
    this._db.set(object.id, object);
    return object;
  }

  remove({ id }) {
    return this.removeById(id);
  }

  removeById(id) {
    return this._db.delete(id);
  }

  findById(id) {
    return this._db.get(id);
  }

  findBy(field, value) {
    return [...this._db.values()].filter(object => object[field] === value);
  }

  all() {
    return this._db;
  }

  ids() {
    return [...this._db.keys()];
  }

  playerIds() {
    return [...this._db.values()].filter(object => !!object.userId).map(o => o.id);
  }
}

module.exports = MooDB;
