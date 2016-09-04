function zapAction(player, argstr) {
  // Look for the target object, and handle failure
  const target = this.fetchTarget(player, argstr);
  if (target === fail) {
    return;
  }

  // Check the destroyable flag to only allow destroying player-created objects
  if (!target.createdWithStaff) {
    player.tell(`The Gods of Creation do not let you zap the ${target.name}.`);
    return;
  }

  // Announcement in the room
  if (player.location) {
    player.location.announce(
      (sender, recipient, object) => {
        if (sender === recipient) {
          return `You zap the ${object.name} into oblivion.`;
        }
        return `${sender.name} zaps some ${object.name} into oblivion.`;
      }, player, target);
  }

  // Now, we can proceed to DESTRUCTION
  target.destroy();
}
