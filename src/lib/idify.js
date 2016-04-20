function titleize(str) {
  if (!str) return '';
  const newStr = String(str).toLowerCase();
  return newStr.replace(/(?:^|\s|-)\S/g, c => c.toUpperCase());
}

function classify(str) {
  return titleize(String(str).replace(/[\W_]/g, ' ')).replace(/\s/g, '');
}

function idify(str) {
  const output = classify(str);
  return output[0].toLowerCase() + output.slice(1);
}

module.exports = idify;
