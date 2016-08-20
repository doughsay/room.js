function unlock({ player, dobj, iobj, verbstr, argstr, dobjstr, prepstr, iobjstr }) {
  if (!this.locked) {
    player.tell(`The ${this.name} is already unlocked.`);
  } else {
    if (iobj === fail) {
      player.tell(`I see no ${iobjstr} here.`);
    } else if (iobj === ambiguous) {
      player.tell(`I can't tell which ${dobjstr} you meant.`);
    } else if (this.keySet && (this.keySet.length) && this.keySet.includes(iobj.keyId)) {
      this.doUnlock(player);
    } else {
      player.tell(`You cannot unlock the ${dobj.name} with ${iobj.name}.`);
    }
  }
}
