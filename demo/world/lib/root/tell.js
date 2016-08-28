function tell(msg) {
  if (this.player && msg) {
    this.send(msg);
  }
}
