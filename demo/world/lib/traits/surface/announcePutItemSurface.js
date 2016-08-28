function announcePutItemSurface(sender, recipient, obj) {
  if (sender === recipient) {
    return `You put the ${obj.name} on the ${this.name}.`;
  }
  return `${sender.name} puts some ${obj.name} one the ${this.name}.`;
}
