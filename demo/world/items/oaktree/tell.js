function tell(msg) {
  // Propagate up the tree
  if (msg !== null) {
    areas_city_treehouse.contents.forEach(recipient => {
      recipient.tell(color.gray("(From the ground) ") + msg);
    });
  }
}