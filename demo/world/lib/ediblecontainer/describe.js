function describe() {
  let description = "";
  if (this.description) {
    description = this.description;
  }
  if (this.exhausted) {
    description += ` The ${this.containerObject} is empty.`;
  } else {
    description += ` The ${this.containerObject} is full of ${this.containedEdible}.`;
    if (this.edibleDescription) {
      description += " " + this.edibleDescription;
    }
  }
  return description; 
}