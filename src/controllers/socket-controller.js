import vm from 'vm';
import chalk from 'chalk';
import Fuse from 'fuse.js';

import parse from '../lib/parser';
import print from '../lib/print';
import World from '../lib/world';
import db from '../lib/db';
import userdb from '../lib/user-db';
import SocketMap from '../lib/socket-map';
import worldObjectProxy from '../lib/world-object-proxy';
import context from '../lib/context';
import runHook from '../lib/run-hook';
import util from '../lib/util';
import makeVerb from '../lib/make-verb';
import rewriteEval from '../lib/rewrite-eval';
import Pbkdf2 from '../lib/pbkdf2';
import { socketLogger, vmLogger } from '../lib/logger';

const hasher = new Pbkdf2();
const bm = chalk.bold.magenta;
const bb = chalk.bold.blue;
const red = chalk.red;
const gray = chalk.gray;

const fuse = new Fuse([], { keys: ['objectId', 'verb', 'function'] });

// Socket events

// run a verb
function onRunVerb(command, matchedObjects, matchedVerb, verbstrOverride) {
  const playerId = this.rjs.playerId;
  const dobjId = matchedObjects.dobj.id;
  const iobjId = matchedObjects.iobj.id;
  const verbstr = util.wrapString(verbstrOverride || matchedVerb.verb);
  const argstr = util.wrapString(command.argstr);
  const dobjstr = util.wrapString(command.dobjstr);
  const prepstr = util.wrapString(command.prepstr);
  const iobjstr = util.wrapString(command.iobjstr);
  const player = World[playerId];

  const args = [playerId, dobjId, iobjId, verbstr, argstr, dobjstr, prepstr, iobjstr];
  const verbStatement = `${matchedVerb.self.id}[${util.wrapString(matchedVerb.verb)}]`;
  const code = `${verbStatement}(${args.join(', ')})`;

  vmLogger.debug(code);

  try {
    vm.runInContext(code, context, {
      filename: `Verb::${matchedVerb.self.id}.${matchedVerb.verb}`,
      timeout: 500,
    });
  } catch (err) {
    util.sendError(player, err);
  }
}

// eval js code and send pretty output
function onEval(input) {
  try {
    const code = rewriteEval(input, this.rjs.playerId);

    vmLogger.debug(code);

    let retVal = vm.runInContext(code, context, {
      filename: `Eval::${this.rjs.playerId}`,
      timeout: 500,
    });

    if (retVal && retVal.__requires_socket__) {
      // TODO: we're trusting this code more than usual
      retVal = retVal.__requires_socket__(this);
    }

    this.emit('output', print(retVal, 1));
  } catch (err) {
    this.emit('output', util.formatError(err));
  }
}

// parse and process a player's command
function onCommand(input) {
  const player = World[this.rjs.playerId];
  const [hookRan, processedInput] = runHook(
    player.id, 'System', 'preprocessCommand', player.id, util.wrapString(input)
  );
  const command = parse(hookRan ? processedInput : input);

  db.findById(player.id).lastActivity = new Date();

  if (command.verb === 'eval' && player.isProgrammer) {
    onEval.call(this, command.argstr);
  } else if (command.verb === 'quit') {
    runHook(player.id, 'System', 'onPlayerDisconnected', player.id);
    this.emit('set-prompt', this.rjs.user.id);
    this.emit('output', 'Bye!');
    delete SocketMap[player.id];
    delete this.rjs.playerId;
  } else {
    const matchedObjects = World[this.rjs.playerId].matchObjects(command);
    const matchedVerb = context.matchVerb(World[this.rjs.playerId], command, matchedObjects);

    if (matchedVerb) {
      onRunVerb.call(this, command, matchedObjects, matchedVerb);
    } else if (player.location && player.location.verbMissing) {
      const verbMissing = { verb: 'verbMissing', self: player.location };
      onRunVerb.call(this, command, matchedObjects, verbMissing, command.verb);
    } else {
      this.emit('output', gray("I didn't understand that."));
    }
  }
}

function onPlayerInput(input) {
  onCommand.call(this, input);
}

function onLogin() {
  const inputs = [
    { type: 'text', label: 'username', name: 'username' },
    { type: 'password', label: 'password', name: 'password' },
  ];

  this.emit('request-input', inputs, ({ username, password }) => {
    const sanitizedUsername = username.trim();
    const user = userdb.findById(sanitizedUsername);

    if (!user) {
      this.emit('output', red('Invalid username or password.'));
      return;
    }

    hasher.checkPassword(password, user.password, (err, isValid) => {
      if (err) {
        this.emit('output', red('Invalid username or password.'));
        socketLogger.warn(`password check attempt failed: ${err}`);
        return;
      }

      if (!isValid) {
        this.emit('output', red('Invalid username or password.'));
        return;
      }

      user.lastLoginAt = new Date();
      this.emit('output', `Hi ${username}!`);
      this.emit('set-prompt', username);
      this.rjs.user = user;
    });
  });
}

