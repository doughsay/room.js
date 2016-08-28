function examine({ player, dobj, iobj, verbstr, argstr, dobjstr, prepstr, iobjstr }) {
  function announce(sender, recipient, object) {
    if (sender !== recipient) {
      if (sender === object) {
        return `${sender.name} looks at emself.`;
      }
      if (object.player) {
        return `${sender.name} looks at ${object.name}.`;
      }
      return `${sender.name} looks at some ${object.name}.`;
    }
  }

  if (player.location) {
    player.location.announce(announce, player, this);
  }
  player.tell(util.capitalize(this.describe()));
  this.onExamine(player);
}

