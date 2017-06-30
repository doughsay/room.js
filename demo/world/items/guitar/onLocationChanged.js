function onLocationChanged() {
  if (this.playing) {
    this.playing.tell('You stop playing.')
  }
  this.stropheIndex = 0;
  this.playing = null;
}
