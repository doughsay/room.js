function doUse(agent) {
  this.rmAlias(this.containedEdible);
  this.name = `empty ${this.containerObject}`;
  this.exhausted = true;
}
