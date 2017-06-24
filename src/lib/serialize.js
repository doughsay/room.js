function number (value) {
  return typeof value === 'number'
}

function basicValue (value) {
  const type = typeof value
  return type === 'string' || type === 'number' || type === 'boolean'
}

function serializeObject (object) {
  if (object === null) {
    return { object: null }
  } else if (Object.prototype.toString.call(object) === '[object Date]') {
    return { date: object.toISOString() }
  } else if (Object.prototype.toString.call(object) === '[object RegExp]') {
    return { regexp: object.source, flags: object.flags }
  } else if (Array.isArray(object)) {
    return { array: object.map(serialize) }
  } else if (object.__proxy__) {
    return { ref: object.id }
  } else if (typeof object.toString === 'function' && object.toString() === '[object Object]') {
    const serializedObject = {}
    for (const key in object) {
      serializedObject[key] = serialize(object[key])
    }
    return { object: serializedObject }
  }
  throw new Error(`Unable to serialize object: ${object}`)
}

function serializeFunction (fn) {
  if (fn.text) {
    return {
      source: fn.source,
      text: true
    }
  }

  const source = fn.source || fn.toString()
  if (fn.verb) {
    return {
      source,
      verb: true,
      pattern: fn.pattern,
      dobjarg: fn.dobjarg,
      preparg: fn.preparg,
      iobjarg: fn.iobjarg
    }
  }
  return { function: true, source }
}

function serialize (value) {
  const type = typeof value
  if (number(value) && isNaN(value)) { return { NaN: true } }
  if (basicValue(value)) { return { value } }
  if (type === 'undefined') { return { undefined: true } }
  if (type === 'object') { return serializeObject(value) }
  if (type === 'function') { return serializeFunction(value) }
  throw new Error('Unable to serialize value')
}

module.exports = serialize
