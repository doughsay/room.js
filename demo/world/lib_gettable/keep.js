function keep({ player, dobj, iobj, verbstr, argstr, dobjstr, prepstr, iobjstr }) {
  if (this.location !== player) {
    player.tell("You don't have that.");
    return;
  }
  
  if (this.keepFlag) {
    this.keepFlag = false;
    player.tell(`You no longer mark ${this.name} for keeping.`);
  } else {
    this.keepFlag = true;
    player.tell(`You mark ${this.name} for keeping.`);
  }
}
