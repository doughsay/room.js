function announceTakeItem(sender, recipient, obj) {
  if (sender === recipient) {
    return `You take the ${obj.name}.`;
  }
  return `${sender.name} takes the ${obj.name}.`;
}