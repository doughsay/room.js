should = require 'should'
client = require 'socket.io-client'
fs = require 'fs'

RoomJsDb = require('../lib/db').RoomJsDb
RoomJsWebServer = require('../web_server').RoomJsWebServer
RoomJsSocketServer = require('../socket_server').RoomJsSocketServer

describe 'client', ->
  before ->
    @db = new RoomJsDb '_db.test.json', true
    webServer = new RoomJsWebServer 8888, true
    socketServer = new RoomJsSocketServer webServer.getHttpServer(), @db
    @socket = client.connect 'http://127.0.0.1:8888/'

  describe 'connection', ->

    ############################
    # General connection tests #
    ############################

    it 'should establish a websocket connection', ->
      @socket.should.be.ok

    it 'should get a welcome message', (done) ->
      @socket.once 'output', (data) ->
        data.should.equal 'Welcome to {blue bold|room.js}!'
        done()

    ##########################
    # Create user form tests #
    ##########################

    it 'should not be able to create a new user without a name', (done) ->
      @socket.emit 'form_input_create', {name: '', username: 'foo', password: 'p@ssw0rd', password2: 'p@ssw0rd'}, (response) ->
        should.exist response.inputs[0]
        response.inputs[0].should.be.a('object')
        response.inputs[0].should.have.property('error', 'Not long enough')
        done()

    it 'should not be able to create a new user without a username', (done) ->
      @socket.emit 'form_input_create', {name: 'foo', username: '', password: 'p@ssw0rd', password2: 'p@ssw0rd'}, (response) ->
        should.exist response.inputs[1]
        response.inputs[1].should.be.a('object')
        response.inputs[1].should.have.property('error', 'Not long enough')
        done()

    it 'should not be able to create a new user with non-alphanumeric username', (done) ->
      @socket.emit 'form_input_create', {name: 'foo', username: '!@#$%', password: 'p@ssw0rd', password2: 'p@ssw0rd'}, (response) ->
        should.exist response.inputs[1]
        response.inputs[1].should.be.a('object')
        response.inputs[1].should.have.property('error', 'Alphanumeric only')
        done()

    it 'should not be able to create a new user without a long enough password', (done) ->
      @socket.emit 'form_input_create', {name: 'foo', username: 'foo', password: 'foo', password2: 'foo'}, (response) ->
        should.exist response.inputs[2]
        response.inputs[2].should.be.a('object')
        response.inputs[2].should.have.property('error', 'Not long enough')
        done()

    it 'should not be able to create a new user with mismatching passwords', (done) ->
      @socket.emit 'form_input_create', {name: 'foo', username: 'foo', password: 'p@ssw0rd1', password2: 'p@ssw0rd'}, (response) ->
        should.exist response.inputs[3]
        response.inputs[3].should.be.a('object')
        response.inputs[3].should.have.property('error', 'Doesn\'t match')
        done()

    it 'should not be able to create a new user with an already existing player name', (done) ->
      @socket.emit 'form_input_create', {name: 'Gandalf', username: 'foo', password: 'p@ssw0rd', password2: 'p@ssw0rd'}, (response) ->
        should.exist response.inputs[0]
        response.inputs[0].should.be.a('object')
        response.inputs[0].should.have.property('error', 'Already taken')
        done()

    it 'should not be able to create a new user with an already existing username', (done) ->
      @socket.emit 'form_input_create', {name: 'foo', username: 'root', password: 'p@ssw0rd', password2: 'p@ssw0rd'}, (response) ->
        should.exist response.inputs[1]
        response.inputs[1].should.be.a('object')
        response.inputs[1].should.have.property('error', 'Already taken')
        done()

    it 'should be able to create a new user', (done) ->
      @socket.emit 'form_input_create', {name: 'foo', username: 'foo', password: 'p@ssw0rd', password2: 'p@ssw0rd'}, (response) ->
        should.not.exist response
        done()

    ####################
    # Login form tests #
    ####################

    # TODO test failed logins

    it 'should be able to log in', (done) ->
      @socket.emit 'form_input_login', {username: 'root', password: 'p@ssw0rd'}, (response) ->
        should.not.exist response
        done()

    # TODO test an assortment of player commands

    it 'should be able to run commands', (done) ->
      @socket.once 'output', (message) ->
        expectedMessage = """
        \n{yellow bold|A forest clearing}
        The forest thins out here a bit. To the north you can see the entrance to a cave through the bushes. There is also a trap door barely visible in the grass.
        {cyan|You see here:}
        {cyan|blinker}
        {cyan|iron sword}
        {cyan|Larry the bird}
        {cyan|wooden sword}
        {cyan|foo}
        """
        message.should.equal expectedMessage
        done()

      @socket.emit 'input', 'look'