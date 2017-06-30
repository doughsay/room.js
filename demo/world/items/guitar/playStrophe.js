function playStrophe() {
  if (!this.playing || !this.playing.location) return;
  if (this.stropheIndex <= 0) return;

  const song = this.song.trim().replace(/(\r\n|\n\r|\r)/g, '\n').split(/\n\n/);

  let strophe = song[this.stropheIndex - 1].split('\n')
    .map((elem) => { return `    ${color.gray(elem)}`; })
    .join('\n');

  this.playing.location.announce((sender, recipient) => {
    return strophe;
  }, this.playing);

  this.stropheIndex = this.stropheIndex + 1;
  if (this.stropheIndex === song.length + 1) {
    this.stropheIndex = -1;
  }

  run.in(this.id + '.playEmote()', 3000);
}
