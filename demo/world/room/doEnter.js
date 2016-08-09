function doEnter(player, direction) {
  player.location = this;
  player.location.announce(this.announceEnterRoom, player, direction);
  this.look({ player });
  this.onEnter(player)
}