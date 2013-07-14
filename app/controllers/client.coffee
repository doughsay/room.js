log4js = require '../lib/logger'
logger = log4js.getLogger 'client'

phash = require('../lib/hash').phash
parse = require('../lib/parser').parse

formDescriptors = require '../lib/forms'


# A Client represents a socket.io connection from the web client.
# It handles client messages.
module.exports = class Client

  # welcome the socket and attach the event listeners
  constructor: (@db, @context, @socket) ->
    logger.info 'new socket connection'

    @socket.emit 'output', """
      Welcome to {blue bold|room.js}!
      Type {magenta bold|help} for a list of available commands.
    """

    @socket.on 'disconnect', @onDisconnect
    @socket.on 'input', @onInput
    @socket.on 'form_input_login', @onLogin
    @socket.on 'form_input_create', @onCreate

    @player = null

  # connect a player
  connect: (player, verbToRun = 'player_connected') ->
    @player = player
    @player.socket = @socket
    @player.lastActivity = new Date()

    verb = @db.sys.findVerbByName verbToRun
    if verb?
      @context.runVerb @player, verb, @db.sys
    logger.info "#{@player} connected"

  # disconnect a player
  disconnect: (force) ->
    @player.lastActivity = new Date()
    verb = @db.sys.findVerbByName 'player_disconnected'
    if verb?
      @context.runVerb @player, verb, @db.sys
    @player.socket = null
    if force
      @socket.disconnect()
    logger.info "#{@player} disconnected"
    @player = null

  ###################
  # Event Listeners #
  ###################

  # fires when a socket disconnects, either by the client closing the connection
  # or calling the `disconnect` method of the socket.
  onDisconnect: =>
    if @player?
      @disconnect()

    logger.info "socket disconnected"

  # fires when a socket sends a command
  onInput: (userStr) =>
    str = userStr.trim() || ""

    if @player?
      @player.lastActivity = new Date()
      @onPlayerCommand str
    else
      @onCommand str

  # handle an un-logged in command
  onCommand: (str) =>
    switch str
      when "help"
        msg = """
        Available commands:
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
        @socket.emit 'output', "Unrecognized command. Type {magenta bold|help} for a list of available commands."

  # handle a player command
  onPlayerCommand: (str) =>
    command = parse str

    if command.verb in ['eval', 'evalc'] and @player.programmer
      code = command.argstr.replace(/\\\{/g, '{').replace(/\\\}/g, '}')
      lang = if command.verb is 'eval' then 'javascript' else 'coffeescript'
      @context.runEval @player, lang, code
    else if command.verb in ['logout', 'quit']
      @disconnect()
      @socket.emit 'output', 'You have been logged out.'
    else
      matchedObjects = @db.matchObjects @player, command
      matchedVerb = @db.matchVerb @player, command, matchedObjects

      {dobj: dobj, iobj: iobj} = matchedObjects
      {verb: verbstr, argstr: argstr, dobjstr: dobjstr, prepstr: prepstr, iobjstr: iobjstr} = command

      if matchedVerb?
        {verb: verb, self: self} = matchedVerb
        @context.runVerb @player, verb, self, dobj, iobj, verbstr, argstr, dobjstr, prepstr, iobjstr
      else
        huhVerb = @player.location()?.findVerbByName 'huh'
        if huhVerb?
          self = @player.location()
          @context.runVerb @player, huhVerb, self, dobj, iobj, verbstr, argstr, dobjstr, prepstr, iobjstr
        else
          @player.send "{gray|I didn't understand that.}"

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

      if player.socket?
        player.socket.disconnect()
      @connect player

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
      @connect player, 'player_created'

      fn null