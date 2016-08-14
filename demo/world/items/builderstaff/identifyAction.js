function identifyAction(player, argstr) {
  // Look for the target object, and handle failure
  let target = player.findObject(argstr);
  if (target === fail) {
    player.tell(`There doesn't seem to be a ${argstr} here.`);
    return fail;
  }
  if (target === ambiguous) {
    player.tell(`There are several ${argstr}.`);
    return fail;
  }
  
  player.tell(`Identifier for ${target.name}: ${target.id}`);
}