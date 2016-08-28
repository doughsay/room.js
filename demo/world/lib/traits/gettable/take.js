function take({ player, dobj, iobj, verbstr, argstr, dobjstr, prepstr, iobjstr }) {
  if (this.location === player) {
    player.tell('You already have that.');
    return;
  }

  player.location.announce(this.announceTakeItem, player, this);
  this.location = player;
}
