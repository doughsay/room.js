const vm = require('vm');

class Deserializer {
  constructor(world) {
    this.world = world;
  }

  _deserializeObject(object) {
    if (object === null) { return null; }
    const deserializedObject = {};
    for (const key in object) { // eslint-disable-line guard-for-in
      deserializedObject[key] = this.deserialize(object[key]);
    }
    return deserializedObject;
  }

  deserialize(object) {
    if (typeof object !== 'object' || !object) {
      throw new Error(`Unable to deserialize value: ${object}`);
    }
    if ('value' in object) { return object.value; }
    if ('NaN' in object) { return NaN; }
    if ('undefined' in object) { return void 0; }
    if ('date' in object) { return new Date(object.date); }
    if ('regexp' in object) { return new RegExp(object.regexp, object.flags); }
    if ('ref' in object) { return this.world.get(object.ref); }
    if ('object' in object) { return this._deserializeObject(object.object); }
    if ('array' in object) { return object.array.map(this.deserialize.bind(this)); }
    if ('function' in object) {
      const script = new vm.Script(`(${object.source})`);
      const world = this.world;
      const fn = function fn(...args) {
        return world.runScript(script, this, args);
      };
      fn.function = true;
      fn.source = object.source;
      return fn;
    }
    if ('verb' in object) {
      const script = new vm.Script(`(${object.source})`);
      const world = this.world;
      const verbFn = function verbFn(...args) {
        return world.runScript(script, this, args);
      };
      verbFn.verb = true;
      verbFn.source = object.source;
      verbFn.pattern = object.pattern;
      verbFn.dobjarg = object.dobjarg;
      verbFn.preparg = object.preparg;
      verbFn.iobjarg = object.iobjarg;
      return verbFn;
    }
    throw new Error(`Unable to deserialize object: ${object}`);
  }
}

module.exports = Deserializer;
