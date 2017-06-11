function minute () {
  return Math.floor((this.time - (this.hour() * 3600)) / 60)
}
