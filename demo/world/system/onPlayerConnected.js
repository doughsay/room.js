function onPlayerConnected(player) {
  // player.tell(color.bold.blue(`Welcome ${player.name}! Explore the World!`));
  // Unless we have hundreds of players, any entrance in the world is worth broadcasting ;)
  this.broadcast((sender, recipient) => {
    if (sender === recipient) {
      return color.bold.blue(`Greetings ${player.name}!`);
    }
    return color.bold.blue(`[${sender.name} enters the world]`);
  }, player);

  player.renderPrompt();
  if (player.previousLocation) {
    // Restore previous location
    player.previousLocation.doEnter(player);
    player.previousLocation = null;
  } else if (!player.location) {
    // Safeguard
    player.tell(color.red('What are you doing in the Void? Sending you back to Heaven.'));
    areas_start_heaven.doEnter(player);
  }
}
