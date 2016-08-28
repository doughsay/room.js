function nameAction(player, text, describe) {
  // Safeguard
  if (player.location === undefined) {
    player.tell('You cannot name the Void.');
    return;
  }

  // Only allowed on rooms created with the builder staff
  if (!player.location.builtWithStaff) {
    player.tell('The Gods of Creation do not allow this.');
    return;
  }

  if (describe) {
    player.location.description = text;
  } else {
    player.location.name = text;
  }

  // Announcement in the room
  player.location.announce(
    (sender, recipient) => {
      if (sender === recipient) {
        return 'You utter a spell, and the room is updated.';
      }
      return `${sender.name} utters a spell, and the room is updated.`;
    }, player);
}
