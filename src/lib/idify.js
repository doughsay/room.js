/**
 * Module for sanitizing object identifier to ensure they are acceptable.
 * - Replace any non-character, spaces, dashes etc., switching to Camel case
 * - Keep the underscores internally (representing a logical hierarchy, and
 *   mapped to a directory in the filesystem DB), but remove duplicates and
 *   trim them.
 */

function titleize (str) {
  if (!str) return ''
  const newStr = String(str).toLowerCase()
  return newStr.replace(/(?:^|\s|-)\S/g, c => c.toUpperCase())
}

function classify (str) {
  return titleize(String(str).replace(/[\W]/g, ' '))
    .replace(/\s/g, '').replace(/[_]+/g, '_').replace(/(^_|_$)/g, '')
}

function idify (str) {
  if (!str) { return '' }
  const output = classify(str)
  if (!output[0]) { return '' }
  return output[0].toLowerCase() + output.slice(1)
}

module.exports = idify
