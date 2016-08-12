function nameAction(player, text, describe) {
  // Safeguard
  if (player.location === undefined) {
    player.tell("You cannot build in the Void.");
    return;
  }
  
  // Only allowed on rooms created with the builder staff
  if (!player.location.builtWithStaff) {
    player.tell("The gods of creation do not allow this.");
    return;    
  }
  
  if (describe) {
    player.location.description = text;
  } else {
    player.location.name = text;
  }
  
  // Announcement in the room
  player.location.announce(
    (sender, recipient, dir) => {
      if (sender === recipient) {
        return `You utter a spell, and the room is updated.`;
      }
      return `${sender.name} utters a spell, and the room is updated.`;
    }, player);
  
}