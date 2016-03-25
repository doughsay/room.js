import base from './base';
import { deserialize, buildVerb, deserializeReferences, serializeVerb, serialize } from './util';

const targets = {};

export default function worldObjectProxy(dbObject) {
  const parentTarget = dbObject.parentId ? targets[dbObject.parentId] : base;
  const target = Object.create(parentTarget);
  const reservedNames = require('./reserved').base;

  targets[dbObject.id] = target;

  Object.defineProperty(target, 'id', {
    writable: false,
    configurable: false,
    enumerable: true,
    value: dbObject.id,
  });

  dbObject.properties.forEach((property) => {
    target[property.key] = deserialize(property.value, target.id, property.key);
  });

  dbObject.verbs.forEach((verb) => {
    target[verb.name] = buildVerb(verb);
  });

  function get(trgt, name, receiver) {
    return deserializeReferences(Reflect.get(trgt, name, receiver));
  }

  // helpers for set

  function updateDbObjectVerb(name, valueToStore) {
    const verb = dbObject.verbs.filter((v) => v.name === name)[0];
    const property = dbObject.properties.filter((prop) => prop.key === name)[0];

    if (!verb) {
      dbObject.verbs.push(valueToStore);
    } else {
      const index = dbObject.verbs.indexOf(verb);
      dbObject.verbs[index] = valueToStore;
    }

    // remove property with same name if it exists
    if (property) {
      dbObject.properties = dbObject.properties.filter((prop) => prop.key !== property.key);
    }
  }

  function updateDbObjectProperty(name, valueToStore) {
    const verb = dbObject.verbs.filter((v) => v.name === name)[0];
    const property = dbObject.properties.filter((prop) => prop.key === name)[0];

    if (!property) {
      dbObject.properties.push({ key: name, value: valueToStore });
    } else {
      property.value = valueToStore;
    }

    // remove verb with same name if it exists
    if (verb) {
      dbObject.verbs = dbObject.verbs.filter((v) => v.name !== verb.name);
    }
  }

  function set(trgt, name, value, receiver) {
    const isVerb = (value && value.__verb__);
    const valueToStore = isVerb ? serializeVerb(name, value) : serialize(value);
    const valueToSet = isVerb ? buildVerb(serializeVerb(name, value))
                              : deserialize(serialize(value), trgt.id, name);
    const updateDbObject = isVerb ? updateDbObjectVerb : updateDbObjectProperty;

    if (reservedNames.indexOf(name) === -1) {
      updateDbObject(name, valueToStore);
    }
    return Reflect.set(trgt, name, valueToSet, receiver);
  }

  function deleteProperty(trgt, name) {
    if (reservedNames.indexOf(name) === -1) {
      if (trgt[name] && trgt[name].__verb__) {
        dbObject.verbs = dbObject.verbs.filter((v) => v.name !== name);
      } else {
        dbObject.properties = dbObject.properties.filter((prop) => prop.key !== name);
      }
    }
    return Reflect.deleteProperty(trgt, name);
  }

  return new Proxy(target, { get, set, deleteProperty });
}
