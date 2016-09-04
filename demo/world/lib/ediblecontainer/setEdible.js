function setEdible(name, description) {
  this.name = `${this.containerObject} of ${name}`;
  if (this.containedLiquid) {
    this.rmAlias(this.containedEdible);
  }
  this.addAlias(name);
  this.containedEdible = name;
  this.edibleDescription = description;
  this.exhausted = false;
}
