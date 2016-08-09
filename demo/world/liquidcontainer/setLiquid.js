function setLiquid(name) {
  this.name = `${this.containerObject} of ${name}`;
  if (this.containedLiquid) {
    this.rmAlias(this.containedLiquid);
  }
  this.addAlias(name);
  this.containedLiquid = name;
  this.finished = false;
}