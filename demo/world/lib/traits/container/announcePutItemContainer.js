function announcePutItemContainer(sender, recipient, obj) {
  if (sender === recipient) {
    return `You put the ${obj.name} into the ${this.name}.`;
  }
  return `${sender.name} puts some ${obj.name} into the ${this.name}.`;
}
