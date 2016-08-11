function say({ player, argstr: message }) {
  if (player.location) {
    player.location.announce(this.announceSay, player, message);
  }
}
