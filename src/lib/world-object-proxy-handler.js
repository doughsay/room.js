import Reflect from 'harmony-reflect';
import C3 from './c3';
import db from './db';

export function linearize(target, linearization = new C3(target)) {
  target.traitIds.forEach(traitId => {
    const trait = db.findById(traitId);
    linearization.add(target, trait);
    linearize(trait, linearization);
  });
  return linearization.run();
}

// traps for multiple inheritance

export function get(target, property) {
  const targets = linearize(target);
  for (let i = 0; i < targets.length; i++) {
    const tgt = targets[i];
    if (property in tgt.properties) { return tgt.properties[property]; }
  }
  return void 0;
}

export function has(target, property) {
  const targets = linearize(target);
  for (let i = 0; i < targets.length; i++) {
    const tgt = targets[i];
    if (property in tgt.properties) { return true; }
  }
  return false;
}

export function enumerate(target) {
  const targets = linearize(target);
  const propertySet = new Set();
  targets.forEach(tgt => {
    for (const property in tgt.properties) {
      propertySet.add(property);
    }
  });
  return propertySet.values();
}

// forward all other traps to the properties object

export function set(target, property, value) {
  return Reflect.set(target.properties, property, value);
}

export function deleteProperty(target, property) {
  return Reflect.deleteProperty(target.properties, property);
}

export function hasOwn(target, property) {
  return Reflect.hasOwn(target.properties, property);
}

export function ownKeys(target) {
  return Reflect.ownKeys(target.properties);
}

export function getOwnPropertyDescriptor(target, property) {
  return Reflect.getOwnPropertyDescriptor(target.properties, property);
}

export function getOwnPropertyNames(target) {
  return Reflect.getOwnPropertyNames(target.properties);
}

export function getOwnPropertyKeys(target) {
  return Reflect.getOwnPropertyKeys(target.properties);
}
