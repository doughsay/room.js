import fs from 'fs';
import bson from 'bson';

const BSON = bson.pure().BSON;

export default function SimpleDB(filename) {
  let db = {};

  this.loadSync = () => {
    db = BSON.deserialize(fs.readFileSync(filename));
    return true;
  };

  this.saveSync = () => {
    fs.writeFileSync(filename, BSON.serialize(db));
    return true;
  };

  this.insert = object => {
    if (typeof object.id !== 'string') {
      throw new Error('Object must contain a string id property.');
    }
    if (object.id in db) {
      throw new Error('An object with that ID already exists.');
    }
    db[object.id] = object;
    return object;
  };

  this.remove = object => {
    delete db[object.id];
  };

  this.removeById = id => {
    delete db[id];
  };

  this.findById = id => db[id];

  this.findBy = (field, value) => this.all().filter(object => object[field] === value);

  this.all = () => Object.keys(db).map(id => db[id]);

  if (fs.existsSync(filename)) {
    this.loadSync();
  }
}
