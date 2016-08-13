function doEnter(player, direction) {
  let dir = (player.location === this.sides[0]) ? this.sides[1] : this.sides[0];
  
  player.location = this;
  this.onTraversal(player);
  
  dir.doEnter(player, direction);
}