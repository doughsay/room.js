function announceOffer(sender, recipient, obj) {
  if (sender === recipient) {
    return `You offer some ${obj.name} for free.`;
  }
  return `${this.name} offers some free ${obj.name}.`;
}
