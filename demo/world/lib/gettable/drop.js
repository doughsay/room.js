function drop({ player, dobj, iobj, verbstr, argstr, dobjstr, prepstr, iobjstr }) {
  if (this.keepFlag) {
    player.tell(`You have marked ${this.name} for keeping.`)
    return;
  }
  
  if (this.location !== player) {
    player.tell("You don't have that.");
    return;
  }
  
  if (player.location) {
    player.location.announce(this.announceDropItem, player, this);
    this.location = player.location;
    player.inventory({ player });
  } else {
    // Robustness: don't drop in the void
    player.tell("You can't do that here")
  }
}
