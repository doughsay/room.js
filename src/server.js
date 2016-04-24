const http = require('http');
const socketIo = require('socket.io');

const { version, port, maintenance } = require('./config/config');
const logger = require('./config/logger');
const SocketController = require('./controllers/socket-controller');

const server = http.createServer();
const io = socketIo(server);

const world = require('./state/world');
const db = require('./state/db');
const userDb = require('./state/user-db');
const controllerMap = require('./state/controller-map');

io.on('connection', socket => {
  if (maintenance) {
    socket.emit('output', 'Server in maintenance mode. Please check back later.');
  } else {
    const controller = new SocketController(socket, world, db, userDb, controllerMap, logger);
    controller.onConnection();
  }
});

server.listen(port, err => {
  if (err) { throw err; }
  world.runHook('system', 'onServerStarted');
  logger.info({ version, port }, 'started');
});
