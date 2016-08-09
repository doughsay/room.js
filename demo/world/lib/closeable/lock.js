function lock({ player, dobj, iobj, verbstr, argstr, dobjstr, prepstr, iobjstr }) {
  if (this.locked) {
    player.tell(`The ${this.name} is already locked.`);
  } else {
    if (!this.closed) {
      this.doClose(player);
    }
    if (iobj === undefined) {
      player.tell("You don't have that.");
    } else if (this.keySet && (this.keySet.length) && this.keySet.includes(iobj.keyId)) {
      this.doLock(player);
    } else {
      player.tell(`Cannot lock ${dobj.name} with ${iobj.name}.`);
    }
  }
}
