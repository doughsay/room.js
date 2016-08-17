function take({ player, dobj, iobj, verbstr, argstr, dobjstr, prepstr, iobjstr }) {
  // If triggered by a item already in player inventory, check in room.
  let target = (dobj.location === player)
    ? player.location.findInside(dobjstr)
    : dobj;
  if (target === fail) {
    player.tell(`I can't see any ${dobjstr} to take.`);
  } else if (target === ambiguous) {
    player.tell(`I can't tell which ${dobjstr} you meant.`);
  } else {
    target.location = player;
    player.location.announce(this.announceTakeItem, player, this);
  } 
}
