function zap({ player, dobj, iobj, verbstr, argstr, dobjstr, prepstr, iobjstr }) {
  if (dobj !== undefined) {
    if (dobj.destroyable) {
      dobj.destroy();
      
      function announce(sender, recipient, object) {
        if (sender === recipient) {
          return `You zap the ${object.name} into oblivion.`;
        }
        return `${sender.name} zaps a ${object.name}.`;
      }

      if (player.location) {
        player.location.announce(announce, player, dobj);
      }
    } else {
      player.tell("The gods of creation do not let you proceed.");
    }
  } else {
    player.tell("You don't have that.");
  }
}
