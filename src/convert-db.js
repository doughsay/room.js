const fs = require('fs');
const bson = require('bson');
const mkdirp = require('mkdirp');
const remove = require('remove');

const BSON = bson.pure().BSON;
const DIRECTORY = 'converted-db';

function number(value) {
  return typeof value === 'number';
}

function basicValue(value) {
  const type = typeof value;
  return type === 'string' || type === 'number' || type === 'boolean';
}

function serializeObject(object) {
  if (object === null) {
    return { object: null };
  } else if (Object.prototype.toString.call(object) === '[object Date]') {
    return { date: object.toISOString() };
  } else if (Object.prototype.toString.call(object) === '[object RegExp]') {
    return { regexp: object.source, flags: object.flags };
  } else if (Array.isArray(object)) {
    return { array: object.map(serialize) }; // eslint-disable-line no-use-before-define
  } else if (object.__proxy__) {
    return { ref: object.id };
  } else if (Object.prototype.toString.call({}) === '[object Object]') {
    const serializedObject = {};
    for (const key in object) { // eslint-disable-line guard-for-in
      serializedObject[key] = serialize(object[key]); // eslint-disable-line no-use-before-define
    }
    return { object: serializedObject };
  }
  throw new Error(`Unable to serialize object: ${object}`);
}

function serializeFunction(fn) {
  const source = fn.source || fn.toString();
  if (fn.verb) {
    return {
      verb: source,
      pattern: fn.pattern,
      dobjarg: fn.dobjarg,
      preparg: fn.preparg,
      iobjarg: fn.iobjarg,
    };
  }
  return { function: source };
}

function serialize(value) {
  const type = typeof value;
  if (number(value) && isNaN(value)) { return { NaN: true }; }
  if (basicValue(value)) { return { value }; }
  if (type === 'undefined') { return { undefined: true }; }
  if (type === 'object') { return serializeObject(value); }
  if (type === 'function') { return serializeFunction(value); }
  throw new Error(`Unable to serialize value: ${value}`);
}

class SimpleDB {
  constructor(filename) {
    this.filename = filename;
    this._db = {};

    if (fs.existsSync(filename)) {
      this.loadSync();
    }
  }

  loadSync() {
    this._db = BSON.deserialize(fs.readFileSync(this.filename));
    return true;
  }

  saveSync() {
    fs.writeFileSync(this.filename, BSON.serialize(this._db));
    return true;
  }

  insert(object) {
    if (typeof object.id !== 'string') {
      throw new Error('Object must contain a string id property.');
    }
    if (object.id in this._db) {
      throw new Error('An object with that ID already exists.');
    }
    this._db[object.id] = object;
    return object;
  }

  remove(object) {
    delete this._db[object.id];
  }

  removeById(id) {
    delete this._db[id];
  }

  findById(id) {
    return this._db[id];
  }

  findBy(field, value) {
    return this.all().filter(object => object[field] === value);
  }

  all() {
    return Object.keys(this._db).map(id => this._db[id]);
  }
}

const db = new SimpleDB('world.bson');

function dirnameFor(object) {
  return `${DIRECTORY}/${object.id}`;
}

function filenameFor(object) {
  return `${dirnameFor(object)}/${object.id}.json`;
}

function filenameForCallable(object, name) {
  return `${dirnameFor(object)}/${name}.js`;
}

function nonCallableProperties(object) {
  return object.properties.filter(({ value }) => !(value && value.__function__));
}

function convertProperties(properties) {
  const obj = {};
  properties.forEach(prop => {
    obj[prop.key] = serialize(prop.value);
  });
  return obj;
}

function jsonifyObject(object) {
  return JSON.stringify({
    id: object.id,
    name: object.name,
    aliases: object.aliases,
    traitIds: object.traitIds,
    locationId: object.locationId,
    userId: object.userId,
    properties: convertProperties(nonCallableProperties(object)),
  }, null, '  ');
}

remove.removeSync(DIRECTORY);

db.all().forEach(object => {
  mkdirp.sync(dirnameFor(object));
  fs.writeFileSync(filenameFor(object), jsonifyObject(object));

  (object.verbs || []).forEach(verb => {
    const filename = filenameForCallable(object, verb.name);
    const verbDef = `// verb: ${verb.pattern}; ${verb.dobjarg}; ${verb.preparg}; ${verb.iobjarg}`;
    const code = `${verbDef}\n${verb.code}`;
    fs.writeFileSync(filename, code);
  });

  (object.properties || []).forEach(property => {
    if (property.value && property.value.__function__) {
      const filename = filenameForCallable(object, property.key);
      const code = property.value.__function__;
      fs.writeFileSync(filename, code);
    }
  });
});
