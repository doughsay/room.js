import SocketMap from './socket-map';
import World from './world';
import db from './db';
import util from './util';
import makeObject from './make-object';
import makeVerb from './make-verb';
import { globals } from './reserved';

const base = {};

const NO_MATCH = 0;
const EXACT_MATCH = 1;
const PARTIAL_MATCH = 2;

// base object functions

function toString() {
  return `[object ${this.id} (${this.name})]`;
}

function isA(obj) {
  let x = this;
  while (x) {
    x = x.parent;
    if (x === obj) {
      return true;
    }
  }
  return false;
}

function send(msg) {
  const socket = SocketMap[this.id];
  if (socket) {
    socket.emit('output', msg);
    return true;
  }
  return false;
}

function setPrompt(str) {
  const socket = SocketMap[this.id];
  if (socket) {
    socket.emit('set-prompt', str);
    return true;
  }
  return false;
}

function ask(params, callback) {
  const socket = SocketMap[this.id];
  const player = this;
  const usageStr = 'Usage: player.ask("Hello?", function(response) { ... })';
  let data;

  if (typeof params === 'string') {
    data = params;
  } else if (params) {
    data = {};
    if (params.message && typeof params.message === 'string') {
      data.message = params.message;
    }
    if (params.prompt && typeof params.prompt === 'string') {
      data.prompt = params.prompt;
    }
    if (params.password && typeof params.password === 'boolean') {
      data.password = params.password;
    }
  } else {
    throw new Error(`You must provide a valid message. ${usageStr}`);
  }

  if (typeof callback !== 'function') {
    throw new Error(`You must provide a callback function. ${usageStr}`);
  }

  if (socket) {
    socket.emit('request-input', data, (response) => {
      try {
        callback(response);
      } catch (err) {
        util.sendError(player, err);
      }
      socket.emit('done');
    });
    return true;
  }
  return false;
}

function prompt(str) {
  const socket = SocketMap[this.id];
  if (socket) {
    socket.emit('output', { prompt: str });
    return true;
  }
  return false;
}

function match(x, y) {
  const xl = x.toLowerCase();
  const yl = y.toLowerCase();
  if (xl === yl) {
    return EXACT_MATCH;
  }
  if (xl.indexOf(yl) === 0) {
    return PARTIAL_MATCH;
  }
  return NO_MATCH;
}

function matches(search) {
  const _matches = this.aliases.concat([this.name]).map((name) => match(name, search));

  if (_matches.indexOf(EXACT_MATCH) >= 0) {
    return EXACT_MATCH;
  }
  if (_matches.indexOf(PARTIAL_MATCH) >= 0) {
    return PARTIAL_MATCH;
  }
  return NO_MATCH;
}

function findVerb(command, objects, self = this) {
  for (const key in this) {
    const prop = this[key];
    if (prop && prop.__verb__ && prop.matchesCommand(command, objects, self)) {
      return key;
    }
  }
  return void 0;
}

function destroy() {
  const children = this.children;

  if (this.isPlayer && this.isOnline) {
    throw new Error(`${this.id} is a player and is online, therefore cannot be destroyed.`);
  }

  if (children.length > 0) {
    const grandParent = this.parent;

    this.children.forEach((child) => {
      child.parent = grandParent;
    });
  }

  db.removeById(this.id);
  delete World[this.id];
  return true;
}

function getContents() {
  return db.findBy('locationId', this.id).map((object) => World[object.id]);
}

function getChildren() {
  return db.findBy('parentId', this.id).map((object) => World[object.id]);
}

function getParent() {
  return World[db.findById(this.id).parentId];
}

function setParent(newParent) {
  const dbObject = db.findById(this.id);
  const parentObj = util.deserializeReferences(newParent);
  const newParentId = parentObj ? parentObj.id : void 0;

  if (!parentObj || !(newParentId in World)) {
    throw new Error('Parent must be a valid world object.');
  }

  if (dbObject.parentId !== newParentId) {
    dbObject.parentId = newParentId;
    this.reload();
  }
}

function reload() {
  // TODO this is a circular dependency, fix this
  const worldObjectProxy = require('./world-object-proxy').default; // TODO: import?

  World[this.id] = worldObjectProxy(db.findById(this.id));
  World[this.id].children.forEach((child) => {
    child.reload();
  });
  return true;
}

function getLocation() {
  return World[db.findById(this.id).locationId];
}

function setLocation(newLocation) {
  const locationObj = util.deserializeReferences(newLocation);
  const newLocationId = locationObj ? locationObj.id : void 0;

  if (newLocationId && !(newLocationId in World)) {
    throw new Error('Location must be null, undefined, or a valid world object.');
  }

  db.findById(this.id).locationId = newLocationId;
}

function getName() {
  return db.findById(this.id).name;
}

function nameTaken(player, name) {
  for (const id in World) {
    const object = World[id];

    if (object !== player && object.name === name) {
      return true;
    }
  }
  return false;
}

function setName(newName) {
  const dbObject = db.findById(this.id);

  if (!(newName && newName.constructor.name === 'String')) {
    throw new Error('Name must be a non-empty string.');
  }
  if (this.isPlayer && nameTaken(this, newName)) {
    throw new Error('Sorry, that name belongs to another player.');
  }
  if (dbObject.name !== newName) {
    if (this.isPlayer) { this.prompt(newName); }
    dbObject.name = newName;
  }
}

function getAliases() {
  return db.findById(this.id).aliases;
}

