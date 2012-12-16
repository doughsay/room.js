typeIsArray = Array.isArray || ( value ) ->
  return {}.toString.call( value ) is '[object Array]'

terminal =
  #styles
  'bold'      : [`'\033[1m'`,  `'\033[22m'`]
  'italic'    : [`'\033[3m'`,  `'\033[23m'`]
  'underline' : [`'\033[4m'`,  `'\033[24m'`]
  'inverse'   : [`'\033[7m'`,  `'\033[27m'`]
  #grayscale
  'white'     : [`'\033[37m'`, `'\033[39m'`]
  'grey'      : [`'\033[90m'`, `'\033[39m'`]
  'black'     : [`'\033[30m'`, `'\033[39m'`]
  #colors
  'blue'      : [`'\033[34m'`, `'\033[39m'`]
  'cyan'      : [`'\033[36m'`, `'\033[39m'`]
  'green'     : [`'\033[32m'`, `'\033[39m'`]
  'magenta'   : [`'\033[35m'`, `'\033[39m'`]
  'red'       : [`'\033[31m'`, `'\033[39m'`]
  'yellow'    : [`'\033[33m'`, `'\033[39m'`]

color =
  web: (styles, string) ->
    if not typeIsArray styles then styles = [styles]
    "<span class='#{styles.join(' ')}'>#{string}</span>"

  terminal: (styles, string) ->
    if not typeIsArray styles then styles = [styles]
    for style in styles
      string = terminal[style][0] + string + terminal[style][1]
    return string

module.exports = (options) ->
  if options?.prototype
    String.prototype.tcolor = (styles) -> color.terminal styles, @
    String.prototype.wcolor = (styles) -> color.web styles, @
  return color