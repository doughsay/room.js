const bunyan = require('bunyan');
const UnauthenticatedUserController = require('./unauthenticated-user-controller');
const UserController = require('./user-controller');
const PlayerController = require('./player-controller');
const ProgrammerController = require('./programmer-controller');
const { boldMagenta, boldBlue, red } = require('../lib/colors');
const logger = require('../config/logger');

class SocketController {
  constructor(socket, world, db, userDb, controllerMap) {
    this.socket = socket;
    this.world = world;
    this.db = db;
    this.userDb = userDb;
    this.controllerMap = controllerMap;
    this.logger = logger.child({ socketId: this.socket.id });

    this.unauthenticatedUserController = new UnauthenticatedUserController(this);
    this.userController = new UserController(this);
    this.playerController = new PlayerController(this);
    this.programmerController = new ProgrammerController(this);

    socket.on('disconnect', this.onDisconnect.bind(this));
    socket.on('input', this.onInput.bind(this));
    socket.on('tab-key-press', this.onTabKeyPress.bind(this));
    socket.on('search', this.onSearch.bind(this));
    socket.on('get-verb', this.onGetVerb.bind(this));
    socket.on('get-function', this.onGetFunction.bind(this));
    socket.on('save-verb', this.onSaveVerb.bind(this));
    socket.on('save-function', this.onSaveFunction.bind(this));
    socket.on('error', this.onError.bind(this));
  }

  emit(...args) { this.socket.emit(...args); }

  onConnection() {
    const welcome = [
      `Welcome to ${boldBlue('room.js')}!`,
      `Type ${boldMagenta('help')} for a list of available commands.`,
    ].join('\n');

    this.logger.debug('connected');
    this.emit('output', welcome);
  }

  onDisconnect() {
    this.logger.debug('disconnected');
    if (this.player) {
      this.world.runHook('system', 'onPlayerDisconnected', this.player.id);
      this.controllerMap.delete(this.player.id);
    }
    delete this.player;
  }

  onInput(input) {
    if (this.player) {
      this.logger.trace({ user: this.user.id, player: this.player.id, input }, 'input');
      this.playerController.onInput(input);
    } else if (this.user) {
      this.logger.trace({ user: this.user.id, input }, 'input');
      this.userController.onInput(input);
    } else {
      this.logger.trace({ input }, 'input');
      this.unauthenticatedUserController.onInput(input);
    }
  }

  onTabKeyPress(...args) {
    if (this.player) {
      this.playerController.onTabKeyPress(...args);
    }
  }

  onSearch(query, done) {
    if (this.player && this.player.programmer) {
      this.programmerController.onSearch(query, done);
    } else {
      done([]);
    }
  }

  onGetVerb(data, done) {
    if (this.player && this.player.programmer) {
      this.programmerController.onGetVerb(data, done);
    } else {
      done(void 0);
    }
  }

  onGetFunction(data, done) {
    if (this.player && this.player.programmer) {
      this.programmerController.onGetFunction(data, done);
    } else {
      done(void 0);
    }
  }

  onSaveFunction(data, done) {
    if (this.player && this.player.programmer) {
      this.programmerController.onSaveFunction(data, done);
    } else {
      done('Unauthorized');
    }
  }

  onSaveVerb(data, done) {
    if (this.player && this.player.programmer) {
      this.programmerController.onSaveVerb(data, done);
    } else {
      done('Unauthorized');
    }
  }

  onError(err) {
    this.emit('output', red('Internal server errror.'));
    this.logger.error({ err: bunyan.stdSerializers.err(err) }, 'uncought error');
  }
}

module.exports = SocketController;
