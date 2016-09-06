function escapeDoubleQuotes(s) {
  return s.replace(/"/g, '\\"');
}

function escapeSlashes(s) {
  return s.replace(/\\/g, '\\\\');
}

module.exports = function wrapString(str) {
  return typeof str === 'undefined'
    ? 'undefined'
    : `"${escapeDoubleQuotes(escapeSlashes(str))}"`;
};
