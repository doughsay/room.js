function take({ player, dobj, iobj, verbstr, argstr, dobjstr, prepstr, iobjstr }) {
  if (!dobjstr) {
    player.tell('What?');
  }

  const target = this.findInside(dobjstr);

  if (target === fail) {
    player.tell(`I see no ${dobjstr} inside the ${this.name}.`);
  } else if (target === ambiguous) {
    player.tell(`I can't tell which ${noun(dobjstr)[1]} you meant.`);
  } else {
    target.location = player;
    player.location.announce(this.announceTakeItemSurface.bind(this), player, target);
  }
}
