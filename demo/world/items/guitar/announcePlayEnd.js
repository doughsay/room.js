function announcePlayEnd(sender, recipient) {
  if (sender === recipient) {
    return `You finish your song with a flourish.`;
  }
  return `${sender.name} finishes the song with a flourish.`;
}
