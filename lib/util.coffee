c = require('./color').color

# crappy util for pretty printing objects to the client
exports.old_print = (o) ->
  output = "\n"
  for key, value of o
    if value
      output += "  " + c "#{key}: ", 'yellow'
      output += c(value, 'blue bold') + "\n"
  output

# recursive colorful object output
# TODO: make it work for arrays and objects
exports.print = (x, indent = "", color = true) ->
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
  c = ((x) -> x) if color == false

  output = switch typeof x
    when 'number'
      c x, 'yellow'
    when 'string'
      c "'#{x}'", 'green'
    when 'boolean'
      c x.toString(), 'magenta'
    when 'undefined'
      c 'undefined', 'gray'
    when 'function'
      c '[Function]', 'cyan'
    when 'object'
      if x == null
        c 'null', 'red'
      else
        c '[Object]', 'blue'

  return indent + output