function tick () {
  this.time = this.time + 24
  if (this.time === 86400) { this.time = 0 }
}
