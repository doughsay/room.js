styles = [
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

class ColoredString
  constructor: (__value__, style = null) ->
    @styles = []
    @styles.push style if style?
    @length = (@__value__ = __value__ or "").length

  toString: -> "<span class='#{@styles.join ' '}'>#{@__value__}</span>"
  valueOf: -> "<span class='#{@styles.join ' '}'>#{@__value__}</span>"

for style in styles
  do (style) ->
    String.prototype.__defineGetter__ style, ->
      return new ColoredString this, style
    ColoredString.prototype.__defineGetter__ style, ->
      @styles.push style
      return @