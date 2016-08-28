function announce(viewFn = views.noOp, sender, msg) {
  this.contents.forEach(recipient => {
    recipient.tell(viewFn(sender, recipient, msg));
  });
}
