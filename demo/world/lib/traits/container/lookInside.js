function lookInside({ player, dobj, iobj, verbstr, argstr, dobjstr, prepstr, iobjstr }) {
  if (this.canAccept(player, nothing)) {
    player.tell(this.describeContents());
  }
}
