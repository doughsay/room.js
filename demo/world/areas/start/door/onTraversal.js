function onTraversal(player) {
  this.announce((sender, recipient) => {
    return `You hear a distant ${color.cyan('bell ring')}.`;
  }, player);
}
