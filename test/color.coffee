should = require 'should'
color = if process.env.MOO_COV then require '../lib-cov/color' else require '../lib/color'

describe 'color', ->
  describe 'color', ->

    it 'should wrap a string in a span with classes applied', ->
      output = color.color('Hello, World!', 'green')
      output.should.equal('<span class=\'green\'>Hello, World!</span>')