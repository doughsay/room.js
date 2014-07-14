'use strict';
var winston = require('../lib/winston')
  , socketLogger = winston.loggers.get('socket')
  , vmLogger = winston.loggers.get('vm')
  , parse = require('../lib/parser')
  , print = require('../lib/print')
  , wait = require('../lib/thunk-wait')
  , User = require('../models/user')
  , World = require('../lib/world')
  , db = require('../lib/db')
  , SocketMap = require('../lib/socket-map')
  , worldObjectProxy = require('../lib/world-object-proxy')
  , vm = require('vm')
  , context = require('../lib/context')
  , runHook = require('../lib/run-hook')
  , util = require('../lib/util')
  , makeVerb = require('../lib/make-verb')
  , rewriteEval = require('../lib/rewrite-eval')

  // color helpers
  , bm = compose(bold, magenta)
  , bb = compose(bold, blue)

// Socket events

function onConnect() {
  var welcome = [ 'Welcome to ', bb('room.js'), '!\n'
                , 'Type ', bm('help'), ' for a list of available commands.'
                ]

  this.rjs = {} // rjs namespace for storing per socket data
  socketLogger.log('debug', 'socket connected')
  this.emit('output', welcome)
  this.coOn('disconnect', onDisconnect)
  this.coOn('input', onInput)
  this.on('save-verb', onSaveVerb)
  this.on('save-function', onSaveFunction)
}
module.exports = onConnect

function *onDisconnect() {
  socketLogger.log('debug', 'socket disconnected')
  if (this.rjs.playerId) {
    runHook(this.rjs.playerId, 'System', 'onPlayerDisconnected', this.rjs.playerId)
    delete SocketMap[this.rjs.playerId]
  }
  delete this.rjs
}

function *onInput(input) {
  socketLogger.log('verbose', 'got input: ' + input)

  if (this.rjs.playerId) {
    // a player sent input
    yield onPlayerInput.call(this, input)
  }
  else if (this.rjs.user) {
    // a logged in user sent input
    yield onUserInput.call(this, input)
  }
  else {
    // an unauthenticated socket sent input
    yield onUnauthenticatedInput.call(this, input)
  }

  this.emit('done')
}

// Individual command processing functions

function *onPlayerInput(input) {
  yield onCommand.call(this, input)
}

function *onUserInput(input) {
  if (input === 'help') {
    this.emit ('output',  [ 'Available commands:',                           '\n'
                          , '* ', bm('logout'), ' - logout of your account', '\n'
                          , '* ', bm('create'), ' - create a new character', '\n'
                          , '* ', bm('play'), '   - enter the game',         '\n'
                          , '* ', bm('print'), '  - print test',             '\n'
                          , '* ', bm('help'), '   - show this message'
                          ]
              )
  }
  else if (input === 'logout') {
    delete this.rjs.user
    this.emit('output', {message: 'Bye!', prompt: ''})
  }
  else if (input === 'create') {
    yield onCreatePlayer
  }
  else if (input === 'play') {
    yield onPlay
  }
  else {
    this.emit('output', red('Invalid command.'))
  }
}

function *onUnauthenticatedInput(input) {
  var helpMsg = [ 'Available commands:',                                 '\n'
                , '* ', bm('login'), '  - login to an existing account', '\n'
                , '* ', bm('create'), ' - create a new account',         '\n'
                , '* ', bm('help'), '   - show this message'
                ]

  if (input === 'help') {
    this.emit ('output', helpMsg)
  }
  else if (input === 'login') {
    yield onLogin
  }
  else if (input === 'create') {
    yield onCreateUser
  }
  else {
    this.emit('output', red('Invalid command.'))
  }
}