function onCreateUser() {
  const inputs = [
    { type: 'text', label: 'create username', name: 'username' },
    { type: 'password', label: 'create password', name: 'password' },
    { type: 'password', label: 'repeat password', name: 'password2' },
  ];

  this.emit('request-input', inputs, ({ username, password, password2 }) => {
    const sanitizedUsername = username.trim();
    const user = userdb.findById(sanitizedUsername);

    if (user) {
      this.emit('output', red('Sorry, that username is taken.'));
      return;
    }

    if (password !== password2) {
      this.emit('output', red('Passwords did not match.'));
      return;
    }

    hasher.hashPassword(password, (err, hashedPassword) => {
      if (err) {
        this.emit('output', red('Bad password.'));
        socketLogger.warn(`password hash attempt failed: ${err}`);
        return;
      }

      const now = new Date();
      const newUser = {
        id: sanitizedUsername,
        password: hashedPassword,
        createdAt: now,
        updatedAt: now,
        lastLoginAt: now,
      };

      userdb.insert(newUser);
      this.rjs.user = newUser;

      this.emit('output', [
        `Welcome ${sanitizedUsername}!`,
        `Type ${bm('help')} for a list of available commands.`,
      ].join('\n'));
    });
  });
}

function onCreatePlayer() {
  const inputs = [
    { type: 'text', label: 'player name', name: 'playerName' },
  ];

  this.emit('request-input', inputs, ({ playerName }) => {
    const playerId = util.nextId(playerName); // should produce a new unique ID
    const playerObj = db.findBy('name', playerName)[0];

    if (playerId === '') {
      // if the name produces an invalid ID, let's just call the name invalid.
      this.emit('output', red('Sorry, that name is invalid.'));
      return;
    }

    if (playerObj) {
      this.emit('output', red('Sorry, a character by that name already exists.'));
      return;
    }

    const newPlayerObj = {
      id: playerId,
      userId: this.rjs.user.id,
      name: playerName,
      type: 'Player',
      aliases: [],
      properties: [],
      verbs: [],
      createdAt: new Date(),
      lastActivity: void 0,
      isProgrammer: true,
    };

    db.insert(newPlayerObj);
    World[newPlayerObj.id] = worldObjectProxy(newPlayerObj);
    runHook(playerId, 'System', 'onPlayerCreated', playerId);

    this.emit('output', `Character created! To start the game now, type ${bm('play')}!`);
  });
}

function logoutOtherInstance(player) {
  if (SocketMap[player.id]) {
    const socket = SocketMap[player.id];
    const msg = `You're playing as ${player.name} from another login session. Quitting...`;
    socket.emit('output', msg);
    socket.emit('set-prompt', socket.rjs.user.id);
    delete SocketMap[player.id].rjs.playerId;
  }
}

function loginPlayer(player) {
  logoutOtherInstance(player);
  this.emit('output', `Now playing as ${player.name}`);
  this.emit('set-prompt', player.name);
  this.rjs.playerId = player.id;
  SocketMap[player.id] = this;
  runHook(player.id, 'System', 'onPlayerConnected', player.id);
}

function onPlay() {
  const players = db.findBy('userId', this.rjs.user.id);

  if (players.length === 1) {
    loginPlayer.call(this, players[0]);
  } else if (players.length > 1) {
    const msg = ['Choose a character to play as:'];
    const inputs = [{ type: 'text', label: 'character', name: 'selection' }];

    players.forEach((p, i) => {
      msg.push(`${i + 1}. ${bb(p.name)}`);
    });

    this.emit('output', msg.join('\n'));
    this.emit('request-input', inputs, ({ selection }) => {
      const n = parseInt(selection, 10);

      const lowerCaseNames = players.map((p) => p.name.toLowerCase());
      const i = lowerCaseNames.indexOf(selection.toLowerCase());
      if (!isNaN(n) && n > 0 && n <= players.length) {
        loginPlayer.call(this, players[n - 1]);
      } else if (i !== -1) {
        loginPlayer.call(this, players[i]);
      } else {
        this.emit('output', red('Invalid selection.'));
        return;
      }
    });
  } else {
    const msg = `You have no characters to play as. Create one first with ${bm('create')}.`;
    this.emit('output', msg);
    return;
  }
}

function onDisconnect() {
  socketLogger.log('debug', 'socket disconnected');
  const playerId = this.rjs.playerId;
  if (playerId) {
    runHook(playerId, 'System', 'onPlayerDisconnected', playerId);
    delete SocketMap[playerId];
  }
  delete this.rjs;
}

