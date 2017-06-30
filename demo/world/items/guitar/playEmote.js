function playEmote() {
  if (!this.playing || !this.playing.location) return;
  if (this.stropheIndex === 0) return;
  
  if (this.stropheIndex === -1) {
    this.playing.location.announce(this.announcePlayEnd.bind(this), this.playing);
    this.stropheIndex = 0;
    this.playing = null;
    return;
  }

  if (this.stropheIndex === 1) {
    this.playing.location.announce(this.announcePlayStart.bind(this), this.playing);
  } else {
    this.playing.location.announce(this.announcePlayInterlude.bind(this), this.playing);
  }
  
  run.in(this.id + '.playStrophe()', 4000);
}
