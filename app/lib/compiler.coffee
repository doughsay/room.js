coffee = require 'coffee-script'
vm = require 'vm'

log4js = require './logger'
logger = log4js.getLogger 'compiler'

compile = (lang, code) ->
  try
    wrappedCode = wrapCode lang, code
    compiledCode = switch lang
      when 'coffeescript'
        coffee.compile wrappedCode, bare: true
      when 'javascript'
        wrappedCode
      else
        throw new Error 'invalid verb language specified in compile:', lang

    logger.debug "compiled #{lang} code"
    return vm.createScript compiledCode

  catch e

    logger.warn "failed to compile #{lang} code: #{code}"
    return false

wrapCode = (lang, code) ->
  switch lang
    when 'coffeescript'
      """
      ((player, dobj, iobj, verb, argstr, args, dobjstr, prepstr, iobjstr, pass) ->
      #{code.split('\n').map((line) -> '  ' + line).join('\n')}
      ).call(stack[0].self, stack[0].player, stack[0].dobj, stack[0].iobj, stack[0].verb, stack[0].argstr, stack[0].args, stack[0].dobjstr, stack[0].prepstr, stack[0].iobjstr, stack[0].pass)
      """
    when 'javascript'
      """
      (function(player, dobj, iobj, verb, argstr, args, dobjstr, prepstr, iobjstr, pass) {
      #{code}
      }).call(stack[0].self, stack[0].player, stack[0].dobj, stack[0].iobj, stack[0].verb, stack[0].argstr, stack[0].args, stack[0].dobjstr, stack[0].prepstr, stack[0].iobjstr, stack[0].pass);
      """
    else
      throw new Error 'invalid verb language:', lang

exports.compile = compile