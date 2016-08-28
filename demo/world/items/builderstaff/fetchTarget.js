function fetchTarget(player, argstr) {
  // Look for the target object, and handle failure
  const target = player.findNearby(argstr);
  if (target === fail) {
    player.tell(`There doesn't seem to be any ${argstr} here.`);
    return fail;
  }
  if (target === ambiguous) {
    player.tell(`There are more than one ${argstr}.`);
    return fail;
  }

  return target;
}
