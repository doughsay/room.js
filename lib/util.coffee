c = require('./color').color

# util for pretty printing objects to the client
exports.print = (o) ->
  output = "\n"
  for key, value of o
    if value
      output += "  " + c "#{key}: ", 'yellow'
      output += c(value, 'blue bold') + "\n"
  output