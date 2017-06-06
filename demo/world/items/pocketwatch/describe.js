function describe () {
  const parts = [this.description]
  if (this.isRunning()) {
    parts.push('It\'s ticking softly.')
    parts.push(this.fuzzyTime() + '.')
  } else {
    parts.push('It appears to be stopped.')
  }

  return parts.join(' ')
}
