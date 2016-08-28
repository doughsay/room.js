function announceSale(sender, recipient, obj) {
  if (sender === recipient) {
    return `${this.name} gives you some ${obj.name}.`;
  }
  return `${this.name} gives some ${obj.name} to ${sender.name}.`;
}
