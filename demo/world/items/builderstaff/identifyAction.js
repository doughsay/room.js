function identifyAction(player, argstr) {
  // Look for the target object, and handle failure
  const target = player.findObject(argstr);
  if (target === fail) {
    player.tell(`There doesn't seem to be any ${argstr} here.`);
    return;
  }
  if (target === ambiguous) {
    player.tell(`There are more than one ${argstr}.`);
    return;
  }

  player.tell(`${util.capitalize(target.name)} is known as '${target.id}' to the Gods of Creation.`);
}
