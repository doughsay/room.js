function onPlayerCreated(player) {
  player.traits = [lib_player];
  player.programmer = true; // let's make everyone a programmer for now.
  player.previousLocation = areas_start_heaven;
}
