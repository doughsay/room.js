# parse a command string into a command object:
# e.g.
#
# "put book on table" ->
#   verb: 'put'
#   do:   'book'
#   prep: 'on'
#   io:   'table'
#
# "look" ->
#   verb: 'look'
#   do:   null
#   prep: null
#   io:   null

# "take yellow bird" ->
#   verb: 'take'
#   do:   'yellow bird'
#   prep: null
#   io:   null

# "put yellow bird in cuckoo clock" ->
#   verb: 'put'
#   do:   'yellow bird'
#   prep: 'in'
#   io:   'cuckoo clock'

# warning: prepositions containing other prepositions as
# substrings (using word boundaries) must precede them.
# e.g. 'on top of' comes before 'on', but 'onto' doesn't have to precede 'on'.
prepositions = [
  'with', 'using',
  'at', 'to',
  'in front of',
  'in', 'inside', 'into',
  'on top of', 'on', 'onto', 'upon',
  'out of', 'from inside', 'from',
  'over',
  'through',
  'under', 'underneath', 'beneath',
  'behind',
  'beside',
  'for', 'about',
  'is',
  'as',
  'off of', 'off'
]

prepex = new RegExp '\\b(' + prepositions.join('|') + ')\\b'

sanitize = (text) -> text.trim().replace /\s+/g, ' '

# return [first_word, rest]
chomp = (s) ->
  i = s.indexOf(' ')
  if i != -1
    [s[0..i-1], s[i+1..-1]]
  else
    [s, undefined]

parse_preposition = (text) ->
  search = text.match prepex
  if search?
    prepstr = search[0]
    i = search.index
    dobjstr = if i == 0 then undefined else text[0..(i-2)]
    iobjstr = text[(i+prepstr.length+1)..-1]
    [dobjstr, prepstr, iobjstr]
  else
    false

parse_command = (text) ->
  text = sanitize text
  [verb, rest] = chomp text
  if rest != undefined
    if x = parse_preposition rest
      [dobjstr, prepstr, iobjstr] = x
    else
      dobjstr = rest
  {
    verb:    verb
    argstr:  rest
    dobjstr: dobjstr
    prepstr: prepstr
    iobjstr: iobjstr
  }

exports.parse = parse_command