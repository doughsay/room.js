function examine({ player, dobj, iobj, verbstr, argstr, dobjstr, prepstr, iobjstr }) {
  function announce(sender, recipient, object) {
    if (sender !== recipient) {
      return `${sender.name} looks at a ${object.name}.`;
    }
  }
  
  if (player.location) {
    player.location.announce(announce, player, this);
  }
  player.tell(util.capitalize(this.describe()));
}
