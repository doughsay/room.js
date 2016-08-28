function forceAction(player, argstr) {
  // Here the input text should be "force object to action".
  // First invoke the parser to split that
  const command = parse(argstr);

  // Check the output
  if ((command.verb !== 'force') || (command.prepstr !== 'to')) {
    player.tell('Syntax expected: force <object> to <action>');
    return;
  }
  if (command.dobjstr === undefined) {
    player.tell('Force whom?');
    return;
  }

  if (command.iobjstr === undefined) {
    player.tell(`Force ${command.dobjstr} to what?`);
    return;
  }

  // Look around for the target object, and handle failure
  const target = this.fetchTarget(player, command.dobjstr);
  if (target === fail) {
    return;
  }

  // So know we have the target and an action to delegate.
  // It may fail if the command is improper in the target's context.
  const status = this.delegateCommand(target, command.iobjstr);

  if (status) {
    // Announcement in the room
    if (player.location) {
      player.location.announce(
        (sender, recipient, object) => {
          if (sender === recipient) {
            return `You have cast a spell on ${object.name}.`;
          }
          return `${sender.name} has cast a spell on ${object.name}.`;
        }, player, target);
    }
  } else {
    player.tell(`You cannot ${argstr}.`);
  }
}
