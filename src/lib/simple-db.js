import fs from 'fs';
import bson from 'bson';

const BSON = bson.pure().BSON;

export class SimpleDB {
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

export default SimpleDB;