function onUserInput(input) {
  if (input === 'help') {
    this.emit('output', [
      'Available commands:',
      `• ${bm('logout')} - logout of your account`,
      `• ${bm('create')} - create a new character`,
      `• ${bm('play')}   - enter the game`,
      `• ${bm('help')}   - show this message`,
    ].join('\n'));
  } else if (input === 'logout') {
    delete this.rjs.user;
    this.emit('output', 'Bye!');
    this.emit('set-prompt', '');
  } else if (input === 'create') {
    onCreatePlayer.call(this);
  } else if (input === 'play') {
    onPlay.call(this);
  } else {
    this.emit('output', red('Invalid command.'));
  }
}

function onUnauthenticatedInput(input) {
  const helpMsg = [
    'Available commands:',
    `• ${bm('login')}  - login to an existing account`,
    `• ${bm('create')} - create a new account`,
    `• ${bm('help')}   - show this message`,
  ].join('\n');

  if (input === 'help') {
    this.emit('output', helpMsg);
  } else if (input === 'login') {
    onLogin.call(this);
  } else if (input === 'create') {
    onCreateUser.call(this);
  } else {
    this.emit('output', red('Invalid command.'));
  }
}

function onInput(input) {
  socketLogger.log('verbose', `got input: ${input}`);

  if (this.rjs.playerId) {
    // a player sent input
    onPlayerInput.call(this, input);
  } else if (this.rjs.user) {
    // a logged in user sent input
    onUserInput.call(this, input);
  } else {
    // an unauthenticated socket sent input
    onUnauthenticatedInput.call(this, input);
  }
}

function onSaveVerb(data, fn) {
  const worldObject = World[data.objectId];
  const verb = data.verb;
  const player = World[this.rjs.playerId];

  if (!player || !player.isProgrammer) {
    fn('Unauthorized');
    return;
  }

  try {
    const newVerb = makeVerb(verb.pattern, verb.dobjarg, verb.preparg, verb.iobjarg, verb.code);

    worldObject[verb.name] = newVerb;
    fn('saved');
  } catch (err) {
    fn(err.toString());
  }
}

function onSaveFunction(data, fn) {
  const objectId = data.objectId;
  const worldObject = World[objectId];
  const src = data.src;
  const name = data.name;
  const player = World[this.rjs.playerId];

  if (!player || !player.isProgrammer) {
    fn('Unauthorized');
    return;
  }

  try {
    const newfunction = util.buildFunction({ __function__: src }, objectId, name);

    worldObject[name] = newfunction;
    fn('saved');
  } catch (err) {
    fn(err.toString());
  }
}

function onTabKeyPress({ direction }) {
  if (this.rjs.playerId) {
    const player = World[this.rjs.playerId];
    runHook(player.id, player.id, 'onTabKeyPress', direction);
  }
}

// TODO: this is incredibly innedfficient, but works for now
function onSearch(str, fn) {
  if (!str || !this.rjs.playerId || !World[this.rjs.playerId].isProgrammer) {
    fn([]);
  } else {
    const searchable = [];
    for (const objectId in World) {
      const object = World[objectId];
      for (const key in object) {
        const value = object[key];
        if (object.hasOwnProperty(key) && value) {
          if (value.__verb__) {
            searchable.push({ objectId, verb: key });
          } else if (value.__source__) {
            searchable.push({ objectId, function: key });
          }
        }
      }
    }
    fuse.set(searchable);
    const results = fuse.search(str);
    fn(results);
  }
}

function onGetVerb({ objectId, name }, fn) {
  if (!this.rjs.playerId || !World[this.rjs.playerId].isProgrammer) { fn(void 0); return; }
  const worldObject = World[objectId];
  if (!worldObject) { fn(void 0); return; }
  const verb = worldObject[name];
  if (!verb || !verb.__verb__) { fn(void 0); return; }
  fn({ objectId, verb: util.serializeVerb(name, verb) });
}

function onGetFunction({ objectId, name }, fn) {
  if (!this.rjs.playerId || !World[this.rjs.playerId].isProgrammer) { fn(void 0); return; }
  const worldObject = World[objectId];
  if (!worldObject) { fn(void 0); return; }
  const func = worldObject[name];
  if (!func || !func.__source__) { fn(void 0); return; }
  fn({ objectId, src: func.__source__, name });
}

function onConnect() {
  const welcome =
    `Welcome to ${bb('room.js')}!\nType ${bm('help')} for a list of available commands.`;

  this.rjs = {}; // rjs namespace for storing per socket data
  socketLogger.log('debug', 'socket connected');
  this.emit('output', welcome);
  this.on('disconnect', onDisconnect.bind(this));
  this.on('input', onInput.bind(this));
  this.on('save-verb', onSaveVerb.bind(this));
  this.on('save-function', onSaveFunction.bind(this));
  this.on('tab-key-press', onTabKeyPress.bind(this));
  this.on('search', onSearch.bind(this));
  this.on('get-verb', onGetVerb.bind(this));
  this.on('get-function', onGetFunction.bind(this));
}

export default function init(socket) {
  onConnect.call(socket);
}
