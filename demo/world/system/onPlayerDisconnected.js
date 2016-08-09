function onPlayerDisconnected(player) {
  player.location.announce(room.announceLeaveRoom, player, 'away');
  player.previousLocation = player.location;
  player.location = null;
}
