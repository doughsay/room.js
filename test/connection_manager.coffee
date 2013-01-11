should = require 'should'
connections = require '../lib/connection_manager'

describe 'connection_manager', ->
  describe 'add', ->

    it 'should add valid players and sockets', ->
      fakePlayer = {id: 1}
      fakeSocket = {id: 'asdf'}
      (->
        connections.add(fakePlayer, fakeSocket)
      ).should.not.throw()

    it 'should not add invalid players', ->
      fakePlayer = null
      fakeSocket = {id: 'asdf'}
      (->
        connections.add(fakePlayer, fakeSocket)
      ).should.throw('invalid player added to connection manager')

      fakePlayer = {foo: 'bar'}
      (->
        connections.add(fakePlayer, fakeSocket)
      ).should.throw('invalid player added to connection manager')

    it 'should not add invalid sockets', ->
      fakePlayer = {id: 1}
      fakeSocket = null
      (->
        connections.add(fakePlayer, fakeSocket)
      ).should.throw('invalid socket added to connection manager')

      fakeSocket = {foo: 'bar'}
      (->
        connections.add(fakePlayer, fakeSocket)
      ).should.throw('invalid socket added to connection manager')

  describe 'remove', ->

    it 'should remove existing sockets', ->
      fakePlayer = {id: 1}
      fakeSocket = {id: 'asdf'}
      connections.add fakePlayer, fakeSocket

      (->
        connections.remove fakeSocket
      ).should.not.throw()

    it 'should throw if an invalid socket is removed', ->
      fakePlayer = {id: 1}
      fakeSocket = {id: 'asdf'}
      connections.add fakePlayer, fakeSocket

      fakeSocket = null
      (->
        connections.remove fakeSocket
      ).should.throw('invalid socket removed from connection manager')

      fakeSocket = {foo: 'bar'}
      (->
        connections.remove fakeSocket
      ).should.throw('invalid socket removed from connection manager')

  describe 'socketFor', ->

    it 'should return a valid socket for a valid player', ->
      fakePlayer = {id: 1}
      fakeSocket = {id: 'asdf'}
      connections.add fakePlayer, fakeSocket

      socket = connections.socketFor(fakePlayer)
      socket.should.be.a('object')
      socket.should.have.property('id', 'asdf')

    it 'should throw if an invalid player is passed', ->
      fakePlayer = {id: 1}
      fakeSocket = {id: 'asdf'}
      connections.add fakePlayer, fakeSocket

      fakePlayer = null
      (->
        connections.socketFor(fakePlayer)
      ).should.throw('invalid player passed to socketFor')

      fakePlayer = {foo: 'bar'}
      (->
        connections.socketFor(fakePlayer)
      ).should.throw('invalid player passed to socketFor')

    it 'should return null if a player without a socket is passed', ->
      fakePlayer = {id: 999}
      should.not.exist connections.socketFor(fakePlayer)

  describe 'playerFor', ->

    it 'should return a valid player for a valid socket', ->
      fakePlayer = {id: 1}
      fakeSocket = {id: 'asdf'}
      connections.add fakePlayer, fakeSocket

      player = connections.playerFor(fakeSocket)
      player.should.be.a('object')
      player.should.have.property('id', 1)

    it 'should throw if an invalid socket is passed', ->
      fakePlayer = {id: 1}
      fakeSocket = {id: 'asdf'}
      connections.add fakePlayer, fakeSocket

      fakeSocket = null
      (->
        connections.playerFor(fakeSocket)
      ).should.throw('invalid socket passed to playerFor')

      fakeSocket = {foo: 'bar'}
      (->
        connections.playerFor(fakeSocket)
      ).should.throw('invalid socket passed to playerFor')

    it 'should return null if a socket without a player is passed', ->
      fakeSocket = {id: 'qwerty'}
      should.not.exist connections.playerFor(fakeSocket)