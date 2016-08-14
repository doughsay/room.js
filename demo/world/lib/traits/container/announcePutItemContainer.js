function announcePutItemContainer(sender, recipient, obj) {
  if (sender === recipient) { 
    return `You put the ${obj.name} into the ${this.name}.`; 
  }
  return `${sender.name} puts a ${obj.name} into the ${this.name}.`;
}
