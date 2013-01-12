should = require 'should'
mooUtil = if process.env.MOO_COV then require '../lib-cov/util' else require '../lib/util'

describe 'util', ->
  describe 'print', ->

    it 'should return numbers in yellow', ->
      mooUtil.print(7).should.equal('<span class=\'yellow\'>7</span>')

    it 'should return strings in green surrounded by white quotes', ->
      mooUtil.print('test').should.equal('\'<span class=\'green\'>test</span>\'')

    it 'should return booleans in magenta', ->
      mooUtil.print(false).should.equal('<span class=\'magenta\'>false</span>')

    it 'should return undefined in gray', ->
      mooUtil.print(undefined).should.equal('<span class=\'gray\'>undefined</span>')

    it 'should return functions in cyan', ->
      mooUtil.print(->).should.equal('<span class=\'cyan\'>[Function]</span>')

    it 'should return null in red', ->
      mooUtil.print(null).should.equal('<span class=\'red\'>null</span>')

    it 'should return compact empty arrays', ->
      mooUtil.print([]).should.equal('[]')

    it 'should return compact empty objects', ->
      mooUtil.print({}).should.equal('{}')

    it 'should return small arrays inline', ->
      mooUtil.print([1]).should.equal('[ <span class=\'yellow\'>1</span> ]')

    it 'should return small objects inline', ->
      mooUtil.print({foo: 'bar'}).should.equal('{ <span class=\'blue\'>foo</span>: \'<span class=\'green\'>bar</span>\' }')

    it 'should truncate strings in objects', ->
      mooUtil.print({foo: 'this long string will be truncated'})
        .should.equal('{ <span class=\'blue\'>foo</span>: \'<span class=\'green\'>this long string will be t...</span>\' }')