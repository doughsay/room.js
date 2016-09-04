function doLight(player) {
  function announce(sender, recipient, object) {
    if (sender === recipient) {
      return `You light the ${object.name}.`;
    }
    return `${sender.name} lights some ${object.name}.`;
  }

  if (player.location) {
    player.location.announce(announce, player, this);
  }
  this.lighted = true;
}
