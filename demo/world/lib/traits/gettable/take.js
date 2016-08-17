function take({ player, dobj, iobj, verbstr, argstr, dobjstr, prepstr, iobjstr }) {
  let target = player.location.findInside(dobjstr);
  if (target === fail) {
    player.tell(`I see no ${dobjstr} to take.`);
  } else if (target === ambiguous) {
    player.tell(`I can't tell which ${dobjstr} you meant.`);
  } else {
    target.location = player;
    player.location.announce(this.announceTakeItem, player, this);
  } 
}
