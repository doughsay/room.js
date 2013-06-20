# Some helper proxies

objectProxy = (obj, cb) ->

  getOwnPropertyDescriptor: (name) ->
    desc = Object.getOwnPropertyDescriptor(obj, name)

    # a trapping proxy's properties must always be configurable
    desc?.configurable = true
    desc

  getPropertyDescriptor: (name) ->
    desc = Object.getPropertyDescriptor(obj, name)

    # a trapping proxy's properties must always be configurable
    desc?.configurable = true
    desc

  getOwnPropertyNames: ->
    Object.getOwnPropertyNames obj

  getPropertyNames: ->
    Object.getPropertyNames obj

  defineProperty: ->
    throw new Error 'defineProperty not implemented'

  delete: (name) ->
    delete obj[name]
    cb()

  fix: ->
    throw new Error 'fix not implemented'

  has: (name) ->
    name of obj

  hasOwn: (name) ->
    ({}).hasOwnProperty.call obj, name

  get: (receiver, name) ->
    if name == 'helper_proxy'
      true
    else if name == 'unProxy'
      -> obj
    else if name == 'isArray'
      -> Array.isArray obj
    else
      obj[name]

  set: (receiver, name, val) ->
    obj[name] = val
    cb()

  enumerate: ->
    key for key of obj

  keys: ->
    Object.keys obj

exports.objectProxyFor = objectProxy