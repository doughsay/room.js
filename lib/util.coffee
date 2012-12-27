c = require('./color').color

# util for pretty printing objects to the client
exports.print = (o) ->
  output = "\n"
  output += c "{\n", 'bold white'
  for key, value of o
    if value
      output += "\t" + c "#{key}:\t", 'yellow'
      output += c(value, 'blue bold') + "\n"
  output += c "}", 'bold white'