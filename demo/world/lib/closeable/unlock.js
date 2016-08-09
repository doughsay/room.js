function unlock({ player, dobj, iobj, verbstr, argstr, dobjstr, prepstr, iobjstr }) {
  if (!this.locked) {
    player.tell(`The ${this.name} is already unlocked.`);
  } else {
    if (iobj === undefined) {
      player.tell("You don't have that.");
    } else if (this.keySet && (this.keySet.length) && this.keySet.includes(iobj.keyId)) {
      this.doUnlock(player);
    } else {
      player.tell(`Cannot unlock ${dobj.name} with ${iobj.name}.`);
    }
  }
}
