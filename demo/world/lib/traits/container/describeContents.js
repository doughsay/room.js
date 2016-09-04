function describeContents() {
  const thingsHere = this.contents.filter(obj => !!obj.describe);
  if (thingsHere.length === 0) {
    return `The ${this.name} is empty.`;
  }

  const output = [`The ${this.name} contains:`];
  thingsHere.forEach(obj => {
    const description = obj.describe();
    if (description) {
      output.push('   ' + util.capitalize(color.gray(description)));
    }
  });
  return output.join('\n');
}
