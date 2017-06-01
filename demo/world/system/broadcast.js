function broadcast(viewFn = views.noOp, sender, msg) {
  allPlayers().forEach(recipient => {
    if (recipient.online) {
      recipient.tell(viewFn(sender, recipient, msg));
    }
  });
}
