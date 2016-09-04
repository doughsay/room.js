function describe() {
  let description = '';
  if (this.description) {
    description = this.description;
  }
  if (this.exhausted) {
    description += ' (Empty)';
  } else {
    description += ` (Full of ${this.containedEdible})`;
    if (this.edibleDescription) {
      description += ' ' + this.edibleDescription;
    }
  }
  return description;
}
