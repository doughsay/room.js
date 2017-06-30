function announce(viewFn = views.noOp, sender, msg) {
  if (!this.exits || !this.exits.down) {
    // Safeguard
    return;
  }

  // Announce in the room itself...
  this.contents.forEach(recipient => {
    recipient.tell(viewFn(sender, recipient, msg));
  });
  // ... and propagate down.
  this.exits.down.announce((senderx, recipient, message) => {
    if (recipient !== items.oaktree) {
      return color.gray('(From the tree) ') + viewFn(senderx, recipient, message);
    }
    return null;
  }, sender, msg);
}
