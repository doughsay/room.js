import vm from 'vm';
import chalk from 'chalk';

import World from './world';
import parse from './parser';
import util from './util';
import { Cron } from './cron';
import makeVerb from './make-verb';

const sandbox = World;

function real(object) {
  return object !== World.Nothing && object !== World.FailedMatch && object !== World.AmbigousMatch;
}

function matchVerb(player, command, objects) {
  let verb;

  verb = player.findVerb(command, objects);
  if (verb) {
    return { verb, self: player };
  }

  if (player.location) {
    verb = player.location.findVerb(command, objects);
    if (verb) {
      return { verb, self: player.location };
    }
  }

  if (real(objects.dobj)) {
    verb = objects.dobj.findVerb(command, objects);
    if (verb) {
      return { verb, self: objects.dobj };
    }
  }

  if (real(objects.iobj)) {
    verb = objects.iobj.findVerb(command, objects);
    if (verb) {
      return { verb, self: objects.iobj };
    }
  }

  return null;
}

function search(str) {
  const objects = [];

  for (const id in World) {
    const object = World[id];
    // matches return 0 1 or 2, in this case we care about 1 and 2
    if (typeof object.matches === 'function' && object.matches(str)) {
      objects.push(object);
    }
  }

  return objects;
}

function getPlayers() {
  const players = [];

  for (const id in World) {
    const object = World[id];
    if (object.isPlayer) {
      players.push(object);
    }
  }

  return players;
}

function getAll() {
  const objects = [];

  for (const id in World) {
    objects.push(World[id]);
  }

  return objects;
}

function $(id) {
  return World[id];
}

function nextId(raw) {
  return util.nextId(raw);
}

// override toString on built in functions to hide "native code"
util.overrideToString(parse, 'parse');
util.overrideToString(matchVerb, 'matchVerb');
util.overrideToString(makeVerb, 'verb');
util.overrideToString(search, 'search');
util.overrideToString($, '$');
util.overrideToString(nextId, 'nextId');

// util.overrideToString(white, 'white')
// util.overrideToString(gray, 'gray')
// util.overrideToString(black, 'black')
// util.overrideToString(blue, 'blue')
// util.overrideToString(cyan, 'cyan')
// util.overrideToString(green, 'green')
// util.overrideToString(magenta, 'magenta')
// util.overrideToString(red, 'red')
// util.overrideToString(yellow, 'yellow')
// util.overrideToString(orange, 'orange')
// util.overrideToString(bold, 'bold')
// util.overrideToString(inverse, 'inverse')
// util.overrideToString(pre, 'pre')
// util.overrideToString(format, 'format')
// util.overrideToString(compose, 'compose')
// util.overrideToString(util.intersperse, 'intersperse');

util.modifyObject(sandbox, (property, accessor) => {
  property('parse', parse);
  property('matchVerb', matchVerb);
  property('verb', makeVerb);
  property('search', search);
  property('$', $);
  property('Cron', Cron);
  property('nextId', nextId);
  property('eval', void 0);

  // color functions and helpers
  property('chalk', chalk);
  // property('white', white)
  // property('gray', gray)
  // property('black', black)
  // property('blue', blue)
  // property('cyan', cyan)
  // property('green', green)
  // property('magenta', magenta)
  // property('red', red)
  // property('yellow', yellow)
  // property('orange', orange)
  // property('bold', bold)
  // property('inverse', inverse)
  // property('pre', pre)
  // property('format', format)
  // property('compose', compose)
  // property('intersperse', util.intersperse);

  accessor('players', getPlayers, null, false);
  accessor('all', getAll, null, false);
});

module.exports = vm.createContext(sandbox);
