function play({ player, dobj, iobj, verbstr, argstr, dobjstr, prepstr, iobjstr }) {
  if (this.location !== player) {
    player.tell("You don't have that in hands.");
    return;
  }

  if (this.stropheIndex) {
    if (this.playing === player) {
      player.tell("You are already playing.");
    } else {
      player.tell(`${this.playing.name} is already playing.`);
    }
    return;
  }

  this.stropheIndex = 1;
  this.playing = player;

  this.playEmote();
}
