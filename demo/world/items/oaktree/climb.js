function climb({ player, dobj, iobj, verbstr, argstr, dobjstr, prepstr, iobjstr }) {
  const destination = areas.city.treehouse;
  if (this.location.canLeave(player) && destination.canEnter(player)) {
    this.location.doLeave(player, 'up');
    player.location = destination;
    destination.look({ player });
  }
}
