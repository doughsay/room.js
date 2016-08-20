function announceLeaveRoom(sender, recipient, direction) {
  if (sender === recipient) {
    return null;
  }
  return `${sender.name} goes ${direction}.`;
}