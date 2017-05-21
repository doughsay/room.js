function loadFromEnv (key, fallback = null, parser = x => x) {
  let value = process.env[key]
  if (!value && !fallback) {
    throw new Error(`Required environment variable ${key} is not set.`)
  }
  value = value === '' || !value ? fallback : parser(value)
  process.stdout.write(`loaded ${typeof value} ${key}=${value}\n`)
  return value
}

function loadBooleanFromEnv (key, fallback = null) {
  const booleanParser = x => x === 'true'
  return loadFromEnv(key, fallback, booleanParser)
}

function loadIntegerFromEnv (key, fallback = null) {
  const integerParser = x => isNaN(parseInt(x, 10)) ? null : parseInt(x, 10)
  return loadFromEnv(key, fallback, integerParser)
}

module.exports = { loadFromEnv, loadBooleanFromEnv, loadIntegerFromEnv }
