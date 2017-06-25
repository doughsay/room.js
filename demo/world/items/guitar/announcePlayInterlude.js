function announcePlayInterlude(sender, recipient) {
  if (sender === recipient) {
    return `You play an interlude on the guitar.`;
  }
  return `${sender.name} plays an interlude on the guitar.`;
}
