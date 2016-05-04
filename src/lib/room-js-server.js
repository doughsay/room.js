const EventEmitter = require('events');
const util = require('util');
const http = require('http');
const socketIo = require('socket.io');

const MooDB = require('./moo-db');
const World = require('./world');
const SimpleDB = require('./simple-db');
const onExit = require('./on-exit');
const SocketController = require('../controllers/socket-controller');

class RoomJSServer {
  constructor(logger, config) {
    this.config = config;
    this.logger = logger;
    this.setupState();
    this.setupServers();
  }

  setupState() {
    const { worldDirectory } = this.config;
    this.db = new MooDB(worldDirectory, this.logger);
    this.db.on('ready', () => { this.emit('ready'); });
    this.controllerMap = new Map();
    this.world = new World(this.logger, this.db, this.controllerMap);
    this.setupUserDb();
  }

  setupUserDb() {
    const { userDbFile } = this.config;
    this.userDb = new SimpleDB(userDbFile);
    const save = () => this.userDb.saveSync();

    onExit(save);
    this.userDbSaveInterval = setInterval(save, 30 * 60 * 1000); // every 30 minutes
  }

  setupServers() {
    const { maintenance } = this.config;

    this.server = http.createServer();
    this.io = socketIo(this.server);

    this.io.on('connection', socket => {
      if (maintenance) {
        socket.emit('output', 'Server in maintenance mode. Please check back later.');
      } else {
        const controller = new SocketController(
          socket, this.world, this.db, this.userDb, this.controllerMap, this.logger
        );
        controller.onConnection();
      }
    });
  }

  start() {
    const { port, version } = this.config;

    this.server.listen(port, err => {
      if (err) { throw err; }
      this.world.runHook('system', 'onServerStarted');
      this.logger.info({ version, port }, 'started');
    });
  }

  close() {
    clearInterval(this.userDbSaveInterval);
    this.removeAllListeners();
    this.userDb.saveSync();
    this.db.close();
    this.io.close();
    this.server.close();
    this.logger.info('server stopped');
  }
}
util.inherits(RoomJSServer, EventEmitter);

module.exports = RoomJSServer;
