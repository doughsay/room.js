function timeString () {
  const hour = this.hour()
  const minute = this.minute()
  return `${hour}:${minute > 10 ? minute : '0' + minute}`
}
