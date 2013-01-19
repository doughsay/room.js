c = require('./color').color

safeString = (s) ->
  s.replace /\n/g, '\\n'

truncate = (s, length = 25) ->
  if s.length <= 25
    s
  else
    s[0..length] + '...'

# recursive colorful object output
print = (x, indent = '', prefix = '', color = true) ->
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

  # turns colors off
  k = if color then c else ((x) -> x)

  output = switch typeof x
    when 'number'
      k x, 'yellow'
    when 'string'
      # truncate the string if it's in an object or array
      # TODO this doesn't quite work (misses inline arrays)
      if indent == '' and prefix == ''
        "'" + (k (safeString x), 'green') + "'"
      else
        "'" + (k (truncate safeString x), 'green') + "'"
    when 'boolean'
      k x.toString(), 'magenta'
    when 'undefined'
      k 'undefined', 'gray'
    when 'function'
      if x.verb
        k '[MooVerb]', 'cyan'
      else
        k '[Function]', 'cyan'
    when 'object'
      if x == null
        k 'null', 'red'
      else
        if Array.isArray x
          test = '[ ' + ((x.map (y) -> print y, '', '', false).join ', ') + ' ]'
          if test.length <= 50 # arbitrary length threshold to force indented mode instead of inline
            if x.length == 0
              '[]'
            else
              '[ ' + ((x.map (y) -> print y, '', '', color).join ', ') + ' ]'
          else
            xs = (x.map (y) -> print y, indent + '  ', '', color)
            xs[0] = (k 'undefined', 'gray') if not xs[0]? # why is this needed?
            xs[0] = '[ ' + (xs[0].replace indent + '  ', '')
            xs[xs.length-1] += ' ]'
            if prefix != ''
              xs[0] = '\n' + indent + xs[0]
            xs.join ',\n'
        else
          xstest = []
          for key, value of x
            xstest.push print value, '', key + ': ', false
          if xstest.length == 0
            xsteststr = '{}'
          else
            xsteststr = "{ #{xstest.join ', '} }"

          if xsteststr.length <= 50
            xs = []
            for key, value of x
              keyColor = 'blue' #if x.hasOwnProperty(key) then 'blue' else 'gray'
              xs.push print value, '', (k key, keyColor) + ': ', color
            if xs.length == 0
              '{}'
            else
              "{ #{xs.join ', '} }"
          else
            xs = []
            for key, value of x
              keyColor = 'blue' #if x.hasOwnProperty(key) then 'blue' else 'gray'
              xs.push print value, indent + '  ', (k key, keyColor) + ': ', color
            xs[0] = (k 'undefined', 'gray') if not xs[0]? # why is this needed?
            xs[0] = '{ ' + (xs[0].replace indent + '  ', '')
            xs[xs.length-1] += ' }'
            if prefix != ''
              xs[0] = '\n' + indent + xs[0]
            xs.join ',\n'
    else
      k "what is this!?", 'bold red inverse'

  return indent + prefix + output

exports.print = print