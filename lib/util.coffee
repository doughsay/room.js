c = require('./color').color

# crappy util for pretty printing objects to the client
old_print = (o) ->
  output = "\n"
  for key, value of o
    if value
      output += "  " + c "#{key}: ", 'yellow'
      output += c(value, 'blue bold') + "\n"
  output

safeString = (s) ->
  s.replace /\n/g, '\\n'

truncate = (s, length = 25) ->
  if s.length <= 25
    s
  else
    s[0..length] + '...'

# recursive colorful object output
# TODO: make it work for arrays and objects
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
              xs.push print value, '', (k key, 'blue') + ': ', color
            if xs.length == 0
              '{}'
            else
              "{ #{xs.join ', '} }"
          else
            xs = []
            for key, value of x
              xs.push print value, indent + '  ', (k key, 'blue') + ': ', color
            xs[0] = '{ ' + (xs[0].replace indent + '  ', '')
            xs[xs.length-1] += ' }'
            if prefix != ''
              xs[0] = '\n' + indent + xs[0]
            xs.join ',\n'

  return indent + prefix + output

exports.print = print