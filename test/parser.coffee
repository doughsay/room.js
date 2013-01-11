should = require 'should'
parser = require '../lib/parser'

describe 'parser', ->
  describe 'parse', ->

    it 'should parse single verb commands', ->
      command = parser.parse('look')
      command.should.be.a('object')
      command.should.have.property('verb', 'look')
      command.should.not.have.property('argstr')
      command.should.not.have.property('dobjstr')
      command.should.not.have.property('prepstr')
      command.should.not.have.property('iobjstr')

    it 'should parse commands with direct objects', ->
      command = parser.parse('take yellow bird')
      command.should.be.a('object')
      command.should.have.property('verb', 'take')
      command.should.have.property('argstr', 'yellow bird')
      command.should.have.property('dobjstr', 'yellow bird')
      command.should.not.have.property('prepstr')
      command.should.not.have.property('iobjstr')

    it 'should parse commands with direct objects, prepositions and indirect objects', ->
      command = parser.parse('put yellow bird in cuckoo clock')
      command.should.be.a('object')
      command.should.have.property('verb', 'put')
      command.should.have.property('argstr', 'yellow bird in cuckoo clock')
      command.should.have.property('dobjstr', 'yellow bird')
      command.should.have.property('prepstr', 'in')
      command.should.have.property('iobjstr', 'cuckoo clock')