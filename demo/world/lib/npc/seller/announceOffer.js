function announceOffer(sender, recipient, obj) {
  if (sender === recipient) { 
     return `You offer a ${obj.name}.`; 
  }
  return `${this.name} offers a free ${obj.name}.`;
}