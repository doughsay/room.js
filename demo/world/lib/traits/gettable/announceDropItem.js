function announceDropItem(sender, recipient, obj) {
  if (sender === recipient) {
    return `You drop the ${obj.name}.`;
  }
  return `${sender.name} drops some ${obj.name}.`;
}
