function stop () {
  const canceled = run.cancel(this.timerId)
  delete this.timerId
  return canceled
}
