io = require 'socket.io'

phash = require('./lib/hash').phash
parse = require('./lib/parser').parse

connections = require './lib/connection_manager'
formDescriptors = require './lib/forms'
context = require './lib/context'


# A RoomJsSocket represents a websocket connection from the web client.
# It handles the websocket events.
class RoomJsSocket

  # welcome the socket and attach the event listeners
  constructor: (@db, @socket) ->
    @socket.emit 'output', "Welcome to {blue bold|room.js}!"
    @socket.emit 'output', "Type {magenta bold|help} for a list of available commands."

    @socket.on 'disconnect', @onDisconnect
    @socket.on 'input', @onInput
    @socket.on 'form_input_login', @onLogin
    @socket.on 'form_input_create', @onCreate
    @socket.on 'save_verb', @onSaveVerb

  # fires when a websocket disconnects, either by the client closing the connection
  # or calling the `disconnect` method of the socket.
  onDisconnect: =>
    # remove the socket from our list of logged in players, if it exists
    player = connections.playerFor @socket
    connections.remove @socket

    # if there was a player logged in on the socket, call the `player_disconnected` verb on $sys
    if player?
      verb = @db.sys.findVerbByName 'player_disconnected'
      if verb?
        context.runVerb @db, player, verb, @db.sys

  # fires when a socket sends a command
  onInput: (userStr) =>
    str = userStr || ""
    player = connections.playerFor @socket
    if player?
      @onPlayerCommand player, str
    else
      @onCommand str

  # handle an un-logged in command
  onCommand: (str) =>
    switch str
      when "help"
        msg = """
        \nAvailable commands:
        • {magenta bold|login}  - login to an existing account
        • {magenta bold|create} - create a new account
        • {magenta bold|help}   - show this message
        """
        @socket.emit 'output', msg
      when "login"
        @socket.emit 'request_form_input', formDescriptors.login()
      when "create"
        @socket.emit 'request_form_input', formDescriptors.createAccount()
      else
        @socket.emit 'output', "\nUnrecognized command. Type {magenta bold|help} for a list of available commands."

  # handle a player command
  onPlayerCommand: (player, str) =>
    command = parse str

    if command.verb == 'eval' and player.programmer
      context.runEval @db, player, command.argstr
    else if command.verb in ['logout', 'quit']
      player = connections.playerFor @socket
      connections.remove @socket

      if player?
        verb = @db.sys.findVerbByName 'player_disconnected'
        if verb?
          context.runVerb @db, player, verb, @db.sys

      @socket.emit 'output', '\nYou have been logged out.'
    else
      matchedObjects = @db.matchObjects player, command
      matchedVerb = @db.matchVerb player, command, matchedObjects

      {dobj: dobj, iobj: iobj} = matchedObjects
      {verb: verbstr, argstr: argstr, dobjstr: dobjstr, prepstr: prepstr, iobjstr: iobjstr} = command

      if matchedVerb?
        {verb: verb, self: self} = matchedVerb
        context.runVerb @db, player, verb, self, dobj, iobj, verbstr, argstr, dobjstr, prepstr, iobjstr
      else
        huhVerb = player.location()?.findVerbByName 'huh'
        if huhVerb?
          self = player.location()
          context.runVerb @db, player, huhVerb, self, dobj, iobj, verbstr, argstr, dobjstr, prepstr, iobjstr
        else
          player.send "{gray|I didn't understand that.}"

  # handle log in form submission
  onLogin: (userData, fn) =>
    sanitize = (userData) ->
      username: (userData.username || "").trim()
      password: userData.password || ""

    formData = sanitize userData

    matches = @db.players.filter (player) ->
      player.authenticates(formData.username, phash formData.password)

    if matches.length == 1
      player = matches[0]

      other_socket = connections.socketFor player
      if other_socket?
        player.send "{red bold|Disconnected by another login.}"
        other_socket.disconnect()

      connections.add player, @socket

      verb = @db.sys.findVerbByName 'player_connected'
      if verb?
        context.runVerb @db, player, verb, @db.sys

      fn null
    else
      formDescriptor = formDescriptors.login()
      formDescriptor.inputs[0].value = formData.username
      formDescriptor.error = 'Invalid username or password.'
      fn formDescriptor

  # handle player create form submission
  onCreate: (userData, fn) =>
    sanitize = (userData) =>
      name: (userData.name || "").trim()
      username: (userData.username || "").trim()
      password: userData.password || ""
      password2: userData.password2 || ""

    validate = (formData) =>
      formDescriptor = formDescriptors.createAccount()
      formDescriptor.inputs[0].value = formData.name
      formDescriptor.inputs[1].value = formData.username

      valid = true

      if formData.name.length < 2
        valid = false
        formDescriptor.inputs[0].error = "Not long enough"

      if @db.playerNameTaken formData.name
        valid = false
        formDescriptor.inputs[0].error = "Already taken"

      if formData.username.length < 2
        valid = false
        formDescriptor.inputs[1].error = "Not long enough"

      if not formData.username.match /^[_a-zA-Z0-9]*$/
        valid = false
        formDescriptor.inputs[1].error = "Alphanumeric only"

      if @db.usernameTaken formData.username
        valid = false
        formDescriptor.inputs[1].error = "Already taken"

      if formData.password.length < 8
        valid = false
        formDescriptor.inputs[2].error = "Not long enough"

      if formData.password != formData.password2
        valid = false
        formDescriptor.inputs[3].error = "Doesn't match"

      [valid, formDescriptor]

    formData = sanitize userData
    [valid, formDescriptor] = validate formData

    if not valid
      fn formDescriptor
    else
      player = @db.createNewPlayer formData.name, formData.username, phash formData.password
      connections.add player, @socket

      verb = @db.sys.findVerbByName 'player_created'
      if verb?
        context.runVerb @db, player, verb, @db.sys

      fn null

  # handle verb editor submission
  onSaveVerb: (userVerb, fn) =>
    sanitize = (userVerb) ->
      oid: if userVerb.oid? then userVerb.oid else null,
      original_name: userVerb.original_name || ""
      name: (userVerb.name || "").trim().split(' ').filter((s) -> s != '').map((s) -> s.trim().toLowerCase()).join ' '
      hidden: userVerb.hidden || false
      dobjarg: userVerb.dobjarg || null
      preparg: userVerb.preparg || null
      iobjarg: userVerb.iobjarg || null
      code: (userVerb.code || "").trim()

    validate = (verb) =>
      errors = []

      if not verb.oid?
        errors.push "missing oid"
      else
        o = @db.findById(verb.oid)
        if !o?
          errors.push "the object doesn't exist"

      if verb.original_name == ""
        errors.push "missing original name"

      if verb.name == ""
        errors.push "name can't be empty"
      else
        o = @db.findById(verb.oid)
        if verb.name != verb.original_name and verb.name in (o.verbs.map (v) -> v.name)
          errors.push "that verb name already exists on that object"
        else
          verbNames = verb.name.split ' '
          for name in verbNames
            if name == '*' and verbNames.length != 1
              errors.push "* can only be by itself"
            else if name == '*'
              break
            else if name.indexOf('*') == 0 and name.length > 1
              errors.push "* can't appear at the beginning of a verb's name"
            else if not name.match /^[_a-z]+\*?[_a-z]*$/
              errors.push "verb names can be alphanumeric and contain * only once"

      if not verb.dobjarg?
        errors.push "missing direct object argument specifier"
      else if verb.dobjarg not in ['none', 'this', 'any']
        errors.push 'invalid direct object argument specifier'

      if not verb.preparg?
        errors.push "missing preposition argument specifier"
      else if verb.preparg not in ['none', 'any', 'with/using', 'at/to', 'in front of', 'in/inside/into', 'on top of/on/onto/upon', 'out of/from inside/from', 'over', 'through', 'under/underneath/beneath', 'behind', 'beside', 'for/about', 'is', 'as', 'off/off of']
        errors.push 'invalid preposition argument specifier'

      if not verb.iobjarg?
        errors.push "missing indirect object argument specifier"
      else if verb.iobjarg not in ['none', 'this', 'any']
        errors.push 'invalid indirect object argument specifier'

      if verb.code == ''
        errors.push "missing code"

      errors

    player = connections.playerFor @socket
    if player?
      if player.programmer
        verb = sanitize userVerb
        errors = validate verb

        if errors.length > 0
          errors.unshift 'There were errors in your verb code submission:'
          player.send '{red|'+(errors.join '\n')+'}'
          fn {error: true, verb: verb}
        else
          id = verb.oid
          object = @db.findById(id)
          object.saveVerb verb
          player.send '{green|Verb saved!}'
          fn {error: false, verb: verb}
      else
        player.send '{red|You are not allowed to do that.}'
        fn {error: true}
    else
      @socket.emit 'output', "{red|You are not logged in.}"
      fn {error: true}

# This is the websocket server.
# It sets up the websocket listener and handles new socket connections.
exports.RoomJsSocketServer = class

  constructor: (httpServer, db) ->
    ws_server = io.listen(httpServer, {log: false})
    ws_server.sockets.on 'connection', (socket) ->
      new RoomJsSocket db, socket