function (player) {
  function announce(sender, recipient, object) {
    if (sender === recipient) {
      return `You extinguish the ${object.name}.`;
    }
    return `${sender.name} extinguishes a ${object.name}.`;
  }
  
  if (player.location) {
    player.location.announce(announce, player, this);
  }
  this.lighted = false;
}