function onPlayerCreated(player) {
  player.traits = [lib.player];
  player.programmer = true; // let's make everyone a programmer for now.
  player.previousLocation = areas.start.heaven;
}
