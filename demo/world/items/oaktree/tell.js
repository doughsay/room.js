function tell(msg) {
  // Propagate up the tree
  if (msg !== null) {
    areas.city.treehouse.contents.forEach(recipient => {
      recipient.tell(color.gray('(From the ground) ') + msg);
    });
  }
}