function *onLogin() {
  var username = yield this.thunkEmit ('request-input', { prompt: 'username' })
    , password = yield this.thunkEmit ('request-input', { prompt: 'password'
                                                        , password: true
                                                        }
                                      )
    , user     = yield User.findOne({username: username}).exec()
    , isValid  = user ? yield user.checkPassword(password) : false

  if (isValid) {
    yield user.updateLastLogin()
    this.emit('output', {message: 'Hi ' + username + '!', prompt: username})
    this.rjs.user = user
  }
  else {
    // slow down each subsequent request to deter brute force
    // kinda silly...
    if (this.rjs.delay) {
      yield wait(this.rjs.delay)
      this.rjs.delay *= 2
    }
    else {
      this.rjs.delay = 200
    }
    this.emit('output', red('Invalid username or password.'))
  }
}

function *onCreateUser() {
  var username  = yield this.thunkEmit('request-input', {prompt: 'create username'})
    , password  = yield this.thunkEmit('request-input', {prompt: 'create password', password: true})
    , password2 = yield this.thunkEmit('request-input', {prompt: 'repeat password', password: true})
    , user      = yield User.findOne({username: username}).exec()

  if (user) {
    this.emit('output', red('Sorry, that username is taken.'))
    return
  }
  if (password !== password2) {
    this.emit('output', red('Passwords did not match.'))
    return
  }

  user = yield User.create({username: username, password: password, lastLogin: new Date()})

  this.emit('output', { message:  [ 'Welcome ', username, '! Type '
                                  ,  bm('help'), ' for a list of available commands.'
                                  ]
                      , prompt: username
                      })
  this.rjs.user = user
}

function *onCreatePlayer() {
  var playerName = yield this.thunkEmit('request-input', {prompt: 'player name'})
    , playerId   = util.nextId(playerName) // should produce a new unique ID
    , playerObj  = db.findBy('name', playerName)[0]

  if (playerId === '') {
    // if the name produces an invalid ID, let's just call the name invalid.
    this.emit('output', red('Sorry, that name is invalid.'))
    return
  }

  if (playerObj) {
    this.emit('output', red('Sorry, a character by that name already exists.'))
    return
  }

  playerObj = { id: playerId
              , userId: this.rjs.user.id
              , name: playerName
              , type: 'Player'
              , aliases: []
              , properties: []
              , verbs: []
              , createdAt: new Date()
              , lastActivity: void 0
              , isProgrammer: true
              }

  db.insert(playerObj)
  World[playerObj.id] = worldObjectProxy(playerObj)
  runHook(playerId, 'System', 'onPlayerCreated', playerId)

  this.emit('output', ['Character created! To start the game now, type ', bm('play'), '!'])
}

function *onPlay() {
  var players = db.findBy('userId', this.rjs.user.id)
    , output
    , selection
    , lowerCaseNames
    , n, i, player

  if (players.length === 1) {
    player = players[0]
  }
  else if (players.length > 1) {
    output = ['Choose a character to play as:']
    players.forEach(function(player, i) {
      output.push([(i+1), '. ', bb(player.name)])
    })
    selection = yield this.thunkEmit('request-input', {message: util.intersperse('\n', output), prompt: 'character'})
    n = parseInt(selection)
    lowerCaseNames = players.map(function(p) { return p.name.toLowerCase() })
    i = lowerCaseNames.indexOf(selection.toLowerCase())
    if (!isNaN(n) && n > 0 && n <= players.length ) {
      player = players[n-1]
    }
    else if (i !== -1) {
      player = players[i]
    }
    else {
      this.emit('output', red('Invalid selection.'))
      return
    }
  }
  else {
    this.emit('output', ['You have no characters to play as. Create one first with ', bm('create'), '.'])
    return
  }

  if (SocketMap[player.id]) {
    let msg = ['You\'re playing as ', player.name, ' from another login. Quitting...']

    SocketMap[player.id].emit('output', {message: msg, prompt: this.rjs.user.username})
    delete SocketMap[player.id].rjs.playerId
  }

  this.emit('output', {message: ['Now playing as ', player.name], prompt: player.name})
  this.rjs.playerId = player.id
  SocketMap[player.id] = this

  runHook(player.id, 'System', 'onPlayerConnected', player.id)
}

