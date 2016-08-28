function canAccept(player, obj) {
  // We may inherit from lib_traits_closeable
  if (this.closed) {
    player.tell(`The ${this.name} is closed.`);
    return false;
  }
  return true;
}
