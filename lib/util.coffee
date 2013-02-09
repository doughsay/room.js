# Some usful utlity functions.

c = require('./color').color

# replace newlines in a string with '\n'
safeString = (s) ->
  s.replace /\n/g, '\\n'

# truncate a string to a specified length
truncate = (s, length = 25) ->
  if s.length <= 25
    s
  else
    s[0..length] + '...'

# helper for pretty print function
printHelper = (x, maxdepth = 2) ->
  print x, maxdepth

# helper functions for timing code execution
tstart = -> process.hrtime()
tend = (since) -> ((process.hrtime(since)[1] / 1000000).toFixed 2) + 'ms'

# recursive colorful object output
print = (x, maxdepth, depth = 0, prefix = '', parents = []) ->
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

  output = do -> switch typeof x
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
        if x.hidden
          (c '[', 'cyan') + (c 'Private', 'cyan bold') + (c ' Verb]', 'cyan')
        else
          c '[Verb]', 'cyan'
      else
        c '[Function]', 'cyan'
    when 'object'
      if x == null
        c 'null', 'red'
      else
        if x in parents
          c '[CircularReference]', 'yellow inverse'
        else
          parents.push x
          if Array.isArray x
            if x.length == 0
              output = '[]'
            else if maxdepth == depth
              output = c "[Array]", 'blue'
            else
              xs = (x.map (y) -> print y, maxdepth, depth+1, '', parents)
              xs[0] = '[ ' + (xs[0].replace indent + '  ', '')
              xs[xs.length-1] += ' ]'
              if prefix != ''
                xs[0] = '\n' + indent + xs[0]
              output = xs.join ',\n'
          else
            if (key for key of x).length == 0
              output = '{}'
            else if maxdepth == depth
              output = c x.toString(), 'blue'
            else
              xs = []
              for key, value of x
                keyColor = 'blue'
                xs.push print value, maxdepth, depth+1, (c key, keyColor) + ': ', parents
              xs[0] = '{ ' + (xs[0].replace indent + '  ', '')
              xs[xs.length-1] += ' }'
              if prefix != ''
                xs[0] = '\n' + indent + xs[0]
              output = xs.join ',\n'
          parents.pop()
          return output

  return indent + prefix + output

# map for hashes.  applies fn to all values in a hash.
hmap = (h, fn) ->
  result = {}
  for key, value of h
    result[key] = fn value
  result

# map for hashes including their keys.  applies fn to all key/values in a hash.
hkmap = (h, fn) ->
  result = {}
  for key, value of h
    [nkey, nvalue] = fn key, value
    result[nkey] = nvalue
  result

exports.print = printHelper
exports.hmap = hmap
exports.hkmap = hkmap
exports.tstart = tstart
exports.tend = tend