function identifyAction(player, argstr) {
  // Look for the target object, and handle failure
  let target = player.findObject(argstr);
  if (target === fail) {
    player.tell(`There doesn't seem to be any ${argstr} here.`);
    return fail;
  }
  if (target === ambiguous) {
    player.tell(`There are more than one ${argstr}.`);
    return fail;
  }
  
  player.tell(`${util.capitalize(target.name)} is known as '${target.id}' to the Gods of Creation.`);
}