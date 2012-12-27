# Not currently used.  Could be used to throw errors
# if bad styles are sent.
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

exports.color = (str, styles) ->
  "<span class='#{styles}'>#{str}</span>"