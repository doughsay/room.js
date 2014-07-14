'use strict';

function makeSpecialObject(name) {
  var obj = { id: name }

  function makeToString(name) {
    return  function() {
              return '[object ' + name + ']'
            }
  }

  Object.defineProperty ( obj
                        , 'toString'
                        , { enumerable: false
                          , value: makeToString(name)
                          }
                        )
  Object.freeze(obj)

  return obj
}

module.exports =  { Nothing: makeSpecialObject('Nothing')
                  , FailedMatch: makeSpecialObject('FailedMatch')
                  , AmbiguousMatch: makeSpecialObject('AmbiguousMatch')
                  }
