function broadcast(viewFn = views.noOp, sender, msg) {
  players().forEach(recipient => {
    if (recipient.online) {
      recipient.tell(viewFn(sender, recipient, msg));
    }
  });
}
