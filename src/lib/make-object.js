import schema from 'js-schema';
import World from './world';

const objectArgs = ['none', 'any', 'this'];
const prepArgs = [
  'none',
  'any',
  'with/using',
  'at/to',
  'in front of',
  'in/inside/into',
  'on top of/on/onto/upon',
  'out of/from inside/from',
  'over',
  'through',
  'under/underneath/beneath',
  'behind',
  'beside',
  'for/about',
  'is',
  'as',
  'off/off of',
];

const jsVariableRegex = /^[$A-Z_][0-9A-Z_$]*$/i;

const validateObject = schema({
  core: jsVariableRegex,
  id: jsVariableRegex,
  traitIds: Array.of(jsVariableRegex),
  userId: [null, String],
  locationId: [null, jsVariableRegex],
  name: String,
  type: ['WorldObject', 'Player'],
  aliases: Array.of(String),
  properties: Array.of({
    key: String,
    value: undefined,
  }),
  verbs: Array.of({
    name: String,
    dobjarg: objectArgs,
    preparg: prepArgs,
    iobjarg: objectArgs,
    code: String,
  }),
  createdAt: Date,
  lastActivity: [null, Date],
  isProgrammer: [true, false],
});

function makeObject(object) {
  const defaults = {
    pkg: 'Core',
    id: void 0,
    traitIds: [],
    userId: null,
    locationId: void 0,
    name: void 0,
    type: 'WorldObject',
    aliases: [],
    properties: [],
    verbs: [],
    createdAt: new Date(),
    lastActivity: null,
    isProgrammer: false,
  };
  const newObject = {};

  // whitelist properties and fill in defaults
  for (const key in defaults) {
    if (key in object) {
      newObject[key] = object[key];
    } else {
      newObject[key] = defaults[key];
    }
  }

  // always set type and createdAt to default
  newObject.type = defaults.type;
  newObject.createdAt = defaults.createdAt;

  if (!validateObject(newObject)) {
    throw new Error('Invalid object.');
  }
  if (newObject.id in World) {
    throw new Error(`Object with ID ${newObject.id} already exists.`);
  }
  if (newObject.parentId && !(newObject.parentId in World)) {
    throw new Error(`Object with ID ${newObject.parentId} does not exist.`);
  }
  if (newObject.locationId && !(newObject.locationId in World)) {
    throw new Error(`Object with ID ${newObject.locationId} does not exist.`);
  }

  return newObject;
}

module.exports = makeObject;
