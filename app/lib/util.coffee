# Some usful utlity functions.

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
printHelper = (x, maxdepth = 1) ->
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
      "{yellow|#{x}}"
    when 'string'
      if depth == 0
        "'{green|#{safeString x}}'"
      else
        "'{green|#{truncate safeString x}}'"
    when 'boolean'
      "{magenta|#{x.toString()}}"
    when 'undefined'
      '{black|undefined}'
    when 'function'
      if x.verb
        if x.hidden
          '{cyan|[{bold|Private} Verb]}'
        else
          '{cyan|[Verb]}'
      else
        '{gray|[Function]}'
    when 'object'
      if x == null
        '{red|null}'
      else if Object.prototype.toString.call(x) is '[object Date]'
        "{yellow|#{x.toString()}}"
      else if Object.prototype.toString.call(x) is '[object RegExp]'
        "{red|#{x.toString()}}"
      else
        if x in parents
          '{yellow inverse|[CircularReference]}'
        else
          parents.push x
          if Array.isArray(x) or x.isArray?()
            if x.length == 0
              output = '[]'
            else if maxdepth == depth
              output = "{blue|[Array(#{x.length})]}"
            else
              xs = (x.map (y) -> print y, maxdepth, depth+1, '', parents)
              xs[0] = '[ ' + (xs[0].replace indent + '  ', '')
              xs[xs.length-1] += ' ]'
              if prefix != ''
                xs[0] = '\n' + indent + xs[0]
              output = xs.join ',\n'
          else
            if (key for key of x).length == 0
              output = '\\{\\}'
            else if maxdepth == depth
              output = "{blue|#{x.toString()}}"
            else
              xs = []
              for key, value of x
                xs.push print value, maxdepth, depth+1, "{blue|#{key}}" + ': ', parents
              xs[0] = '\\{ ' + (xs[0].replace indent + '  ', '')
              xs[xs.length-1] += ' \\}'
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