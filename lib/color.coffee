# Not currently used.  Could be used to throw errors
# if unrecognized styles are sent.
allowed_styles = [
  'bold',
  'italic',
  'underline',
  'inverse',
  'white',
  'grey',
  'black',
  'blue',
  'cyan',
  'green',
  'magenta',
  'red',
  'yellow'
]

# Colorize/stylize a string by wrapping it in a span and applying color and style classes.
exports.color = (str, styles) ->
  "<span class='#{styles}'>#{str}</span>"