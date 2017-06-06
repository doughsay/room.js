function start () {
  if (this.timerId && run.check(this.timerId)) {
    throw new Error("The watch is already running!")
  }
  this.timerId = run.every(this.id + '.tick()', 1000)
  return true
}
