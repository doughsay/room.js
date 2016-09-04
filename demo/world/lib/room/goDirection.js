function goDirection({ player, dobj, iobj, verbstr, argstr, dobjstr, prepstr, iobjstr }) {
  const direction = util.normalizeDirection(argstr);

  if (this.exits[direction]) {
    const destination = this.exits[direction];
    if (this.canLeave(player) && destination.canEnter(player)) {
      this.doLeave(player, direction);
      destination.doEnter(player, direction);
    }
  } else {
    player.tell('You can\'t go in that direction.');
  }
}
