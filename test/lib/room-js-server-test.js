process.env.NODE_ENV = 'test';

const bunyan = require('bunyan');
const test = require('tape');
const io = require('socket.io-client');

const RoomJSServer = require('../../src/lib/room-js-server');

const testPort = 8889;
const socketURL = `http://localhost:${testPort}`;
const options = {
  transports: ['websocket'],
  forceNew: true
};

function testLogger() {
  return bunyan.createLogger({ name: 'test', streams: [] });
}

function testConfig() {
  return {
    worldDirectory: 'test-state/world',
    userDbFile: 'test-state/users.json',
    maintenance: false,
    port: testPort,
    version: 'test',
  };
}

function testServer() {
  return new RoomJSServer(testLogger(), testConfig());
}

function setupTimeout(t, timeout = 500) {
  const teardownCbs = [];
  const teardown = () => { teardownCbs.forEach(cb => { cb(); }); };
  const fail = () => { teardown(); t.fail(); t.end(); };
  const failTimeout = setTimeout(() => { fail(); }, timeout);
  const end = () => { clearTimeout(failTimeout); teardown(); t.end(); };
  const onTeardown = (cb) => { teardownCbs.push(cb); };

  return [end, onTeardown]
}

function insertTestUser(server, id = 'test') {
  server.userDb.insert({
    id, password: 'jAVsDRvHKWu9::v1vJ+yNnKyuHTv4nKLjwECWl/J5IhpUmWHTQ3OI9::30::10000' // "test"
  });
}

function insertTestPlayer(server, id = 'test') {
  const newPlayerObj = {
    id: id,
    name: id,
    aliases: [],
    traitIds: [],
    locationId: null,
    userId: id,
    properties: {
      programmer: { value: true }
    },
  };

  server.db.insert(newPlayerObj);
  server.world.insert(newPlayerObj);
}

// test wrapper function for socket server
function stest(description, run) {
  test(description, t => {
    const [end, onTeardown] = setupTimeout(t);

    const server = testServer();
    onTeardown(() => {
      server.userDb.clear();
      server.db.clear();
      server.close();
    });

    server.start();
    server.on('ready', () => {
      const socket = io(socketURL, options);
      onTeardown(() => { socket.disconnect(); });

      run(t, { server, socket, end });
    });
  });
}

// Tests:

stest('RoomJSServer: create a user account', (t, { socket, end }) => {
  socket.emit('input', 'create');

  socket.once('request-input', (inputs, cb) => {
    const expectedInputs = [
      { label: 'create username', name: 'username', type: 'text' },
      { label: 'create password', name: 'password', type: 'password' },
      { label: 'repeat password', name: 'password2', type: 'password' },
    ];

    t.deepEqual(inputs, expectedInputs);

    cb({ username: 'test', password: 'test', password2: 'test' });

    socket.once('output', (msg) => {
      const expectedResponse =
        'Welcome test!\nType \x1b[1m\x1b[35mhelp\x1b[39m\x1b[22m for a list of available commands.'

      t.equal(msg, expectedResponse);
      end();
    });
  });
});

stest('RoomJSServer: attempt to create a user account that already exists', (t, { server, socket, end }) => {
  insertTestUser(server);

  socket.emit('input', 'create');

  socket.once('request-input', (inputs, cb) => {
    cb({ username: 'test', password: 'test', password2: 'test' });

    socket.once('output', (msg) => {
      const expectedResponse =
        '\x1b[31mSorry, that username is taken.\x1b[39m'

      t.equal(msg, expectedResponse);
      end();
    });
  });
});

stest('RoomJSServer: login', (t, { server, socket, end }) => {
  insertTestUser(server);

  socket.emit('input', 'login');

  socket.once('request-input', (inputs, cb) => {
    const expectedInputs = [
      { label: 'username', name: 'username', type: 'text' },
      { label: 'password', name: 'password', type: 'password' },
    ];

    t.deepEqual(inputs, expectedInputs);

    cb({ username: 'test', password: 'test' });

    socket.once('output', (msg) => {
      const expectedResponse = 'Hi test!'

      t.equal(msg, expectedResponse);
      end();
    });
  });
});

stest('RoomJSServer: create player', (t, { server, socket, end }) => {
  insertTestUser(server);

  socket.emit('input', 'login');

  socket.once('request-input', (_, cb) => {
    cb({ username: 'test', password: 'test' });

    socket.once('output', () => {
      socket.emit('input', 'create');

      socket.once('request-input', (inputs, cb) => {
        const expectedInputs = [ { label: 'player name', name: 'playerName', type: 'text' } ];

        t.deepEqual(inputs, expectedInputs);

        cb({ playerName: 'test' });

        socket.once('output', (msg) => {
          const expectedResponse =
            'Character created! To start the game now, type \x1b[1m\x1b[35mplay\x1b[39m\x1b[22m!'

          t.equal(msg, expectedResponse);
          end();
        });
      });
    });
  });
});

stest('RoomJSServer: play', (t, { server, socket, end }) => {
  insertTestUser(server);
  insertTestPlayer(server);

  socket.emit('input', 'login');

  socket.once('request-input', (_, cb) => {
    cb({ username: 'test', password: 'test' });

    socket.once('output', () => {
      socket.emit('input', 'play');

      socket.once('output', (msg) => {
        const expectedResponse = 'Now playing as test'

        t.equal(msg, expectedResponse);
        end();
      });
    });
  });
});

stest('RoomJSServer: eval code', (t, { server, socket, end }) => {
  insertTestUser(server);
  insertTestPlayer(server);

  socket.emit('input', 'login');

  socket.once('request-input', (_, cb) => {
    cb({ username: 'test', password: 'test' });

    socket.once('output', () => {
      socket.emit('input', 'play');

      socket.once('output', (msg) => {
        socket.emit('input', 'eval 2 + 2');

        socket.once('output', (msg) => {
          const expectedResponse = '\x1b[0m\x1b[33m4\x1b[39m\x1b[0m'

          t.equal(msg, expectedResponse);
          end();
        });
      });
    });
  });
});
