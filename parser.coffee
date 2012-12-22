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
  'off', 'off of'
]

sanitize = (text) -> text.trim().replace /\s+/g, ' '

chomp = (s) ->
  if s.indexOf(' ') != -1
    [s[0..s.indexOf(' ')-1], s[s.indexOf(' ')+1..-1]]
  else
    [s, undefined]

parse_preposition = (text) ->
  prepsFound = []
  for prep in prepositions
    index = text.indexOf(" #{prep} ")
    if index != -1
      length = prep.length
      if prepsFound[index] == undefined
        prepsFound[index] = {prep: prep, length: length}
      else if prepsFound[index].length < length
        prepsFound[index] = {prep: prep, length: length}
  for o in prepsFound
    if o != undefined
      {prep, length} = o
      i = text.indexOf(prep)
      directObject = text[0..(i-2)]
      indirectObject = text[(i+prep.length+1)..-1]
      return [directObject, prep, indirectObject]
  false

parse_command = (text) ->
  text = sanitize text
  [verb, rest] = chomp text
  if rest != undefined
    if x = parse_preposition rest
      [directObject, preposition, indirectObject] = x
    else
      directObject = rest
  {
    verb: verb
    do:   directObject
    prep: preposition
    io:   indirectObject
  }

exports.parse = parse_command