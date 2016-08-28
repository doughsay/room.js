function take({ player, dobj, iobj, verbstr, argstr, dobjstr, prepstr, iobjstr }) {
  if (!dobjstr) {
    player.tell('What?');
  }

  if (this.canAccept(player, nothing)) {
    const target = this.findInside(dobjstr);

    if (target === fail) {
      player.tell(`I see no ${dobjstr} inside the ${this.name}.`);
    } else if (target === ambiguous) {
      player.tell(`I can't tell which ${dobjstr} you meant.`);
    } else {
      target.location = player;
      player.location.announce(this.announceTakeItemContainer.bind(this), player, target);
    }
  }
}
