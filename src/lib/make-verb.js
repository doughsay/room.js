var util = require('./util')

function makeVerb(pattern, dobjarg, preparg, iobjarg, code, name) {
  var objectArgs =  [ 'none'
                    , 'any'
                    , 'this'
                    ]
    , prepArgs =    [ 'none'
                    , 'any'
                    , 'with/using'
                    , 'at/to'
                    , 'in front of'
                    , 'in/inside/into'
                    , 'on top of/on/onto/upon'
                    , 'out of/from inside/from'
                    , 'over'
                    , 'through'
                    , 'under/underneath/beneath'
                    , 'behind'
                    , 'beside'
                    , 'for/about'
                    , 'is'
                    , 'as'
                    , 'off/off of'
                    ]

  if (!pattern || pattern.constructor.name !== 'String') {
    throw new Error('Pattern must be a non-empty string.')
  }

  if (!dobjarg) {
    dobjarg = 'none'
  }
  else if(objectArgs.indexOf(dobjarg) === -1) {
    throw new Error('Direct object argument must be one of: ' + objectArgs.join(', ') + '.')
  }

  if (!preparg) {
    preparg = 'none'
  }
  else if(prepArgs.indexOf(preparg) === -1) {
    throw new Error('Preposition argument must be one of: ' + prepArgs.join(', ') + '.')
  }

  if (!iobjarg) {
    iobjarg = 'none'
  }
  else if(objectArgs.indexOf(iobjarg) === -1) {
    throw new Error('Indirect object argument must be one of: ' + objectArgs.join(', ') + '.')
  }

  name = name ? name : 'anonymous'
  code = code ? code : 'function '+name+'(player, dobj, iobj, verbstr, argstr, dobjstr, prepstr, iobjstr) {\n  \n}'

  return  util.buildVerb( { pattern: pattern
                          , dobjarg: dobjarg
                          , preparg: preparg
                          , iobjarg: iobjarg
                          , code: code
                          })
}

module.exports = makeVerb
