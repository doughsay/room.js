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
        c '[MooVerb]', 'cyan'
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

hmap = (h, fn) ->
  result = {}
  for key, value of h
    result[key] = fn value
  result

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