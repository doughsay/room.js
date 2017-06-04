const test = require('tape')
const { parseSentence: parse, parseNoun } = require('../../src/lib/parse')

test('parse: "look"', t => {
  const value = 'look'
  const expected = {
    verb: 'look',
    dobjstr: undefined,
    prepstr: undefined,
    iobjstr: undefined,
    argstr: ''
  }
  const actual = parse(value)

  t.deepEqual(actual, expected)
  t.end()
})

test('parse: "take yellow bird"', t => {
  const value = 'take yellow bird'
  const expected = {
    verb: 'take',
    dobjstr: 'yellow bird',
    prepstr: undefined,
    iobjstr: undefined,
    argstr: 'yellow bird'
  }
  const actual = parse(value)

  t.deepEqual(actual, expected)
  t.end()
})

test('parse: "put yellow bird in cuckoo clock"', t => {
  const value = 'put yellow bird in cuckoo clock'
  const expected = {
    verb: 'put',
    dobjstr: 'yellow bird',
    prepstr: 'in',
    iobjstr: 'cuckoo clock',
    argstr: 'yellow bird in cuckoo clock'
  }
  const actual = parse(value)

  t.deepEqual(actual, expected)
  t.end()
})

test('parse: "look at"', t => {
  const value = 'look at'
  const expected = {
    verb: 'look',
    dobjstr: undefined,
    prepstr: 'at',
    iobjstr: undefined,
    argstr: 'at'
  }
  const actual = parse(value)

  t.deepEqual(actual, expected)
  t.end()
})

test('parseNoun: "any book"', t => {
  const value = 'any book'
  const expected = ['any', 'book']

  const actual = parseNoun(value)

  t.deepEqual(actual, expected)
  t.end()
})

test('parseNoun: "a book"', t => {
  const value = 'a book'
  const expected = ['any', 'book']

  const actual = parseNoun(value)

  t.deepEqual(actual, expected)
  t.end()
})

test('parseNoun: "an apple"', t => {
  const value = 'an apple'
  const expected = ['any', 'apple']

  const actual = parseNoun(value)

  t.deepEqual(actual, expected)
  t.end()
})

test('parseNoun: "book"', t => {
  const value = 'book'
  const expected = [undefined, 'book']

  const actual = parseNoun(value)

  t.deepEqual(actual, expected)
  t.end()
})

test('parseNoun: "the book"', t => {
  const value = 'the book'
  const expected = [undefined, 'book']

  const actual = parseNoun(value)

  t.deepEqual(actual, expected)
  t.end()
})

test('parseNoun: "1.book"', t => {
  const value = '1.book'
  const expected = ['1', 'book']

  const actual = parseNoun(value)

  t.deepEqual(actual, expected)
  t.end()
})

test('parseNoun: "book.1"', t => {
  const value = 'book.1'
  const expected = ['1', 'book']

  const actual = parseNoun(value)

  t.deepEqual(actual, expected)
  t.end()
})

test('parseNoun: ""', t => {
  const value = ''
  const expected = [undefined, undefined]

  const actual = parseNoun(value)

  t.deepEqual(actual, expected)
  t.end()
})

test('parseNoun: "book 1"', t => {
  const value = 'book 1'
  const expected = ['1', 'book']

  const actual = parseNoun(value)

  t.deepEqual(actual, expected)
  t.end()
})

test('parseNoun: "all book"', t => {
  const value = 'all book'
  const expected = ['all', 'book']

  const actual = parseNoun(value)

  t.deepEqual(actual, expected)
  t.end()
})

test('parseNoun: undefined', t => {
  const value = undefined
  const expected = [undefined, undefined]

  const actual = parseNoun(value)

  t.deepEqual(actual, expected)
  t.end()
})
