function timeString () {
  const hour = this.hour()
  const minute = this.minute()
  return `${hour}:${minute > 9 ? minute : '0' + minute}`
}
