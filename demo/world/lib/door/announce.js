function announce(viewFn = views.noOp, sender, msg) {
  const locations = [this].concat(this.sides);

  // Message is sent on both side.
  locations.forEach(side => {
    side.contents.forEach(recipient => {
      recipient.tell(viewFn(sender, recipient, msg));
    });
  });
}
