function extinguish({ player, dobj, iobj, verbstr, argstr, dobjstr, prepstr, iobjstr }) {
  if (this.lighted) {
    this.doExtinguish(player);
  } else {
    player.tell(`The ${this.name} is not lit.`);
  }
}
