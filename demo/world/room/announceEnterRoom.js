function announceEnterRoom(sender, recipient, direction) {
  if (sender === recipient) {
    return null;
  }
  return `${ sender.name } enters.`;
}