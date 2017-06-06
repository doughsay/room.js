function describe () {
  const parts = [this.description]
  if (this.isRunning()) {
    parts.push("It's ticking softly.")
    parts.push("It's " + this.fuzzyTime() + '.')
  } else {
    parts.push('It appears to be stopped. The time reads ' + this.fuzzyTime())
  }

  return parts.join(' ')
}
