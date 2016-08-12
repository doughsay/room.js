function fetchTarget(player, argstr) {
  // Look for the target object, and handle failure
  let target = player.findNearby(argstr);
  if (target === fail) {
    player.tell(`There doesn't seem to be a ${argstr} here.`);
    return fail;
  }
  if (target === ambiguous) {
    player.tell(`There are several ${argstr}.`);
    return fail;
  }
  
  return target;
}