should = require 'should'
hash = if process.env.MOO_COV then require '../lib-cov/hash' else require '../lib/hash'

describe 'hash', ->
  describe 'phash', ->

    it 'should produce sha256 hex digests of strings', ->
      output = hash.phash 'p@ssw0rd'
      output.should.equal('a075d17f3d453073853f813838c15b8023b8c487038436354fe599c3942e1f95')