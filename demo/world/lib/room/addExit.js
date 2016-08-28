function addExit(direction, exitObject) {
  const exits = this.exits;
  exits[direction] = exitObject;
  this.exits = exits;
}
