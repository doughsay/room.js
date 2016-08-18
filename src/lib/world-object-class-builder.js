const C3 = require('./c3');
const idify = require('./idify');
const parseNoun = require('./parse').parseNoun;

// TODO: this file needs some refactoring

const NO_MATCH = 0;
const EXACT_MATCH = 1;
const PARTIAL_MATCH = 2;

function linearize(object, linearization = new C3(object)) {
  object.traits.forEach((trait, index) => {
    if (trait !== void 0) {
      linearization.add(object, trait);
      linearize(trait, linearization);
    } else {
      // Attempt at gracefully handle a broken trait chain
      // e.g. the parent object was destroyed
      object.traits.splice(index, 1);
    }
  });
  return linearization.run();
}

function match(name, search) {
  if (search === void 0) {
    return EXACT_MATCH;
  }
  
  const xl = name.toLowerCase();
  const yl = search.toLowerCase();
  if (xl === yl) {
    return EXACT_MATCH;
  }
  if (xl.indexOf(yl) === 0) {
    return PARTIAL_MATCH;
  }
  return NO_MATCH;
}

function getMatchesWithDeterminer(foundMatches, determiner, ambiguous, fail) {
  const length = foundMatches.length;
  if (determiner === void 0) { // one, definite
    if (length === 1) {
        return foundMatches[0][1];
    } 
    return ambiguous;
  } else if (determiner === "any") { // one, indefinite => random
    return foundMatches[Math.floor(Math.random()*length)][1];
  } else if (determiner === "all") { // all
    return foundMatches.map(object => object[1]);
  } else { // one, by ordinal rank
    const n = Number(determiner) - 1;
    if (!isNaN(n) && n < length) {
       return foundMatches[n][1];
    }
    return fail;
  }
}
            
function matchPattern(pattern, str) {
  let patternParts;
  let rest;

  if (pattern === '*') {
    return true;
  }
  if (pattern.indexOf('*') !== -1) {
    patternParts = pattern.split('*');
    if (str === patternParts[0]) {
      return true;
    }
    if (str.indexOf(patternParts[0]) === 0) {
      if (patternParts[1] === '') {
        return true;
      }
      rest = str.slice(patternParts[0].length, str.length + 1);
      if (patternParts[1].indexOf(rest) === 0) {
        return true;
      }
    }
  } else {
    if (pattern === str) {
      return true;
    }
  }
  return false;
}

function matcheVerbPattern(pattern, str) {
  return pattern.split(' ').reduce((last, p) =>
    last || matchPattern(p, str)
  , false);
}

function verbMatchesCommand(verb, command, objects, self) {
  if (!matcheVerbPattern(verb.pattern, command.verb)) {
    return false;
  }
  switch (verb.dobjarg) {
    case 'none':
      if (typeof command.dobjstr !== 'undefined') {
        return false;
      }
      break;
    case 'this':
      if (objects.dobj !== self) {
        return false;
      }
      break;
    default:
      break;
  }
  switch (verb.iobjarg) {
    case 'none':
      if (typeof command.iobjstr !== 'undefined') {
        return false;
      }
      break;
    case 'this':
      if (objects.iobj !== self) {
        return false;
      }
      break;
    default:
      break;
  }
  switch (verb.preparg) {
    case 'none':
      if (typeof command.prepstr !== 'undefined') {
        return false;
      }
      break;
    case 'any':
      return true;
    default:
      if (verb.preparg.split('/').indexOf(command.prepstr) < 0) {
        return false;
      }
  }
  return true;
}

class WorldObjectClassBuilder {
  constructor(db, world, controllerMap) {
    this.db = db;
    this.world = world;
    this.controllerMap = controllerMap;
  }

