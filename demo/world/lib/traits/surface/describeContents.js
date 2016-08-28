function describeContents() {
  const thingsHere = this.contents.filter(obj => !!obj.describe);
  if (thingsHere.length === 0) {
    return `The ${this.name} is empty.`;
  } 
  const output = [];
  thingsHere.forEach(obj => {
    const description = obj.describe();
    if (description) {
      output.push(color.gray(`   (On the ${this.name}.) ${util.capitalize(description)}`));
    }
  });
  return output.join('\n');
}
