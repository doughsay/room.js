'use strict';
// parse a command string into a command object:
// e.g.

// "put book on table" ->
//   verb: 'put'
//   do:   'book'
//   prep: 'on'
//   io:   'table'

// "look" ->
//   verb: 'look'
//   do:   null
//   prep: null
//   io:   null

// "take yellow bird" ->
//   verb: 'take'
//   do:   'yellow bird'
//   prep: null
//   io:   null

// "put yellow bird in cuckoo clock" ->
//   verb: 'put'
//   do:   'yellow bird'
//   prep: 'in'
//   io:   'cuckoo clock'

// warning: prepositions containing other prepositions as
// substrings (using word boundaries) must precede them.
// e.g. 'on top of' comes before 'on', but 'onto' doesn't have to precede 'on'.

// translated from coffeescript, so it might be a little weird.

var prepositions =  [ 'with', 'using'
                    , 'at', 'to'
                    , 'in front of'
                    , 'in', 'inside', 'into'
                    , 'on top of', 'on', 'onto', 'upon'
                    , 'out of', 'from inside', 'from'
                    , 'over'
                    , 'through'
                    , 'under', 'underneath', 'beneath'
                    , 'behind'
                    , 'beside'
                    , 'for', 'about'
                    , 'is'
                    , 'as'
                    , 'off of', 'off'
                    ]
  , prepex = new RegExp('\\b(' + prepositions.join('|') + ')\\b')

function sanitize(text) {
  return text.trim().replace(/\s+/g, ' ')
}

// return [first_word, rest]
function chomp(s) {
  var i = s.indexOf(' ')

  if (i !== -1) {
    return [s.slice(0, i), s.slice(i + 1)]
  }
  else {
    return [s, void 0]
  }
}

function parsePreposition(text) {
  var search = text.match(prepex)

  if (search !== null) {
    let prepstr = search[0]
      , i = search.index
      , dobjstr = i === 0 ? void 0 : text.slice(0, i - 1)
      , iobjstr = text.slice(i + prepstr.length + 1)

    if (iobjstr === '') {
      iobjstr = void 0
    }

    return [dobjstr, prepstr, iobjstr]
  }
  else {
    return false
  }
}

function parseCommand(text) {
  var parts = chomp(sanitize(text))
    , verb = parts[0]
    , rest = parts[1]
    , dobjstr
    , iobjstr
    , prepstr

  if (typeof rest !== 'undefined') {
    let x = parsePreposition(rest)
    if (x) {
      dobjstr = x[0]
      prepstr = x[1]
      iobjstr = x[2]
    }
    else {
      dobjstr = rest
    }
  }
  return  { verb: verb
          , dobjstr: dobjstr
          , prepstr: prepstr
          , iobjstr: iobjstr
          , argstr: rest || ''
          }
}

module.exports = parseCommand