function setAliases(newAliases) {
  if (newAliases && newAliases.constructor.name === 'Array') {
    newAliases.forEach((x) => {
      if (!(x && x.constructor.name === 'String')) {
        throw new Error('Aliases must be an array of non-empty strings.');
      }
    });
  } else {
    throw new Error('Aliases must be an array of non-empty strings.');
  }

  db.findById(this.id).aliases = newAliases;
}

function getIsPlayer() {
  return db.findById(this.id).type === 'Player';
}

function getIsOnline() {
  if (this.isPlayer) {
    return !!SocketMap[this.id];
  }
  return void 0;
}

function getIsProgrammer() {
  if (this.isPlayer) {
    return db.findById(this.id).isProgrammer;
  }
  return void 0;
}

function setIsProgrammer(newBool) {
  if (this.isPlayer) {
    db.findById(this.id).isProgrammer = !!newBool;
  } else {
    throw new Error(`${this.id} is not a player.`);
  }
}

function getLastActivity() {
  if (this.isPlayer) {
    return db.findById(this.id).lastActivity;
  }
  return void 0;
}

function matchObjects(command) {
  return {
    dobj: command.dobjstr ? this.findObject(command.dobjstr) : World.Nothing,
    iobj: command.iobjstr ? this.findObject(command.iobjstr) : World.Nothing,
  };
}

function findObject(search) {
  if (search === 'me' || search === 'myself') {
    return this;
  } else if (search === 'here') {
    return this.location;
  }
  return this.findNearby(search);
}

function findNearby(search) {
  if (search === '') {
    return World.FailedMatch;
  }

  const searchItems = this.contents
    .concat((this.location ? this.location.contents : [])
    .filter((object) => object !== this));

  const potentialMatches = searchItems.map((object) => [object.matches(search), object]);
  const exactMatches = potentialMatches.filter((m) => m[0] === EXACT_MATCH);
  const partialMatches = potentialMatches.filter((m) => m[0] === PARTIAL_MATCH);

  if (exactMatches.length === 1) {
    return exactMatches[0][1];
  } else if (exactMatches.length > 1) {
    return World.AmbiguousMatch;
  }

  if (partialMatches.length === 1) {
    return partialMatches[0][1];
  } else if (partialMatches.length > 1) {
    return World.AmbiguousMatch;
  }

  return World.FailedMatch;
}

function newObject(object) {
  // TODO this is a circular dependency, fix this
  const worldObjectProxy = require('./world-object-proxy').default; // TODO: import?
  const id = object.id;

  if (globals.indexOf(id) !== -1) {
    throw new Error(`${id} is a reserved name.`);
  }

  object.parentId = this.id;
  const newObj = makeObject(object);

  db.insert(newObj);
  World[id] = worldObjectProxy(newObj);
  return World[id];
}

function withSocket(fn) {
  return {
    __requires_socket__: (socket) => {
      fn.call(this, socket);
    },
  };
}

function edit(name) {
  return withSocket((socket) => {
    if (this[name] && this[name].__verb__) {
      socket.emit('edit-verb', { objectId: this.id, verb: util.serializeVerb(name, this[name]) });
    } else if (this[name] && this[name].__source__) {
      socket.emit('edit-function', { objectId: this.id, src: this[name].__source__, name });
    } else {
      throw new Error(`Invalid edit call. Usage: ${this.id}.edit(verbOrFunctionName)`);
    }
  });
}

function addVerb(name, pattern, dobjarg, preparg, iobjarg, code) {
  this[name] = makeVerb(pattern, dobjarg, preparg, iobjarg, code, name);
  return this.edit(name);
}

function addFunction(name) {
  // TODO use vm here instead of eval
  this[name] = eval(`(function ${name}() {\n  \n})`); // eslint-disable-line no-eval
  return this.edit(name);
}

// override toString on built in functions to hide "native code"
util.overrideToString(toString, 'toString');
util.overrideToString(isA, 'isA');
util.overrideToString(send, 'send');
util.overrideToString(setPrompt, 'setPrompt');
util.overrideToString(ask, 'ask');
util.overrideToString(prompt, 'prompt');
util.overrideToString(matches, 'matches');
util.overrideToString(findVerb, 'findVerb');
util.overrideToString(destroy, 'destroy');
util.overrideToString(reload, 'reload');
util.overrideToString(matchObjects, 'matchObjects');
util.overrideToString(findObject, 'findObject');
util.overrideToString(findNearby, 'findNearby');
util.overrideToString(newObject, 'newObject');
util.overrideToString(edit, 'edit');
util.overrideToString(addVerb, 'addVerb');
util.overrideToString(addFunction, 'addFunction');

util.modifyObject(base, (property, accessor) => {
  // attach properties
  property('toString', toString);
  property('isA', isA);
  property('send', send);
  property('setPrompt', setPrompt);
  property('ask', ask);
  property('prompt', prompt);
  property('matches', matches);
  property('findVerb', findVerb);
  property('destroy', destroy);
  property('reload', reload);
  property('matchObjects', matchObjects);
  property('findObject', findObject);
  property('findNearby', findNearby);
  property('new', newObject);
  property('edit', edit);
  property('addVerb', addVerb);
  property('addFunction', addFunction);
  property('__proxy__', true);

  // attach getters/setters
  accessor('contents', getContents);
  accessor('children', getChildren);
  accessor('parent', getParent, setParent);
  accessor('location', getLocation, setLocation);
  accessor('name', getName, setName);
  accessor('aliases', getAliases, setAliases);
  accessor('isPlayer', getIsPlayer, null, false);
  accessor('isOnline', getIsOnline, null, false);
  accessor('isProgrammer', getIsProgrammer, setIsProgrammer, false);
  accessor('lastActivity', getLastActivity, null, false);
});

export default base;
