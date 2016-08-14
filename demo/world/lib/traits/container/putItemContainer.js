function put({ player, dobj, iobj, verbstr, argstr, dobjstr, prepstr, iobjstr }) {
  if (dobj === fail) {
    player.tell(`I see no ${dobjstr} here.`);
  } else if (dobj === ambiguous) {
    player.tell(`I can't tell which ${dobjstr} you meant.`);
  } else if (dobj.location !== player) {
    player.tell(`You must have the ${dobj.name} in hands.`);
  } else {
    if (this.canAccept(player, dobj)) {
      dobj.location = this;
      player.location.announce(this.announcePutItemContainer.bind(this), player, dobj);
    }
  }
}
