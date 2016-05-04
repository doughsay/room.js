function titleize(str) {
  if (!str) return '';
  const newStr = String(str).toLowerCase();
  return newStr.replace(/(?:^|\s|-)\S/g, c => c.toUpperCase());
}

function classify(str) {
  return titleize(String(str).replace(/[\W_]/g, ' ')).replace(/\s/g, '');
}

function idify(str) {
  if (!str) { return ''; }
  const output = classify(str);
  if (!output[0]) { return ''; }
  return output[0].toLowerCase() + output.slice(1);
}

module.exports = idify;
