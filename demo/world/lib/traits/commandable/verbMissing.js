function verMissing({ player, dobj, iobj, verbstr, argstr, dobjstr, prepstr, iobjstr }) {
  const verb = verbstr;
  let found = false;

  if (this.allowedCommands.indexOf(verb) !== -1) {
    // See if any item in the location can accept the command
    const command = { verb, argstr, dobjstr, prepstr, iobjstr };

    found = this.contents.some(item => {
      // It could be good to ignore players here - Since this means having the
      // player will be forced to perform an action, but on the other hand, we
      // may want some players to inherit this trait...
      /* if (item.player) {
        return false;
      } else { */
        return this.delegateCommand(player, item, command);
      /* } */
    });

    if (!found) {
      player.tell(color.gray("There's no one to hear you, at the moment."));
    }
  } else {
    system.onPlayerCommandFailed({ player, dobj, iobj, verbstr, argstr, dobjstr, prepstr, iobjstr });
  }
}
