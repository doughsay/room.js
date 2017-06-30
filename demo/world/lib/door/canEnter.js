function canEnter(player) {
  if (this.closed) {
    // From lib.closeable
    player.tell(`The ${this.name} is closed.`);
    return false;
  }

  if (this.sides.length < 2) {
    // Not enough sides for traversal
    player.tell(`The ${this.name} doesn't go anywhere.`);
    return false;
  }

  // Delegate to the other side
  const dir = (player.location === this.sides[0]) ? this.sides[1] : this.sides[0];
  return dir.canEnter(player);
}
