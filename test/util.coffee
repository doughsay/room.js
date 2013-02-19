should = require 'should'
mooUtil = if process.env.MOO_COV then require '../lib-cov/util' else require '../lib/util'

describe 'util', ->
  describe 'print', ->

    it 'should return numbers in yellow', ->
      mooUtil.print(7).should.equal('{yellow|7}')

    it 'should return strings in green surrounded by white quotes', ->
      mooUtil.print('test').should.equal('\'{green|test}\'')

    it 'should return booleans in magenta', ->
      mooUtil.print(false).should.equal('{magenta|false}')

    it 'should return undefined in black', ->
      mooUtil.print(undefined).should.equal('{black|undefined}')

    it 'should return functions in gray', ->
      mooUtil.print(->).should.equal('{gray|[Function]}')

    it 'should return null in red', ->
      mooUtil.print(null).should.equal('{red|null}')

    it 'should return compact empty arrays', ->
      mooUtil.print([]).should.equal('[]')

    it 'should return compact empty objects', ->
      mooUtil.print({}).should.equal('\\{\\}')

    it 'should return small arrays inline', ->
      mooUtil.print([1]).should.equal('[ {yellow|1} ]')

    it 'should return small objects inline', ->
      mooUtil.print({foo: 'bar'}).should.equal('\\{ {blue|foo}: \'{green|bar}\' \\}')

    it 'should truncate strings in objects', ->
      mooUtil.print({foo: 'this long string will be truncated'})
        .should.equal('\\{ {blue|foo}: \'{green|this long string will be t...}\' \\}')