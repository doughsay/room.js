import http from 'http';
import socketIo from 'socket.io';

import * as config from './config/app';

import { serverLogger } from './lib/logger';
import loadWorld from './lib/load-world';
import runHook from './lib/run-hook';

import socketController from './controllers/socket-controller';

loadWorld();

const server = http.createServer();
const io = socketIo(server);

io.on('connection', socketController);

server.listen(config.port, (err) => {
  if (err) { throw err; }
  runHook(null, 'System', 'onServerStarted');
  serverLogger.info('%s started on %s', config.appName, config.port);
});
