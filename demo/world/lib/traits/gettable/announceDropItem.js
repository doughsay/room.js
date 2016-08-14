function announceDropItem(sender, recipient, obj) {
  if (sender === recipient) {
    return 'Dropped.';
  }
  return `${ sender.name } drops the ${ obj.name }.`;
}