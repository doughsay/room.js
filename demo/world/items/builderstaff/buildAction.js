function buildAction(player, direction) {
  const dirFromHere = util.normalizeDirection(direction);
  const dirToHere = util.oppositeDirection(dirFromHere);

  // Safeguard
  if (player.location === undefined) {
    player.tell('You cannot build in the Void.');
    return;
  }

  // Small trick: oppositeDirection returns undefined for non-canonical direction.
  if (dirToHere === undefined) {
    player.tell('You can only build known directions.');
    return;
  }

  // Check there isn't already an exit in that direction
  if (player.location.exits[dirFromHere]) {
    player.tell('There is already an exit in that direction.');
    return;
  }

  // Build room
  const idScheme = 'areas.instances.room';
  const id = nextId(idScheme);

  const created = lib.room.new(id);
  created.name = 'Ordinary location';
  created.description = `The place is full of dust, with building materials left all over.
That is the craft of ${player.name} the Builder, so maybe this is not unexpected.`;

  // Add a flag for keeping track of builder-created rooms
  created.builtWithStaff = true;

  // Connect rooms
  player.location.addExit(dirFromHere, created);
  created.addExit(dirToHere, player.location);

  // Announcement in the room
  player.location.announce(
    (sender, recipient, dir) => {
      if (sender === recipient) {
        return `You build a room out of magic dust, ${dir}wards.`;
      }
      return `${sender.name} builds a room out of magic dust, ${dir}wards.`;
    }, player, dirFromHere);
}
