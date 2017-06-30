function announcePlayStart(sender, recipient) {
  if (sender === recipient) {
    return `You take a deep breath.`;
  }
  return `${sender.name} takes a deep breath.`;
}
