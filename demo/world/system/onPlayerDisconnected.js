function onPlayerDisconnected(player) {
  if (player.location) {
    player.location.announce(player.location.announceLeaveRoom, player, 'away');
  }
  player.previousLocation = player.location;
  player.location = null;
}
