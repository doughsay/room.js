function doEnter(player, direction) {
  const dir = (player.location === this.sides[0]) ? this.sides[1] : this.sides[0];

  this.onTraversal(player);

  dir.doEnter(player, direction);
}
