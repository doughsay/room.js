function canEnter(player) {
  if (this.contents.length >= 1) {
    player.tell('There is already someone up in the tree.');
    return false;
  }
  return true;
}
