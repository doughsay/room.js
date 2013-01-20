c = require('./color').color

safeString = (s) ->
  s.replace /\n/g, '\\n'

truncate = (s, length = 25) ->
  if s.length <= 25
    s
  else
    s[0..length] + '...'

printHelper = (x, maxdepth = 2) ->
  print x, maxdepth

visited = []

# recursive colorful object output
print = (x, maxdepth, depth = 0, prefix = '') ->
  # possible types:
  #
  # number
  # string
  # boolean
  # undefined
  # function
  # object
  #   null
  #   array
  #   date

  indent = ('' for i in [0..depth]).join '  '

  if depth == 0
    visited = []

  output = switch typeof x
    when 'number'
      c x, 'yellow'
    when 'string'
      if depth == 0
        "'" + (c (safeString x), 'green') + "'"
      else
        "'" + (c (truncate safeString x), 'green') + "'"
    when 'boolean'
      c x.toString(), 'magenta'
    when 'undefined'
      c 'undefined', 'gray'
    when 'function'
      if x.verb
        c '[MooVerb]', 'cyan'
      else
        c '[Function]', 'cyan'
    when 'object'
      if x == null
        c 'null', 'red'
      else
        if x in visited
          c '[CircularReference]', 'yellow inverse'
        else
          visited.push x
          if Array.isArray x
            if maxdepth == depth
              c "[Array]", 'blue'
            else if x.length == 0
              '[]'
            else
              xs = (x.map (y) -> print y, maxdepth, depth+1)
              xs[0] = '[ ' + (xs[0].replace indent + '  ', '')
              xs[xs.length-1] += ' ]'
              if prefix != ''
                xs[0] = '\n' + indent + xs[0]
              xs.join ',\n'
          else
            if maxdepth == depth
              if x.mooObject
                c x.toString(), 'blue'
              else
                c "[Object]", 'blue'
            else if (key for key of x).length == 0
              '{}'
            else
              xs = []
              for key, value of x
                keyColor = 'blue'
                xs.push print value, maxdepth, depth+1, (c key, keyColor) + ': '
              xs[0] = '{ ' + (xs[0].replace indent + '  ', '')
              xs[xs.length-1] += ' }'
              if prefix != ''
                xs[0] = '\n' + indent + xs[0]
              xs.join ',\n'

  return indent + prefix + output

hmap = (h, fn) ->
  result = {}
  for key, value of h
    result[key] = fn value
  result

exports.print = printHelper
exports.hmap = hmap