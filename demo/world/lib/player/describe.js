function describe() {
  if (this.contents.length === 0) {
    return color.bold.magenta(`${this.name} is empty handed.`);
  }
  const output = [color.bold.magenta(`${this.name} is carrying:`)];

  this.contents.forEach(obj => {
    // For robustness, ensure objects have a description method
    if (typeof obj.describe === 'function') {
      output.push(util.capitalize(obj.describe()));
    }
  });
  return output.join('\n   ');
}
