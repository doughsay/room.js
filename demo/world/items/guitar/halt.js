function halt({ player, dobj, iobj, verbstr, argstr, dobjstr, prepstr, iobjstr }) {
  if (this.location !== player) {
    player.tell("You don't have that in hands.");
    return;
  }
  
  if ((player !== this.playing) || this.stropheIndex === 0) {
    player.tell("You are not playing.");   
  } else {
    if (player.location) {
      player.location.announce(this.announcePlayEnd.bind(this), this.playing);
    }
    this.stropheIndex = 0;    
    this.playing = null;
  }
}

