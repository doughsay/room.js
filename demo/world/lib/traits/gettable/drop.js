function drop({ player, dobj, iobj, verbstr, argstr, dobjstr, prepstr, iobjstr }) {
  if (this.location !== player) {
    player.tell("You don't have that in hands.");
    return;
  }

  if (player.location) {
    player.location.announce(this.announceDropItem, player, this);
    this.location = player.location;
  } else {
    // Robustness: don't drop in the void
    player.tell("You can't do that here");
  }
}
