function close({ player, dobj, iobj, verbstr, argstr, dobjstr, prepstr, iobjstr }) {
  if (!this.closed) {
    this.doClose(player);
  } else {
    player.tell(`The ${this.name} is already closed.`);
  }
}
