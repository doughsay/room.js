function light({ player, dobj, iobj, verbstr, argstr, dobjstr, prepstr, iobjstr }) {
  if (!this.lighted) {
    this.doLight(player);
  } else {
    player.tell(`The ${this.name} is already lit.`);
  }
}
