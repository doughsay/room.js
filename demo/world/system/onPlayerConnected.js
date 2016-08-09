function onPlayerConnected(player) {
  player.tell(color.bold.blue(`Welcome ${player.name}! Enter the World!`));
  player.renderPrompt();
  if (player.previousLocation) {
    player.previousLocation.doEnter(player);
    player.previousLocation = null;
  }
}
