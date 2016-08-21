function canAccept(player, obj) {
  if (this.maxItems && (this.contents.length >= this.maxItems)) {
    player.tell(`The ${this.name} cannot hold more items.`);
    return false;
  }
  return true;
}
