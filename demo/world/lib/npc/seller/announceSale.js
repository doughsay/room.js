function announceSale(sender, recipient, obj) {
  if (sender === recipient) { 
     return `${this.name} gives you a ${obj.name}.`; 
  }
  return `${this.name} gives a ${obj.name} to ${sender.name}.`;
}