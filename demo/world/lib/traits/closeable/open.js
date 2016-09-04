function open({ player, dobj, iobj, verbstr, argstr, dobjstr, prepstr, iobjstr }) {
  if (this.locked) {
    player.tell(`The ${this.name} is locked.`);
    return;
  }
  if (this.closed) {
    this.doOpen(player);
  } else {
    player.tell(`The ${this.name} is already opened.`);
  }
}