// parse and process a player's command
function *onCommand(input) {
  var command = parse(input)
    , player = World[this.rjs.playerId]

  db.findById(player.id).lastActivity = new Date()

  if (command.verb === 'eval' && player.isProgrammer) {
    yield onEval.call(this, command.argstr)
  }
  else if (command.verb === 'quit') {
    runHook(player.id, 'System', 'onPlayerDisconnected', player.id)
    this.emit('output', {message: 'Bye!', prompt: this.rjs.user.username})
    delete SocketMap[player.id]
    delete this.rjs.playerId
  }
  else {
    let matchedObjects = World[this.rjs.playerId].matchObjects(command)
      , matchedVerb = context.matchVerb(World[this.rjs.playerId], command, matchedObjects)

    if (matchedVerb) {
      yield onRunVerb.call(this, command, matchedObjects, matchedVerb)
    }
    else if(player.location && player.location.verbMissing) {
      matchedVerb = {verb: 'verbMissing', self: player.location}
      yield onRunVerb.call(this, command, matchedObjects, matchedVerb, command.verb)
    }
    else {
      this.emit('output', gray('I didn\'t understand that.'))
    }
  }
}

// run a verb
function *onRunVerb(command, matchedObjects, matchedVerb, verbstrOverride) {
  var playerId   = this.rjs.playerId
    , dobjId     = matchedObjects.dobj.id
    , iobjId     = matchedObjects.iobj.id
    , verbstr    = util.wrapString(verbstrOverride || matchedVerb.verb)
    , argstr     = util.wrapString(command.argstr)
    , dobjstr    = util.wrapString(command.dobjstr)
    , prepstr    = util.wrapString(command.prepstr)
    , iobjstr    = util.wrapString(command.iobjstr)
    , player     = World[playerId]

    , args =  [playerId, dobjId, iobjId, verbstr, argstr, dobjstr, prepstr, iobjstr]
    , verbStatement = matchedVerb.self.id + '[' + util.wrapString(matchedVerb.verb) + ']'
    , code = verbStatement + '(' + args.join(', ') + ')'

  vmLogger.debug(code)

  try {
    vm.runInContext(code, context, {filename: 'Verb::'+matchedVerb.self.id + '.' + matchedVerb.verb, timeout: 500})
  }
  catch (err) {
    util.sendError(player, err)
  }
}

// eval js code and send pretty output
function *onEval(input) {
  var output
    , retVal
    , code

  try {
    code = rewriteEval(input, this.rjs.playerId)

    vmLogger.debug(code)

    retVal = vm.runInContext(code, context, {filename: 'Eval::' + this.rjs.playerId, timeout: 500})
    if (retVal && retVal.__requires_socket__) {
      // TODO we're trusting this code more than usual
      retVal = retVal.__requires_socket__(this)
    }
    output = print(retVal, 1)
  }
  catch (err) {
    output = util.formatError(err)
  }

  this.emit('output', output)
}

function onSaveVerb(data, fn) {
  var worldObject = World[data.objectId]
    , verb        = data.verb
    , player      = World[this.rjs.playerId]

  if (!player || !player.isProgrammer) {
    fn('Unauthorized')
    return
  }

  try {
    let newVerb = makeVerb( verb.pattern
                          , verb.dobjarg
                          , verb.preparg
                          , verb.iobjarg
                          , verb.code
                          )

    worldObject[verb.name] = newVerb
    fn('saved')
  }
  catch (err) {
    fn(err.toString())
  }
}

function onSaveFunction(data, fn) {
  var objectId    = data.objectId
    , worldObject = World[objectId]
    , src         = data.src
    , name        = data.name
    , player      = World[this.rjs.playerId]

  if (!player || !player.isProgrammer) {
    fn('Unauthorized')
    return
  }

  try {
    let newfunction = util.buildFunction({__function__: src}, objectId, name)

    worldObject[name] = newfunction
    fn('saved')
  }
  catch (err) {
    fn(err.toString())
  }
}