  buildClass() {
    const db = this.db;
    const world = this.world;
    const controllerMap = this.controllerMap;

    return class WorldObject {
      constructor(properties) {
        for (const key in properties) { // eslint-disable-line guard-for-in
          this[key] = properties[key];
        }
      }

      get online() {
        return !!controllerMap.get(this.id);
      }

      toString() {
        return `[object ${this.id}]`;
      }

      send(msg) {
        const controller = controllerMap.get(this.id);
        if (controller) {
          controller.emit('output', msg);
          return true;
        }
        return false;
      }

      setPrompt(str) {
        const controller = controllerMap.get(this.id);
        if (controller) {
          controller.emit('set-prompt', str);
          return true;
        }
        return false;
      }

      addAlias(...args) {
        const aliases = this.aliases;
        const ret = aliases.push(...args);
        this.aliases = aliases;
        return ret;
      }

      rmAlias(...args) {
        this.aliases = this.aliases.filter(a => args.indexOf(a) === -1);
        return this.aliases.length;
      }

      addTrait(...args) {
        const traits = this.traits;
        const ret = traits.push(...args);
        this.traits = traits;
        return ret;
      }

      rmTrait(...args) {
        this.traits = this.traits.filter(a => args.indexOf(a) === -1);
        return this.traits.length;
      }

      linearize() {
        return linearize(this);
      }

      instanceOf(object) {
        return this.linearize().indexOf(object) !== -1;
      }

      keys() {
        const objects = this.linearize();
        const propertySet = new Set();
        objects.forEach(object => {
          Reflect.ownKeys(object).forEach(key => { propertySet.add(key); });
        });
        return [...propertySet.values()];
      }

      values() {
        return this.keys().map(k => this[k]);
      }

      new(id, props = {}) {
        // Sanitize the id, in case it wasn't previously checked with nextId()
        id = idify(id);
        
        if (id in world.context) {
          throw new TypeError(`Identifier '${id}' has already been declared`);
        }

        const newObj = {
          id,
          name: id,
          aliases: [],
          traitIds: [this.id],
          locationId: null,
          properties: {},
        };

        db.insert(newObj);
        world.insert(newObj);
        const object = world.get(id);

        for (const key in props) {
          if (props.hasOwnProperty(key)) {
            object[key] = props[key];
          }
        }

        return object;
      }

      destroy() {
        if (this.player && this.online) {
          throw new Error(`${this.id} is a player and is online, therefore cannot be destroyed.`);
        }

        db.removeById(this.id);
        world.removeById(this.id);

        return true;
      }

      matchObjects(command) {
        return {
          dobj: command.dobjstr ? this.findObject(command.dobjstr) : world.get('nothing'),
          iobj: command.iobjstr ? this.findObject(command.iobjstr) : world.get('nothing'),
        };
      }

      findObject(search) {
        if (search === 'me' || search === 'myself') {
          return this;
        } else if (search === 'here') {
          return this.location;
        }
        return this.findNearby(search);
      }

      findNearby(search) {
        if (search === '') {
          return world.get('fail');
        }

        let searchItems = [];

        // Stuff inside this object.
        searchItems = searchItems.concat(this.contents);

        if (this.location) {
          // Stuff in the location this object is in.
          searchItems = searchItems.concat(this.location.contents);

          // Maybe add extra match objects from the location this object is in.
          let extraMatchObjects = [];

          if (Array.isArray(this.location.extraMatchObjects)) {
            extraMatchObjects = this.location.extraMatchObjects;
          }

          if (typeof this.location.extraMatchObjects === 'function') {
            const potentialExtraMatchObjects = this.location.extraMatchObjects();
            if (Array.isArray(potentialExtraMatchObjects)) {
              extraMatchObjects = potentialExtraMatchObjects;
            }
          }

          searchItems = searchItems.concat(extraMatchObjects);
        }

        searchItems = searchItems.filter(object => object !== this);
      
        const [determiner, noun] = parseNoun(search);

        const potentialMatches = searchItems.map(object => [object.matches(noun), object]);
        const exactMatches = potentialMatches.filter(m => m[0] === EXACT_MATCH);
        const partialMatches = potentialMatches.filter(m => m[0] === PARTIAL_MATCH);

        return this.findMatch(exactMatches, partialMatches, determiner);
      }

      findInside(search) {
        if (search === '') {
          return world.get('fail');
        }

        const [determiner, noun] = parseNoun(search);
        
        const potentialMatches = this.contents.map(object => [object.matches(noun), object]);
        const exactMatches = potentialMatches.filter(m => m[0] === EXACT_MATCH);
        const partialMatches = potentialMatches.filter(m => m[0] === PARTIAL_MATCH);
        return this.findMatch(exactMatches, partialMatches, determiner);
      }
      
      findMatch(partialMatches, exactMatches, determiner) {
        if (exactMatches.length > 0) {
          let result = getMatchesWithDeterminer(exactMatches, determiner, 
            world.get('ambiguous'), world.get('fail'));            
            // For now, treat collections as ambiguous
            return Array.isArray(result) ? world.get('ambiguous') : result;
        }

        if (partialMatches.length > 0) {
          let result = getMatchesWithDeterminer(partialMatches, determiner, 
            world.get('ambiguous'), world.get('fail'));
            // For now, treat collections as ambiguous
            return Array.isArray(result) ? world.get('ambiguous') : result;
        }

        return world.get('fail');
      }
      
      matches(search) {
        const matches = this.aliases.concat([this.name]).map(name => match(name, search));

        if (matches.indexOf(EXACT_MATCH) >= 0) {
          return EXACT_MATCH;
        }
        if (matches.indexOf(PARTIAL_MATCH) >= 0) {
          return PARTIAL_MATCH;
        }
        return NO_MATCH;
      }

      matchVerb(command, objects) {
        let verb;

        verb = this.findVerb(command, objects);
        if (verb) {
          return { verb, this: this };
        }

        if (this.location) {
          verb = this.location.findVerb(command, objects);
          if (verb) {
            return { verb, this: this.location };
          }
        }

        if ((objects.dobj) && !Array.isArray(objects.dobj)) {
          verb = objects.dobj.findVerb(command, objects);
          if (verb) {
            return { verb, this: objects.dobj };
          }
        }

        if ((objects.iobj) && !Array.isArray(objects.iobj)) {
          verb = objects.iobj.findVerb(command, objects);
          if (verb) {
            return { verb, this: objects.iobj };
          }
        }

        return null;
      }

      findVerb(command, objects, self = this) {
        for (const key of this.keys()) {
          const prop = this[key];
          if (prop && prop.verb && verbMatchesCommand(prop, command, objects, self)) {
            return key;
          }
        }
        return void 0;
      }
    };
  }
}

module.exports = WorldObjectClassBuilder;
